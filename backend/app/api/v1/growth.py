import traceback
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.growth_stage_service import (
    predict_growth_stage,
    save_growth_history,
    get_growth_history_by_bag,
)

router = APIRouter()


@router.post("/predict-growth-stage")
async def predict_growth(
    image: UploadFile = File(...),
    bag_id: str = Form(...)
):
    try:
        image_bytes = await image.read()
        result = predict_growth_stage(image_bytes)

        save_growth_history(
            bag_id=bag_id,
            label=result.label,
            confidence=result.confidence,
            next_stage=result.next_stage,
            estimated_days_to_next_stage=result.estimated_days_to_next_stage,
            warning=result.warning,
        )

        return {
            "growth_stage": result.label,
            "confidence": round(result.confidence, 4),
            "next_stage": result.next_stage,
            "estimated_days_to_next_stage": result.estimated_days_to_next_stage,
            "warning": result.warning,
            "bag_id": bag_id,
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{bag_id}")
async def get_growth_history(bag_id: str):
    try:
        history = get_growth_history_by_bag(bag_id)
        return {
            "bag_id": bag_id,
            "history": history
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))