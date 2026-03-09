# backend/app/api/v1/disease.py

from typing import List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from app.schemas.disease import (
    DiseasePredictionResponse,
    DiseaseHistoryItem,
)
from app.services.disease_service import predict_disease_from_image
from app.services.treatment_service import generate_treatment_recommendation
from app.services.disease_history_service import (
    append_history_record,
    get_history_for_bag,
)

router = APIRouter()


@router.post(
    "/predict",
    response_model=DiseasePredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict mushroom disease from an image and get treatment advice",
)
async def predict_disease(
    file: UploadFile = File(...),
    bag_id: str = Form("default_bag"),
):
    """
    Accepts a mushroom image and returns:
      - label:      "healthy" | "black_mold" | "green_mold" | "invalid_image"
      - confidence: 0.0 - 1.0
      - severity:   "none" | "mild" | "moderate" | "severe"
      - treatment:  LLM-generated treatment recommendation

    Also logs the prediction in a time-series history for the given bag_id.
    The image must be JPG or PNG.
    """

    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type: {file.content_type}. "
                "Please upload a JPG or PNG image."
            ),
        )

    try:
        image_bytes = await file.read()

        # 1) Run CNN model to get label, confidence, severity
        prediction = predict_disease_from_image(image_bytes)

        # 2) Use LLM (Groq) to generate treatment recommendation
        treatment_text = generate_treatment_recommendation(
            label=prediction.label,
            severity=prediction.severity,
        )

        # 3) Log this as a time-series record
        append_history_record(
            bag_id=bag_id,
            label=prediction.label,
            severity=prediction.severity,
            confidence=prediction.confidence,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {e}",
        )

    return DiseasePredictionResponse(
        label=prediction.label,
        confidence=prediction.confidence,
        severity=prediction.severity,
        treatment=treatment_text,
    )


@router.get(
    "/history/{bag_id}",
    response_model=List[DiseaseHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get time-series disease history for a specific bag",
)
async def get_disease_history(bag_id: str):
    """
    Return all past predictions for the given bag_id, sorted by time.
    Each item is label + severity + numeric severity_score + confidence + timestamp.
    """
    records = get_history_for_bag(bag_id)
    return [DiseaseHistoryItem(**r) for r in records]