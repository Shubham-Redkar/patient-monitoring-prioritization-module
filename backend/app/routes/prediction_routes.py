from fastapi import APIRouter, Request, HTTPException, Depends
from services.prediction_service import PatientHistoryNotFound
from schemas.response_schema import PredictionResponse
from schemas.user_schema import UserResponse
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["prediction"])

@router.get("/patients/{patient_id}/predict", response_model=PredictionResponse)
async def predict(
    patient_id: int,
    hour: int,
    request: Request,
    current_user: UserResponse = Depends(require_role(["doctor", "admin", "nurse"])),
):

    try:
        return await request.app.state.prediction_service.predict(patient_id, hour)
    except PatientHistoryNotFound:
        raise HTTPException(status_code=404, detail="No patient history found")
