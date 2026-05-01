from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.environment import (
    EnvironmentReadingIn,
    EnvironmentReadingOut,
    EnvironmentStatusOut,
    EnvironmentProfileIn,
    EnvironmentProfileOut,
    OptimalRangeOut,
    EnvironmentRecommendationOut,
    EnvironmentSolutionRecommendationOut,
    EnvironmentForecastOut,
    HistoryResponseOut,
    AvailableDatesOut,
    EnvironmentHealthOut,
)

from app.services.environment_service import (
    save_environment_reading,
    get_environment_status,
    get_environment_recommendation,
    get_environment_solution_recommendation,
    get_environment_options,
    get_environment_profile,
    update_environment_profile,
    get_optimal_range,
    get_environment_history,
    get_environment_available_dates,
    get_environment_health,
)

from app.services.environment_forecast_service import get_environment_forecast

router = APIRouter()


@router.post("/readings", response_model=EnvironmentReadingOut)
def ingest_environment_reading(payload: EnvironmentReadingIn):
    return save_environment_reading(payload)


@router.get("/status", response_model=EnvironmentStatusOut)
def read_status():
    return get_environment_status()


@router.get("/recommendation", response_model=EnvironmentRecommendationOut)
def read_recommendation(source: str = "current", date: str | None = None):
    try:
        return get_environment_recommendation(source, date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/solution-recommendation", response_model=EnvironmentSolutionRecommendationOut)
def read_solution_recommendation(lang: str = "en"):
    try:
        return get_environment_solution_recommendation(lang)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/options")
def read_options():
    return get_environment_options()


@router.get("/profile", response_model=EnvironmentProfileOut)
def read_profile():
    return get_environment_profile()


@router.put("/profile", response_model=EnvironmentProfileOut)
def write_profile(payload: EnvironmentProfileIn):
    try:
        return update_environment_profile(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/optimal-range", response_model=OptimalRangeOut)
def read_optimal_range(mushroom_type: str, stage: str):
    try:
        return get_optimal_range(mushroom_type, stage)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history", response_model=HistoryResponseOut)
def read_history(range: str, date: str | None = None):
    try:
        return get_environment_history(range, date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/available-dates", response_model=AvailableDatesOut)
def read_available_dates():
    return get_environment_available_dates()


@router.get("/health", response_model=EnvironmentHealthOut)
def read_health(offline_after_seconds: int = 60):
    return get_environment_health(offline_after_seconds)

@router.get("/forecast", response_model=EnvironmentForecastOut)
def read_environment_forecast(horizon: str = "1h"):
    try:
        return get_environment_forecast(horizon)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    