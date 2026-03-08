from __future__ import annotations

from app.db.pg_pool import pool
from datetime import datetime, timezone
from typing import Optional, Any, Dict


def _iso_z(dt: datetime) -> str:
    # Always return UTC ISO string with trailing Z
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt_utc = dt.astimezone(timezone.utc)
    return dt_utc.isoformat().replace("+00:00", "Z")


def _normalize_row(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not row:
        return None
    d = dict(row)

    # Normalize datetime fields so the rest of your code/UI stays consistent with SQLite outputs
    for k in ("sampled_at", "updated_at", "state_changed_at"):
        v = d.get(k)
        if isinstance(v, datetime):
            d[k] = _iso_z(v)
    return d


def init_db() -> None:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            # Readings
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS environment_readings (
                    id BIGSERIAL PRIMARY KEY,
                    sampled_at TIMESTAMPTZ NOT NULL,
                    temperature DOUBLE PRECISION NOT NULL,
                    humidity DOUBLE PRECISION NOT NULL,
                    co2_estimated DOUBLE PRECISION,
                    node_id TEXT
                );
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_env_sampled_at
                ON environment_readings (sampled_at DESC);
                """
            )

            # Single-row profile (id=1)
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS environment_profile (
                    id SMALLINT PRIMARY KEY,
                    mushroom_type TEXT,
                    stage TEXT,
                    updated_at TIMESTAMPTZ NOT NULL
                );
                """
            )
            cur.execute(
                """
                INSERT INTO environment_profile (id, mushroom_type, stage, updated_at)
                VALUES (1, NULL, NULL, %s)
                ON CONFLICT (id) DO NOTHING;
                """,
                (datetime.now(timezone.utc),),
            )

            # Alerts state
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS environment_alert_state (
                    param TEXT PRIMARY KEY,
                    is_active BOOLEAN NOT NULL,
                    bad_count INTEGER NOT NULL,
                    good_count INTEGER NOT NULL,
                    state_changed_at TIMESTAMPTZ NOT NULL,
                    last_value DOUBLE PRECISION,
                    last_message TEXT
                );
                """
            )

            # Seed rows for temperature + humidity if missing
            now = datetime.now(timezone.utc)
            cur.execute(
                """
                INSERT INTO environment_alert_state
                    (param, is_active, bad_count, good_count, state_changed_at, last_value, last_message)
                VALUES
                    ('temperature', FALSE, 0, 0, %s, NULL, NULL),
                    ('humidity',    FALSE, 0, 0, %s, NULL, NULL)
                ON CONFLICT (param) DO NOTHING;
                """,
                (now, now),
            )
            
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS mushroom_stages (
                    key TEXT PRIMARY KEY,
                    label TEXT NOT NULL
                );
                """
            )

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS mushroom_optimal_ranges (
                    mushroom_type TEXT NOT NULL,
                    stage_key TEXT NOT NULL REFERENCES mushroom_stages(key) ON DELETE CASCADE,
                    temp_min DOUBLE PRECISION NOT NULL,
                    temp_max DOUBLE PRECISION NOT NULL,
                    rh_min DOUBLE PRECISION NOT NULL,
                    rh_max DOUBLE PRECISION NOT NULL,
                    co2_min DOUBLE PRECISION,
                    co2_max DOUBLE PRECISION,
                    co2_note TEXT,
                    PRIMARY KEY (mushroom_type, stage_key)
                );
                """
            )
            cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_mushroom_optimal_ranges_stage
            ON mushroom_optimal_ranges(stage_key);
            """)


            # Seed stages
            cur.execute(
                """
                INSERT INTO mushroom_stages (key, label)
                VALUES
                  ('spawn_run', 'Spawn Run'),
                  ('fruiting',  'Fruiting Phase')
                ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label;
                """
            )

            # Seed optimal ranges (Sri Lanka KB)
            # Note: CO2 is display-only; alerts + recommendations use Temp/RH only.
            rows = [
                # Oyster Mushroom
                ("Oyster Mushroom", "spawn_run", 24, 27, 90, 100, 20000, 20000, "Estimated only (display)"),
                ("Oyster Mushroom", "fruiting", 19, 20, 85, 92, 600, 600, "Estimated only (display)"),

                # Milky Mushroom
                ("Milky Mushroom", "spawn_run", 25, 30, 80, 90, 5000, None, "Estimated only (display)"),     # > 5000
                ("Milky Mushroom", "fruiting", 30, 38, 80, 90, 400, 800, "Estimated only (display)"),

                # Button Mushroom
                ("Button Mushroom", "spawn_run", 24, 24, 80, 85, None, None, "Estimated only (display)"),
                ("Button Mushroom", "fruiting", 12, 18, 85, 90, None, 1000, "Estimated only (display)"),     # < 1000
            ]

            cur.executemany(
                """
                INSERT INTO mushroom_optimal_ranges
                    (mushroom_type, stage_key, temp_min, temp_max, rh_min, rh_max, co2_min, co2_max, co2_note)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (mushroom_type, stage_key) DO UPDATE SET
                    temp_min = EXCLUDED.temp_min,
                    temp_max = EXCLUDED.temp_max,
                    rh_min   = EXCLUDED.rh_min,
                    rh_max   = EXCLUDED.rh_max,
                    co2_min  = EXCLUDED.co2_min,
                    co2_max  = EXCLUDED.co2_max,
                    co2_note = EXCLUDED.co2_note;
                """,
                rows,
            )

        conn.commit()


def insert_reading(
    temperature: float,
    humidity: float,
    co2_estimated: Optional[float],
    node_id: Optional[str],
    sampled_at: Optional[datetime] = None,
) -> Dict[str, Any]:
    ts = sampled_at or datetime.now(timezone.utc)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO environment_readings (sampled_at, temperature, humidity, co2_estimated, node_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (ts, temperature, humidity, co2_estimated, node_id),
            )
            row = cur.fetchone()
        conn.commit()

    out = _normalize_row(row)
    return out or {}


def get_latest_reading() -> Optional[Dict[str, Any]]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM environment_readings
                ORDER BY sampled_at DESC, id DESC
                LIMIT 1;
                """
            )
            row = cur.fetchone()
    return _normalize_row(row)


def get_profile() -> Optional[Dict[str, Any]]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM environment_profile WHERE id = 1;")
            row = cur.fetchone()
    return _normalize_row(row)


def set_profile(mushroom_type: str, stage: str) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE environment_profile
                SET mushroom_type = %s, stage = %s, updated_at = %s
                WHERE id = 1;
                """,
                (mushroom_type, stage, now),
            )
            cur.execute("SELECT * FROM environment_profile WHERE id = 1;")
            row = cur.fetchone()
        conn.commit()

    out = _normalize_row(row)
    return out or {}


def get_alert_states() -> list[Dict[str, Any]]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM environment_alert_state ORDER BY param;")
            rows = cur.fetchall() or []
    return [(_normalize_row(r) or {}) for r in rows]


def get_alert_state(param: str) -> Optional[Dict[str, Any]]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM environment_alert_state WHERE param = %s;",
                (param,),
            )
            row = cur.fetchone()
    return _normalize_row(row)


def update_alert_state(
    param: str,
    is_active: int,
    bad_count: int,
    good_count: int,
    state_changed_at: str,
    last_value: float | None,
    last_message: str | None,
):
    # state_changed_at comes from service as ISO string; convert to datetime for Postgres
    dt = datetime.fromisoformat(state_changed_at.replace("Z", "+00:00"))

    with pool.connection() as conn:
        with conn.cursor() as cur:
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
                (bool(is_active), bad_count, good_count, dt, last_value, last_message, param),
            )
        conn.commit()

    return None
    # return get_alert_state(param)


def reset_alert_states():
    now = datetime.now(timezone.utc)
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE environment_alert_state
                SET is_active = FALSE,
                    bad_count = 0,
                    good_count = 0,
                    state_changed_at = %s,
                    last_value = NULL,
                    last_message = NULL;
                """,
                (now,),
            )
        conn.commit()
    return get_alert_states()


def get_available_dates() -> list[str]:
    """
    Returns dates in Sri Lanka day (Asia/Colombo), newest first.
    Implemented in SQL for efficiency.
    """
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT ((sampled_at AT TIME ZONE 'Asia/Colombo')::date) AS d
                FROM environment_readings
                ORDER BY d DESC;
                """
            )
            rows = cur.fetchall() or []

    return [str(r["d"]) for r in rows]


def get_bucketed_averages(
    start_iso: str,
    end_iso: str,
    bucket_seconds: int,
    offset_seconds: int = 0,
) -> dict[int, dict]:
    """
    Returns mapping:
      bucket_start_epoch_seconds -> {temperature, humidity, co2}

    offset_seconds lets us shift bucket boundaries.
    Example: Asia/Colombo is +05:30, for 1-hour buckets offset_seconds = 1800,
    which makes buckets start at xx:30 UTC (local hour boundaries).
    """
    start_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  FLOOR((EXTRACT(EPOCH FROM sampled_at) + %s) / %s)::bigint AS bucket_id,
                  AVG(temperature) AS temperature_avg,
                  AVG(humidity) AS humidity_avg,
                  AVG(co2_estimated) AS co2_avg
                FROM environment_readings
                WHERE sampled_at >= %s AND sampled_at < %s
                GROUP BY bucket_id
                ORDER BY bucket_id ASC;
                """,
                (offset_seconds, bucket_seconds, start_dt, end_dt),
            )
            rows = cur.fetchall() or []

    out: dict[int, dict] = {}
    for r in rows:
        bucket_id = int(r["bucket_id"])
        bucket_start = bucket_id * bucket_seconds - offset_seconds
        out[bucket_start] = {
            "temperature": r["temperature_avg"],
            "humidity": r["humidity_avg"],
            "co2": r["co2_avg"],
        }
    return out


def get_average_between(start_iso: str, end_iso: str) -> dict:
    start_dt = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))

    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  AVG(temperature) AS temperature_avg,
                  AVG(humidity) AS humidity_avg,
                  AVG(co2_estimated) AS co2_avg,
                  COUNT(*)::int AS n
                FROM environment_readings
                WHERE sampled_at >= %s AND sampled_at < %s;
                """,
                (start_dt, end_dt),
            )
            row = cur.fetchone()

    if not row or row["n"] == 0:
        return {"temperature": None, "humidity": None, "co2": None, "n": 0}

    return {
        "temperature": row["temperature_avg"],
        "humidity": row["humidity_avg"],
        "co2": row["co2_avg"],
        "n": int(row["n"]),
    }


def get_latest_reading_meta():
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT node_id, sampled_at
                FROM environment_readings
                ORDER BY sampled_at DESC
                LIMIT 1;
                """
            )
            row = cur.fetchone()

    if not row:
        return None

    out = dict(row)
    if isinstance(out.get("sampled_at"), datetime):
        out["sampled_at"] = _iso_z(out["sampled_at"])
    return out

def get_recent_readings(limit: int = 13) -> list[Dict[str, Any]]:
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM environment_readings
                ORDER BY sampled_at DESC, id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cur.fetchall() or []

    return [(_normalize_row(r) or {}) for r in rows]