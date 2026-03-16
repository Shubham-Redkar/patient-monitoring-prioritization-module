from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1", tags=["alerts"])


@router.post("/patients/{patient_id}/acknowledge")
async def acknowledge_alert(patient_id: int, doctor: str, request: Request):

    repo = request.app.state.patient_repo

    updated = await repo.acknowledge_alert(patient_id, doctor)

    if updated == 0:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {
        "patient_id": patient_id,
        "status": "acknowledged",
        "doctor": doctor,
        "timestamp": datetime.now(timezone.utc),
    }
