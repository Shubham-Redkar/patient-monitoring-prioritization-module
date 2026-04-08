from fastapi import APIRouter, Request, HTTPException, Depends
from datetime import datetime, timezone
from schemas.user_schema import UserResponse
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["alerts"])


@router.post("/patients/{patient_id}/acknowledge")
async def acknowledge_alert(
    patient_id: int,
    request: Request,
    current_user: UserResponse = Depends(require_role(["doctor", "admin", "nurse"])),
):
    repo = request.app.state.patient_repo
    ok = await repo.acknowledge_alert(patient_id, current_user.username)

    if not ok:
        raise HTTPException(status_code=404, detail="Patient not found")

    return {
        "patient_id": patient_id,
        "status": "acknowledged",
        "acknowledged_by": current_user.username,
        "acknowledged_at": datetime.now(timezone.utc),
    }


@router.delete("/patients/{patient_id}/acknowledge")
async def clear_acknowledgement(
    patient_id: int,
    request: Request,
    current_user: UserResponse = Depends(require_role(["doctor", "admin"])),
):
    """Clear a previous acknowledgement so fresh alerts are shown again."""
    repo = request.app.state.patient_repo
    await repo.clear_alert_acknowledgement(patient_id)
    return {"patient_id": patient_id, "status": "acknowledgement_cleared"}
