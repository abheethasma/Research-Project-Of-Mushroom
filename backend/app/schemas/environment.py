from datetime import datetime
from pydantic import BaseModel, Field


class EnvironmentProfileIn(BaseModel):
    mushroom_type: str
    stage: str = Field(..., description="spawn_run or fruiting")


class EnvironmentProfileOut(BaseModel):
    mushroom_type: str | None = None
    stage: str | None = None
    updated_at: str | None = None


class OptimalRangeOut(BaseModel):
    temp_min: float
    temp_max: float
    rh_min: float
    rh_max: float
    co2_min: float | None = None
    co2_max: float | None = None
    co2_note: str = "Estimated only (display)"

class EnvironmentReadingIn(BaseModel):
    temperature: float = Field(..., description="Temperature in °C")
    humidity: float = Field(..., description="Relative Humidity in %")
    co2: float | None = Field(None, description="Estimated CO₂ in ppm (display only)")
    node_id: str | None = Field(None, description="ESP32 node id")
    sampled_at: datetime | None = Field(None, description="Optional sensor timestamp")


class EnvironmentReadingOut(BaseModel):
    id: int
    sampled_at: datetime
    temperature: float
    humidity: float
    co2_estimated: float | None = None
    node_id: str | None = None
    note: str | None = None


class EnvironmentRecommendation(BaseModel):
    status: str
    recommendation: str

class AlertStateOut(BaseModel):
    param: str
    active: bool
    bad_count: int
    good_count: int
    state_changed_at: datetime
    last_value: float | None = None
    last_message: str | None = None


class EnvironmentStatusOut(BaseModel):
    reading: EnvironmentReadingOut
    profile: EnvironmentProfileOut
    optimal_range: OptimalRangeOut | None = None
    alerts: list[AlertStateOut]

class HistoryPointOut(BaseModel):
    ts: datetime
    temperature: float | None = None
    humidity: float | None = None
    co2: float | None = None


class HistoryResponseOut(BaseModel):
    range: str
    bucket_seconds: int
    points: list[HistoryPointOut]


class AvailableDatesOut(BaseModel):
    dates: list[str]

class RecommendationItemOut(BaseModel):
    mushroom_type: str
    score: float
    reason: str


class EnvironmentRecommendationOut(BaseModel):
    source: str
    used_stage: str = "fruiting"
    temperature: float | None = None
    humidity: float | None = None
    points_used: int = 0
    recommendations: list[RecommendationItemOut]

class EnvironmentHealthOut(BaseModel):
    online: bool
    last_seen: datetime | None = None
    node_id: str | None = None
    seconds_since_last: int | None = None

class EnvironmentSolutionIssueOut(BaseModel):
    issue_code: str | None = None
    metric: str | None = None
    current_value: float | None = None
    optimal_min: float | None = None
    optimal_max: float | None = None
    title: str | None = None
    immediate: list[str] = []
    short_term: list[str] = []
    long_term: list[str] = []
    safety: list[str] = []
    llm_message: str | None = None

class EnvironmentSolutionRecommendationOut(BaseModel):
    language: str = "en"
    mushroom_type: str | None = None
    stage: str | None = None

    primary_issue_code: str | None = None
    active_issues: list[EnvironmentSolutionIssueOut] = []

    note: str | None = None


class OutdoorWeatherOut(BaseModel):
    temperature: float | None = None
    humidity: float | None = None
    rainfall: float | None = None


class EnvironmentForecastOut(BaseModel):
    horizon_key: str = "1h"
    horizon_minutes: int = 60
    horizon_label: str | None = None

    generated_at: datetime
    mushroom_type: str | None = None
    stage: str | None = None

    current_temperature: float | None = None
    current_humidity: float | None = None

    predicted_temperature: float | None = None
    predicted_humidity: float | None = None

    optimal_temp_min: float | None = None
    optimal_temp_max: float | None = None
    optimal_rh_min: float | None = None
    optimal_rh_max: float | None = None

    temp_status: str | None = None  # within / high / low
    rh_status: str | None = None    # within / high / low

    warning: bool = False
    warning_message: str | None = None

    outdoor: OutdoorWeatherOut | None = None

    model_temp_mae: float | None = None
    model_rh_mae: float | None = None
    model_temp_r2: float | None = None
    model_rh_r2: float | None = None 