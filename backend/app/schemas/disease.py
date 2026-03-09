# backend/app/schemas/disease.py

from typing import List
from pydantic import BaseModel


class DiseasePredictionResponse(BaseModel):
    """
    Response returned to the mobile app after disease prediction.
    """
    label: str        # "healthy" | "black_mold" | "green_mold" | "invalid_image"
    confidence: float # 0.0 - 1.0
    severity: str     # "none" | "mild" | "moderate" | "severe"
    treatment: str    # LLM-generated recommendation text


class DiseaseHistoryItem(BaseModel):
    """
    One time-series record for a specific bag_id.
    """
    bag_id: str
    label: str
    severity: str
    severity_score: int
    confidence: float
    timestamp: str     # ISO8601 string


DiseaseHistoryList = List[DiseaseHistoryItem]