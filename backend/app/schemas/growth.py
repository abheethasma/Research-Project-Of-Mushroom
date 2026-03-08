from pydantic import BaseModel

class GrowthPredictionResult(BaseModel):
    predicted_stage: str
    confidence: float
    next_stage: str

class GrowthPredictionApiResponse(BaseModel):
    success: bool
    message: str
    result: GrowthPredictionResult