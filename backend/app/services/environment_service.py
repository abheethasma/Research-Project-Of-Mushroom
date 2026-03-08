from __future__ import annotations
import os
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from app.data.environment_solution_data import ENVIRONMENT_SOLUTIONS
from app.services.groq_service import format_solution_with_groq
from app.schemas.environment import EnvironmentSolutionRecommendationOut
from app.db.pg_pool import pool
from app.db.environment_db import (
    get_latest_reading,
    get_latest_reading_meta,
    get_average_between,
    get_bucketed_averages,
    get_available_dates,
    get_profile,
    set_profile,
    get_alert_states,
    reset_alert_states,
)
from app.db.knowledge_db import (
    normalize_mushroom_type,
    get_optimal_range as kb_get_optimal_range,
    list_mushroom_types,
    list_stages,
    list_ranges_for_stage,
)
from app.schemas.environment import (
    EnvironmentReadingIn,
    EnvironmentReadingOut,
    EnvironmentProfileIn,
    EnvironmentProfileOut,
    OptimalRangeOut,
    EnvironmentRecommendationOut,
    RecommendationItemOut,
    HistoryResponseOut,
    HistoryPointOut,
    AvailableDatesOut,
    EnvironmentHealthOut,
    AlertStateOut,
    EnvironmentStatusOut,
)


# ----------------------------
# Readings (fast path: one DB connection)
# ----------------------------
def _iso_z(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt_utc = dt.astimezone(timezone.utc)
    return dt_utc.isoformat().replace("+00:00", "Z")


def _compute_alert_update(
    param: str,
    value: float,
    vmin: float,
    vmax: float,
    st: dict,
    bad_needed: int = 6,
    good_needed: int = 2,
) -> tuple[bool, int, int, datetime, float, str | None]:
    is_active = bool(st["is_active"])
    bad_count = int(st["bad_count"])
    good_count = int(st["good_count"])

    ok = vmin <= value <= vmax

    if ok:
        good_count += 1
        bad_count = 0
    else:
        bad_count += 1
        good_count = 0

    changed = False
    message = None

    if (not is_active) and bad_count >= bad_needed:
        is_active = True
        changed = True
        message = f"{param.capitalize()} out of range. Current {value:.1f}, optimal {vmin}-{vmax}."

    if is_active and good_count >= good_needed:
        is_active = False
        changed = True
        message = f"{param.capitalize()} back to normal. Current {value:.1f}, optimal {vmin}-{vmax}."

    # keep old state_changed_at unless active flag changed
    state_changed_at = datetime.now(timezone.utc) if changed else st["state_changed_at"]
    last_message = message if changed else st.get("last_message")

    return is_active, bad_count, good_count, state_changed_at, value, last_message


def _apply_alert_update(
    cur,
    param: str,
    is_active: bool,
    bad_count: int,
    good_count: int,
    state_changed_at: datetime,
    last_value: float,
    last_message: str | None,
) -> None:
    cur.execute(
        """
        UPDATE environment_alert_state
        SET is_active = %s,
            bad_count = %s,
            good_count = %s,
            state_changed_at = %s,
            last_value = %s,
            last_message = %s
        WHERE param = %s;
        """,
        (is_active, bad_count, good_count, state_changed_at, last_value, last_message, param),
    )


def save_environment_reading(payload: EnvironmentReadingIn) -> EnvironmentReadingOut:
    ts = payload.sampled_at or datetime.now(timezone.utc)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            # 1) Insert reading
            cur.execute(
                """
                INSERT INTO environment_readings (sampled_at, temperature, humidity, co2_estimated, node_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (ts, payload.temperature, payload.humidity, payload.co2, payload.node_id),
            )
            row = cur.fetchone()

            # 2) Get profile (single row)
            cur.execute("SELECT mushroom_type, stage FROM environment_profile WHERE id = 1;")
            prof = cur.fetchone()

            if prof and prof.get("mushroom_type") and prof.get("stage"):
                # 3) Get optimal range (same DB, same connection)
                cur.execute(
                    """
                    SELECT temp_min, temp_max, rh_min, rh_max
                    FROM mushroom_optimal_ranges
                    WHERE mushroom_type = %s AND stage_key = %s
                    LIMIT 1;
                    """,
                    (prof["mushroom_type"], prof["stage"]),
                )
                optimal = cur.fetchone()

                if optimal:
                    # 4) Get both alert states in one query
                    cur.execute(
                        """
                        SELECT *
                        FROM environment_alert_state
                        WHERE param IN ('temperature','humidity');
                        """
                    )
                    states = {r["param"]: r for r in (cur.fetchall() or [])}

                    # 5) Update temperature alert
                    st_t = states.get("temperature")
                    if st_t:
                        upd = _compute_alert_update(
                            "temperature",
                            float(row["temperature"]),
                            float(optimal["temp_min"]),
                            float(optimal["temp_max"]),
                            st_t,
                        )
                        _apply_alert_update(cur, "temperature", *upd)

                    # 6) Update humidity alert
                    st_h = states.get("humidity")
                    if st_h:
                        upd = _compute_alert_update(
                            "humidity",
                            float(row["humidity"]),
                            float(optimal["rh_min"]),
                            float(optimal["rh_max"]),
                            st_h,
                        )
                        _apply_alert_update(cur, "humidity", *upd)

        conn.commit()

    # Normalize sampled_at to "...Z"
    out = dict(row)
    if isinstance(out.get("sampled_at"), datetime):
        out["sampled_at"] = _iso_z(out["sampled_at"])

    return EnvironmentReadingOut(**out)


def get_current_environment_reading() -> EnvironmentReadingOut:
    row = get_latest_reading()
    if not row:
        return EnvironmentReadingOut(
            id=0,
            sampled_at=datetime.fromtimestamp(0, tz=timezone.utc),
            temperature=0.0,
            humidity=0.0,
            co2_estimated=None,
            node_id=None,
            note="No readings saved yet",
        )
    return EnvironmentReadingOut(**row)


# ----------------------------
# Recommendation (Fruiting only)
# ----------------------------
def get_environment_recommendation(
    source: str, date: str | None = None
) -> EnvironmentRecommendationOut:
    temp, rh, n = _get_source_values(source, date)

    if temp is None or rh is None:
        return EnvironmentRecommendationOut(
            source=source,
            used_stage="fruiting",
            temperature=None,
            humidity=None,
            points_used=0,
            recommendations=[],
        )

    items: list[tuple[str, float, str]] = []
    fruiting_ranges = list_ranges_for_stage("fruiting")

    for row in fruiting_ranges:
        r = {
            "temp_min": row["temp_min"],
            "temp_max": row["temp_max"],
            "rh_min": row["rh_min"],
            "rh_max": row["rh_max"],
        }
        pen, reason = _score_match(temp, rh, r)
        items.append((row["mushroom_type"], pen, reason))

    items.sort(key=lambda x: x[1])

    recommendations = [
        RecommendationItemOut(mushroom_type=m, score=float(pen), reason=reason)
        for (m, pen, reason) in items[:5]
    ]

    return EnvironmentRecommendationOut(
        source=source,
        used_stage="fruiting",
        temperature=temp,
        humidity=rh,
        points_used=n,
        recommendations=recommendations,
    )


# ----------------------------
# Options / Profile / Optimal Range
# ----------------------------
def get_environment_options() -> dict:
    return {"mushrooms": list_mushroom_types(), "stages": list_stages()}


def get_environment_profile() -> EnvironmentProfileOut:
    row = get_profile()
    if not row:
        return EnvironmentProfileOut()
    return EnvironmentProfileOut(
        mushroom_type=row.get("mushroom_type"),
        stage=row.get("stage"),
        updated_at=row.get("updated_at"),
    )


def update_environment_profile(payload: EnvironmentProfileIn) -> EnvironmentProfileOut:
    mushroom_type = normalize_mushroom_type(payload.mushroom_type)

    r = kb_get_optimal_range(mushroom_type, payload.stage)
    if not r:
        raise ValueError(f"No optimal range for '{mushroom_type}' at stage '{payload.stage}'")

    row = set_profile(mushroom_type, payload.stage)

    # Profile changed => reset alert counters/state
    reset_alert_states()

    return EnvironmentProfileOut(
        mushroom_type=row.get("mushroom_type"),
        stage=row.get("stage"),
        updated_at=row.get("updated_at"),
    )


def get_optimal_range(mushroom_type: str, stage: str) -> OptimalRangeOut:
    mushroom_type = normalize_mushroom_type(mushroom_type)

    r = kb_get_optimal_range(mushroom_type, stage)
    if not r:
        raise ValueError(f"No optimal range for '{mushroom_type}' at stage '{stage}'")

    return OptimalRangeOut(**r)


# ----------------------------
# Status
# ----------------------------
def get_environment_status() -> EnvironmentStatusOut:
    reading = get_current_environment_reading()
    prof = get_environment_profile()

    optimal = None
    if prof.mushroom_type and prof.stage:
        try:
            optimal = kb_get_optimal_range(prof.mushroom_type, prof.stage)
        except Exception:
            optimal = None

    alerts_raw = get_alert_states()
    alerts = [
        AlertStateOut(
            param=a["param"],
            active=bool(a["is_active"]),
            bad_count=int(a["bad_count"]),
            good_count=int(a["good_count"]),
            state_changed_at=a["state_changed_at"],
            last_value=a.get("last_value"),
            last_message=a.get("last_message"),
        )
        for a in alerts_raw
    ]

    return EnvironmentStatusOut(
        reading=reading,
        profile=prof,
        optimal_range=optimal,
        alerts=alerts,
    )


# ----------------------------
# History
# ----------------------------
def _floor_epoch(epoch: int, bucket_seconds: int) -> int:
    return (epoch // bucket_seconds) * bucket_seconds


def get_environment_history(range_name: str, date: str | None = None) -> HistoryResponseOut:
    now = datetime.now(timezone.utc)
    now_epoch = int(now.timestamp())

    offset_seconds = 0

    if range_name == "last_1h":
        bucket_seconds = 300
        buckets = 12
        end_epoch = _floor_epoch(now_epoch, bucket_seconds) + bucket_seconds
        start_epoch = end_epoch - buckets * bucket_seconds

    elif range_name == "last_day":
        bucket_seconds = 3600
        buckets = 24
        end_epoch = _floor_epoch(now_epoch, bucket_seconds) + bucket_seconds
        start_epoch = end_epoch - buckets * bucket_seconds

    elif range_name == "date":
        if not date:
            raise ValueError("date is required when range=date")

        bucket_seconds = 3600
        buckets = 24

        local_tz = ZoneInfo("Asia/Colombo")
        local_start = datetime.fromisoformat(date).replace(tzinfo=local_tz)
        local_end = local_start + timedelta(days=1)

        start_dt_utc = local_start.astimezone(timezone.utc)
        end_dt_utc = local_end.astimezone(timezone.utc)

        start_epoch = int(start_dt_utc.timestamp())
        end_epoch = int(end_dt_utc.timestamp())

        offset_seconds = int(local_start.utcoffset().total_seconds()) % bucket_seconds

    else:
        raise ValueError("range must be one of: last_1h, last_day, date")

    start_iso = datetime.fromtimestamp(start_epoch, tz=timezone.utc).isoformat()
    end_iso = datetime.fromtimestamp(end_epoch, tz=timezone.utc).isoformat()

    agg = get_bucketed_averages(
        start_iso,
        end_iso,
        bucket_seconds,
        offset_seconds=offset_seconds,
    )

    points: list[HistoryPointOut] = []
    for i in range(buckets):
        bucket_start_epoch = start_epoch + i * bucket_seconds
        ts = datetime.fromtimestamp(bucket_start_epoch, tz=timezone.utc)

        v = agg.get(bucket_start_epoch)
        if v:
            points.append(
                HistoryPointOut(
                    ts=ts,
                    temperature=v["temperature"],
                    humidity=v["humidity"],
                    co2=v["co2"],
                )
            )
        else:
            points.append(HistoryPointOut(ts=ts, temperature=None, humidity=None, co2=None))

    return HistoryResponseOut(range=range_name, bucket_seconds=bucket_seconds, points=points)


def get_environment_available_dates() -> AvailableDatesOut:
    return AvailableDatesOut(dates=get_available_dates())


# ----------------------------
# Recommendation helpers
# ----------------------------
def _penalty(value: float, vmin: float, vmax: float) -> float:
    if value < vmin:
        return vmin - value
    if value > vmax:
        return value - vmax
    return 0.0


def _score_match(temp: float, rh: float, r: dict) -> tuple[float, str]:
    t_pen = _penalty(temp, r["temp_min"], r["temp_max"])
    h_pen = _penalty(rh, r["rh_min"], r["rh_max"])

    total_pen = t_pen * 1.0 + h_pen * 0.5

    parts = []
    parts.append("Temp within range" if t_pen == 0 else f"Temp off by {t_pen:.1f}°C")
    parts.append("RH within range" if h_pen == 0 else f"RH off by {h_pen:.1f}%")

    return total_pen, ", ".join(parts)


def _get_source_values(source: str, date: str | None):
    now = datetime.now(timezone.utc)
    now_epoch = int(now.timestamp())

    if source == "current":
        latest = get_latest_reading()
        if not latest:
            return None, None, 0
        return float(latest["temperature"]), float(latest["humidity"]), 1

    if source == "last_1h":
        end_epoch = _floor_epoch(now_epoch, 300) + 300
        start_epoch = end_epoch - 12 * 300
    elif source == "last_day":
        end_epoch = _floor_epoch(now_epoch, 3600) + 3600
        start_epoch = end_epoch - 24 * 3600
    elif source == "date":
        if not date:
            raise ValueError("date is required when source=date")

        local_tz = ZoneInfo("Asia/Colombo")
        local_start = datetime.fromisoformat(date).replace(tzinfo=local_tz)
        local_end = local_start + timedelta(days=1)

        start_epoch = int(local_start.astimezone(timezone.utc).timestamp())
        end_epoch = int(local_end.astimezone(timezone.utc).timestamp())
    else:
        raise ValueError("source must be one of: current, last_1h, last_day, date")

    start_iso = datetime.fromtimestamp(start_epoch, tz=timezone.utc).isoformat()
    end_iso = datetime.fromtimestamp(end_epoch, tz=timezone.utc).isoformat()
    avg = get_average_between(start_iso, end_iso)

    if avg["n"] == 0 or avg["temperature"] is None or avg["humidity"] is None:
        return None, None, 0

    return float(avg["temperature"]), float(avg["humidity"]), int(avg["n"])


# ----------------------------
# Health
# ----------------------------
def get_environment_health(offline_after_seconds: int = 60) -> EnvironmentHealthOut:
    meta = get_latest_reading_meta()
    if not meta:
        return EnvironmentHealthOut(
            online=False,
            last_seen=None,
            node_id=None,
            seconds_since_last=None,
        )

    last_seen = meta["sampled_at"]
    if isinstance(last_seen, str):
        last_seen_dt = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
    else:
        last_seen_dt = last_seen

    now = datetime.now(timezone.utc)
    seconds_since = int((now - last_seen_dt).total_seconds())

    return EnvironmentHealthOut(
        online=seconds_since <= offline_after_seconds,
        last_seen=last_seen_dt,
        node_id=meta["node_id"],
        seconds_since_last=seconds_since,
    )

def _normalize_lang(lang: str | None) -> str:
    if not lang:
        return "en"

    value = lang.strip().lower()
    if value in {"si", "sinhala", "සිංහල"}:
        return "si"
    return "en"


def _detect_primary_issue(reading: dict, optimal: dict) -> tuple[str | None, float | None, float | None, float | None]:
    temp = reading.get("temperature")
    rh = reading.get("humidity")
    co2 = reading.get("co2_estimated")

    if temp is not None:
        if temp > optimal["temp_max"]:
            return "TEMP_HIGH", float(temp), float(optimal["temp_min"]), float(optimal["temp_max"])
        if temp < optimal["temp_min"]:
            return "TEMP_LOW", float(temp), float(optimal["temp_min"]), float(optimal["temp_max"])

    if rh is not None:
        if rh < optimal["rh_min"]:
            return "RH_LOW", float(rh), float(optimal["rh_min"]), float(optimal["rh_max"])
        if rh > optimal["rh_max"]:
            return "RH_HIGH", float(rh), float(optimal["rh_min"]), float(optimal["rh_max"])

    co2_max = optimal.get("co2_max")
    if co2 is not None and co2_max is not None:
        if float(co2) > float(co2_max):
            return "CO2_HIGH", float(co2), None, float(co2_max)

    return None, None, None, None


def _build_plain_solution_message(
    *,
    lang: str,
    title: str,
    immediate: list[str],
    short_term: list[str],
    long_term: list[str],
    safety: list[str],
) -> str:
    if lang == "si":
        lines = [f"{title}."]
        if immediate:
            lines.append("දැන් කරන්න:")
            for step in immediate[:2]:
                lines.append(f"- {step}")
        if short_term:
            lines.append("ඊළඟට කරන්න:")
            lines.append(f"- {short_term[0]}")
        if long_term:
            lines.append("දිගුකාලීනව:")
            lines.append(f"- {long_term[0]}")
        if safety:
            lines.append("ආරක්ෂාව:")
            lines.append(f"- {safety[0]}")
        return "\n".join(lines)

    lines = [f"{title}."]
    if immediate:
        lines.append("Do this now:")
        for step in immediate[:2]:
            lines.append(f"- {step}")
    if short_term:
        lines.append("Next:")
        lines.append(f"- {short_term[0]}")
    if long_term:
        lines.append("Long term:")
        lines.append(f"- {long_term[0]}")
    if safety:
        lines.append("Safety:")
        lines.append(f"- {safety[0]}")
    return "\n".join(lines)


def get_environment_solution_recommendation(lang: str = "en") -> EnvironmentSolutionRecommendationOut:
    language = _normalize_lang(lang)

    profile = get_profile()
    if not profile or not profile.get("mushroom_type") or not profile.get("stage"):
        note = (
            "Please select mushroom type and stage first."
            if language == "en"
            else "කරුණාකර මුලින්ම mushroom type සහ stage තෝරන්න."
        )
        return EnvironmentSolutionRecommendationOut(
            language=language,
            note=note,
        )

    reading = get_latest_reading()
    if not reading:
        note = (
            "No environment reading found yet."
            if language == "en"
            else "තවම environment reading එකක් නොමැත."
        )
        return EnvironmentSolutionRecommendationOut(
            language=language,
            mushroom_type=profile.get("mushroom_type"),
            stage=profile.get("stage"),
            note=note,
        )

    optimal = kb_get_optimal_range(profile["mushroom_type"], profile["stage"])
    if not optimal:
        note = (
            "Optimal range not found for current profile."
            if language == "en"
            else "දැනට තෝරා ඇති profile සඳහා optimal range එක හමු නොවීය."
        )
        return EnvironmentSolutionRecommendationOut(
            language=language,
            mushroom_type=profile.get("mushroom_type"),
            stage=profile.get("stage"),
            note=note,
        )

    issue_code, current_value, optimal_min, optimal_max = _detect_primary_issue(reading, optimal)

    if not issue_code:
        note = (
            "Environment is within the optimal range right now."
            if language == "en"
            else "දැනට පරිසර අගයන් සුදුසු පරාසය තුළ ඇත."
        )
        return EnvironmentSolutionRecommendationOut(
            language=language,
            mushroom_type=profile.get("mushroom_type"),
            stage=profile.get("stage"),
            note=note,
        )

    solution = ENVIRONMENT_SOLUTIONS[issue_code][language]
    metric = ENVIRONMENT_SOLUTIONS[issue_code]["metric"]

    immediate = solution.get("immediate", [])
    short_term = solution.get("short_term", [])
    long_term = solution.get("long_term", [])
    safety = solution.get("safety", [])
    title = solution.get("title")

    generated_message = format_solution_with_groq(
        language=language,
        title=title,
        current_value=current_value,
        optimal_min=optimal_min,
        optimal_max=optimal_max,
        immediate=immediate,
        short_term=short_term,
        long_term=long_term,
        safety=safety,
    )

    used_llm = bool(generated_message)

    if not generated_message:
        generated_message = _build_plain_solution_message(
            lang=language,
            title=title,
            immediate=immediate,
            short_term=short_term,
            long_term=long_term,
            safety=safety,
        )

    return EnvironmentSolutionRecommendationOut(
        language=language,
        mushroom_type=profile.get("mushroom_type"),
        stage=profile.get("stage"),
        issue_code=issue_code,
        metric=metric,
        current_value=current_value,
        optimal_min=optimal_min,
        optimal_max=optimal_max,
        title=title,
        immediate=immediate,
        short_term=short_term,
        long_term=long_term,
        safety=safety,
        llm_message=generated_message,
        used_llm=used_llm,
    )