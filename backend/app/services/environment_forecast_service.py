from __future__ import annotations

import os
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import httpx
import joblib
import pandas as pd

from app.db.environment_db import get_recent_readings, get_profile
from app.db.knowledge_db import get_optimal_range as kb_get_optimal_range
from app.schemas.environment import EnvironmentForecastOut, OutdoorWeatherOut


MODEL_CACHE: dict = {}


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


def _load_model_bundle():
    global MODEL_CACHE

    if MODEL_CACHE:
        return MODEL_CACHE

    model_dir = _model_dir()

    temp_model = joblib.load(model_dir / "temp_forecast_model_60m.pkl")
    rh_model = joblib.load(model_dir / "rh_forecast_model_60m.pkl")
    info = joblib.load(model_dir / "forecast_model_info.pkl")

    MODEL_CACHE = {
        "temp_model": temp_model,
        "rh_model": rh_model,
        "info": info,
    }
    return MODEL_CACHE


def _compare_range(value: float, vmin: float, vmax: float) -> str:
    if value < vmin:
        return "low"
    if value > vmax:
        return "high"
    return "within"


def _build_warning_message(temp_status: str, rh_status: str) -> str:
    parts = []

    if temp_status == "high":
        parts.append("Temperature is predicted to rise above the optimal range within the next 60 minutes.")
    elif temp_status == "low":
        parts.append("Temperature is predicted to fall below the optimal range within the next 60 minutes.")

    if rh_status == "high":
        parts.append("Humidity is predicted to rise above the optimal range within the next 60 minutes.")
    elif rh_status == "low":
        parts.append("Humidity is predicted to fall below the optimal range within the next 60 minutes.")

    if not parts:
        return "Forecast indicates temperature and humidity should remain within the optimal range for the next 60 minutes."

    return " ".join(parts)


def _get_current_outdoor_weather() -> dict:
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
    rainfall = current.get("rain")

    if temperature is None or humidity is None:
        raise ValueError("Outdoor weather API response is missing required values.")

    return {
        "temperature": float(temperature),
        "humidity": float(humidity),
        "rainfall": float(rainfall or 0.0),
    }


def _build_feature_row(recent: list[dict], outdoor: dict, feature_cols: list[str]) -> list[float]:
    if len(recent) < 13:
        raise ValueError("At least 13 recent indoor readings are needed before forecasting.")

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
        "temp_lag_1": float(recent[1]["temperature"]),
        "temp_lag_2": float(recent[2]["temperature"]),
        "temp_lag_3": float(recent[3]["temperature"]),
        "temp_lag_6": float(recent[6]["temperature"]),
        "temp_lag_12": float(recent[12]["temperature"]),
        "rh_lag_1": float(recent[1]["humidity"]),
        "rh_lag_2": float(recent[2]["humidity"]),
        "rh_lag_3": float(recent[3]["humidity"]),
        "rh_lag_6": float(recent[6]["humidity"]),
        "rh_lag_12": float(recent[12]["humidity"]),
    }

    missing = [c for c in feature_cols if c not in feature_map]
    if missing:
        raise ValueError(f"Missing forecast features: {missing}")

    return [feature_map[c] for c in feature_cols]


def get_environment_forecast_60m() -> EnvironmentForecastOut:
    bundle = _load_model_bundle()
    temp_model = bundle["temp_model"]
    rh_model = bundle["rh_model"]
    info = bundle["info"]

    feature_cols = info["feature_cols"]

    profile = get_profile()
    if not profile or not profile.get("mushroom_type") or not profile.get("stage"):
        raise ValueError("Please select mushroom type and stage first.")

    recent = get_recent_readings(13)
    if len(recent) < 13:
        raise ValueError("Not enough recent readings yet. Need at least 13 indoor readings.")

    optimal = kb_get_optimal_range(profile["mushroom_type"], profile["stage"])
    if not optimal:
        raise ValueError("Optimal range not found for current profile.")

    outdoor = _get_current_outdoor_weather()
    feature_row = _build_feature_row(recent, outdoor, feature_cols)

    # predicted_temp = float(temp_model.predict([feature_row])[0])
    # predicted_rh = float(rh_model.predict([feature_row])[0])

    X_pred = pd.DataFrame([feature_row], columns=feature_cols)

    predicted_temp = float(temp_model.predict(X_pred)[0])
    predicted_rh = float(rh_model.predict(X_pred)[0])

    current_temperature = float(recent[0]["temperature"])
    current_humidity = float(recent[0]["humidity"])

    temp_status = _compare_range(predicted_temp, float(optimal["temp_min"]), float(optimal["temp_max"]))
    rh_status = _compare_range(predicted_rh, float(optimal["rh_min"]), float(optimal["rh_max"]))

    warning = temp_status != "within" or rh_status != "within"
    warning_message = _build_warning_message(temp_status, rh_status)

    return EnvironmentForecastOut(
        horizon_minutes=60,
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
    )