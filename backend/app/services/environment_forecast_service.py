from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import time
import httpx
import joblib
import pandas as pd

from app.db.environment_db import get_recent_readings, get_profile
from app.db.knowledge_db import get_optimal_range as kb_get_optimal_range
from app.schemas.environment import EnvironmentForecastOut, OutdoorWeatherOut

WEATHER_CACHE = {
    "data": None,
    "ts": 0,
}
WEATHER_CACHE_TTL = 300  # 5 minutes

FORECAST_CACHE = {}
FORECAST_CACHE_TTL = 60  # seconds

MODEL_CACHE: dict = {}

HORIZON_CONFIG = {
    "1h": {
        "minutes": 60,
        "label": "Next 1 hour",
        "kind": "five_min",
        "raw_needed": 16,
        "temp_candidates": ["temp_forecast_model_1h.pkl"],
        "rh_candidates": ["rh_forecast_model_1h.pkl"],
        "info_candidates": ["forecast_model_info_1h.pkl"],
    },
    "6h": {
        "minutes": 360,
        "label": "Next 6 hours",
        "kind": "hourly",
        "raw_needed": 864, 
        "temp_candidates": ["temp_forecast_model_6h.pkl"],
        "rh_candidates": ["rh_forecast_model_6h.pkl"],
        "info_candidates": ["forecast_model_info_6h.pkl"],
    },
    "24h": {
        "minutes": 1440,
        "label": "Next 24 hours",
        "kind": "hourly",
        "raw_needed": 864, 
        "temp_candidates": ["temp_forecast_model_24h.pkl"],
        "rh_candidates": ["rh_forecast_model_24h.pkl"],
        "info_candidates": ["forecast_model_info_24h.pkl"],
    },
}


def _parse_dt(value) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _model_dir() -> Path:
    default_dir = Path(__file__).resolve().parents[2] / "models"
    custom_dir = os.getenv("FORECAST_MODEL_DIR")
    if custom_dir:
        p = Path(custom_dir)
        if not p.is_absolute():
            p = Path(__file__).resolve().parents[2] / custom_dir
        return p
    return default_dir


def _first_existing(model_dir: Path, candidates: list[str]) -> Path:
    for name in candidates:
        p = model_dir / name
        if p.exists():
            return p
    raise ValueError(f"Model file not found. Tried: {candidates}")


def _load_model_bundle(horizon: str):
    if horizon not in HORIZON_CONFIG:
        raise ValueError("Unsupported horizon. Use 1h, 6h, or 24h.")

    if horizon in MODEL_CACHE:
        return MODEL_CACHE[horizon]

    config = HORIZON_CONFIG[horizon]
    model_dir = _model_dir()

    temp_path = _first_existing(model_dir, config["temp_candidates"])
    rh_path = _first_existing(model_dir, config["rh_candidates"])
    info_path = _first_existing(model_dir, config["info_candidates"])

    bundle = {
        "temp_model": joblib.load(temp_path),
        "rh_model": joblib.load(rh_path),
        "info": joblib.load(info_path),
    }
    MODEL_CACHE[horizon] = bundle
    return bundle


def _compare_range(value: float, vmin: float, vmax: float) -> str:
    if value < vmin:
        return "low"
    if value > vmax:
        return "high"
    return "within"


def _build_warning_message(temp_status: str, rh_status: str, label: str) -> str:
    parts = []

    if temp_status == "high":
        parts.append(f"Temperature is predicted to rise above the optimal range in the {label.lower()}.")
    elif temp_status == "low":
        parts.append(f"Temperature is predicted to fall below the optimal range in the {label.lower()}.")

    if rh_status == "high":
        parts.append(f"Humidity is predicted to rise above the optimal range in the {label.lower()}.")
    elif rh_status == "low":
        parts.append(f"Humidity is predicted to fall below the optimal range in the {label.lower()}.")

    if not parts:
        return f"Forecast indicates temperature and humidity should remain within the optimal range for the {label.lower()}."

    return " ".join(parts)


def _get_current_outdoor_weather() -> dict:
    now = time.time()

    if WEATHER_CACHE["data"] and (now - WEATHER_CACHE["ts"] < WEATHER_CACHE_TTL):
        return WEATHER_CACHE["data"]

    lat = os.getenv("WEATHER_LAT")
    lon = os.getenv("WEATHER_LON")

    if not lat or not lon:
        raise ValueError("WEATHER_LAT and WEATHER_LON must be set in the backend environment.")

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,rain",
        "timezone": "auto",
    }

    with httpx.Client(timeout=20.0) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    current = data.get("current") or {}
    
    temperature = current.get("temperature_2m")
    humidity = current.get("relative_humidity_2m")
    rain = current.get("rain")

    if temperature is None or humidity is None:
        raise ValueError("Outdoor weather API response is missing required values.")

    result = {
        "temperature": float(temperature),
        "humidity": float(humidity),
        "rainfall": float(rain or 0.0),
    }

    WEATHER_CACHE["data"] = result
    WEATHER_CACHE["ts"] = now
    return result

def _pick_recent_value(recent: list[dict], lag_index: int, key: str) -> float:
    """
    recent is expected newest-first.
    If requested lag is missing, use the oldest available reading.
    """
    if not recent:
        raise ValueError("No recent readings available.")

    idx = min(lag_index, len(recent) - 1)
    return float(recent[idx][key])


def _pick_hourly_value(hourly: pd.DataFrame, lag_hours: int, column: str) -> float:
    """
    hourly is expected oldest->newest.
    If requested lag is missing, use the oldest available hourly value.
    """
    if hourly.empty:
        raise ValueError("No hourly readings available.")

    latest_pos = len(hourly) - 1
    pos = max(latest_pos - lag_hours, 0)
    return float(hourly.iloc[pos][column])

def _build_1h_feature_row(recent: list[dict], outdoor: dict, feature_cols: list[str]) -> pd.DataFrame:
    if not recent:
        raise ValueError("No recent indoor readings found for 1h forecasting.")

    latest = recent[0]
    latest_ts = _parse_dt(latest["sampled_at"]).astimezone(ZoneInfo("Asia/Colombo"))

    feature_map = {
        "indoor_temp": float(latest["temperature"]),
        "indoor_rh": float(latest["humidity"]),
        "outdoor_temp": float(outdoor["temperature"]),
        "outdoor_rh": float(outdoor["humidity"]),
        "rainfall": float(outdoor["rainfall"]),
        "hour": float(latest_ts.hour),
        "day_of_week": float(latest_ts.weekday()),

        "temp_lag_1": _pick_recent_value(recent, 1, "temperature"),
        "temp_lag_2": _pick_recent_value(recent, 2, "temperature"),
        "temp_lag_3": _pick_recent_value(recent, 3, "temperature"),
        "temp_lag_6": _pick_recent_value(recent, 6, "temperature"),
        "temp_lag_12": _pick_recent_value(recent, 12, "temperature"),

        "rh_lag_1": _pick_recent_value(recent, 1, "humidity"),
        "rh_lag_2": _pick_recent_value(recent, 2, "humidity"),
        "rh_lag_3": _pick_recent_value(recent, 3, "humidity"),
        "rh_lag_6": _pick_recent_value(recent, 6, "humidity"),
        "rh_lag_12": _pick_recent_value(recent, 12, "humidity"),
    }

    missing = [c for c in feature_cols if c not in feature_map]
    if missing:
        raise ValueError(f"Missing forecast features: {missing}")

    return pd.DataFrame([[feature_map[c] for c in feature_cols]], columns=feature_cols)

def _build_hourly_feature_row(recent_raw: list[dict], outdoor: dict, feature_cols: list[str]) -> pd.DataFrame:
    if not recent_raw:
        raise ValueError("No recent indoor readings found for hourly forecasting.")

    df = pd.DataFrame(recent_raw)
    if df.empty:
        raise ValueError("No recent indoor readings found for hourly forecasting.")

    df["sampled_at"] = pd.to_datetime(df["sampled_at"], utc=True, errors="coerce")
    df["temperature"] = pd.to_numeric(df["temperature"], errors="coerce")
    df["humidity"] = pd.to_numeric(df["humidity"], errors="coerce")

    df = df.dropna(subset=["sampled_at", "temperature", "humidity"])
    df = df.sort_values("sampled_at")

    hourly = (
        df.set_index("sampled_at")[["temperature", "humidity"]]
        .resample("1h")
        .mean()
        .dropna()
    )

    if hourly.empty:
        raise ValueError("No usable hourly sensor data yet for long-range forecasting.")

    latest = hourly.iloc[-1]
    latest_ts = hourly.index[-1].tz_convert("Asia/Colombo")

    feature_map = {
        "indoor_temp": float(latest["temperature"]),
        "indoor_rh": float(latest["humidity"]),
        "outdoor_temp": float(outdoor["temperature"]),
        "outdoor_rh": float(outdoor["humidity"]),
        "rainfall": float(outdoor["rainfall"]),
        "hour": float(latest_ts.hour),
        "day_of_week": float(latest_ts.weekday()),

        "temp_lag_1h": _pick_hourly_value(hourly, 1, "temperature"),
        "temp_lag_2h": _pick_hourly_value(hourly, 2, "temperature"),
        "temp_lag_3h": _pick_hourly_value(hourly, 3, "temperature"),
        "temp_lag_6h": _pick_hourly_value(hourly, 6, "temperature"),

        "rh_lag_1h": _pick_hourly_value(hourly, 1, "humidity"),
        "rh_lag_2h": _pick_hourly_value(hourly, 2, "humidity"),
        "rh_lag_3h": _pick_hourly_value(hourly, 3, "humidity"),
        "rh_lag_6h": _pick_hourly_value(hourly, 6, "humidity"),
    }

    missing = [c for c in feature_cols if c not in feature_map]
    if missing:
        raise ValueError(f"Missing forecast features: {missing}")

    return pd.DataFrame([[feature_map[c] for c in feature_cols]], columns=feature_cols)


def get_environment_forecast(horizon: str = "1h") -> EnvironmentForecastOut:
    config = HORIZON_CONFIG.get(horizon)
    if not config:
        raise ValueError("Unsupported horizon. Use 1h, 6h, or 24h.")

    profile = get_profile()
    if not profile or not profile.get("mushroom_type") or not profile.get("stage"):
        raise ValueError("Please select mushroom type and stage first.")

    cache_key = f"{horizon}|{profile.get('mushroom_type')}|{profile.get('stage')}"
    now = time.time()

    cached = FORECAST_CACHE.get(cache_key)
    if cached and (now - cached["ts"] < FORECAST_CACHE_TTL):
        return cached["data"]

    bundle = _load_model_bundle(horizon)
    temp_model = bundle["temp_model"]
    rh_model = bundle["rh_model"]
    info = bundle["info"]

    profile = get_profile()
    if not profile or not profile.get("mushroom_type") or not profile.get("stage"):
        raise ValueError("Please select mushroom type and stage first.")

    optimal = kb_get_optimal_range(profile["mushroom_type"], profile["stage"])
    if not optimal:
        raise ValueError("Optimal range not found for current profile.")

    outdoor = _get_current_outdoor_weather()

    raw_needed = config["raw_needed"]
    recent = get_recent_readings(raw_needed)
    if not recent:
        raise ValueError("No recent sensor data yet. Keep the sensor running and try again.")

    feature_cols = info["feature_cols"]

    if config["kind"] == "five_min":
        X_pred = _build_1h_feature_row(recent, outdoor, feature_cols)
    else:
        X_pred = _build_hourly_feature_row(recent, outdoor, feature_cols)

    predicted_temp = float(temp_model.predict(X_pred)[0])
    predicted_rh = float(rh_model.predict(X_pred)[0])

    current_temperature = float(recent[0]["temperature"])
    current_humidity = float(recent[0]["humidity"])

    temp_status = _compare_range(
        predicted_temp,
        float(optimal["temp_min"]),
        float(optimal["temp_max"]),
    )
    rh_status = _compare_range(
        predicted_rh,
        float(optimal["rh_min"]),
        float(optimal["rh_max"]),
    )

    warning = temp_status != "within" or rh_status != "within"
    warning_message = _build_warning_message(temp_status, rh_status, config["label"])

    result = EnvironmentForecastOut(
        horizon_key=horizon,
        horizon_minutes=config["minutes"],
        horizon_label=config["label"],
        generated_at=datetime.now(timezone.utc),
        mushroom_type=profile.get("mushroom_type"),
        stage=profile.get("stage"),
        current_temperature=current_temperature,
        current_humidity=current_humidity,
        predicted_temperature=round(predicted_temp, 2),
        predicted_humidity=round(predicted_rh, 2),
        optimal_temp_min=float(optimal["temp_min"]),
        optimal_temp_max=float(optimal["temp_max"]),
        optimal_rh_min=float(optimal["rh_min"]),
        optimal_rh_max=float(optimal["rh_max"]),
        temp_status=temp_status,
        rh_status=rh_status,
        warning=warning,
        warning_message=warning_message,
        outdoor=OutdoorWeatherOut(
            temperature=outdoor["temperature"],
            humidity=outdoor["humidity"],
            rainfall=outdoor["rainfall"],
        ),
        model_temp_mae=info.get("temp_mae"),
        model_rh_mae=info.get("rh_mae"),
        model_temp_r2=info.get("temp_r2"),
        model_rh_r2=info.get("rh_r2"),
    )

    FORECAST_CACHE[cache_key] = {
        "data": result,
        "ts": now,
    }

    return result