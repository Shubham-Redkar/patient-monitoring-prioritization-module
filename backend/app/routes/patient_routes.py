from fastapi import APIRouter, Request, HTTPException, Depends
from schemas.user_schema import UserResponse
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["patients"])


@router.get("/patients")
async def list_patients(
    request: Request,
    current_user: UserResponse = Depends(require_role(["doctor", "admin", "nurse"])),
):
    repo = request.app.state.patient_repo
    ids = await repo.list_patients()
    return {"patient_ids": sorted(ids)}


@router.get("/patients/{patient_id}/meta")
async def get_patient_meta(
    patient_id: int,
    request: Request,
    current_user: UserResponse = Depends(require_role(["doctor", "admin"])),
):
    repo = request.app.state.patient_repo
    meta = await repo.get_patient_meta(patient_id)
    if not meta:
        return {"patient_id": patient_id, "manual_override": None}

    override = None
    if meta.get("manual_priority"):
        override = {
            "priority": meta["manual_priority"],
            "reason": meta.get("manual_priority_reason", ""),
            "set_by": meta.get("manual_priority_by", ""),
            "set_at": str(meta.get("manual_priority_at", "")),
        }

    return {"patient_id": patient_id, "manual_override": override}


@router.post("/patients/{patient_id}/override_priority")
async def override_priority(
    patient_id: int,
    request: Request,
    data: dict,
    # FIX: restricted to doctor-only (admin was removed in previous pass)
    current_user: UserResponse = Depends(require_role(["doctor"])),
):
    priority = data.get("priority")
    reason = data.get("reason")
    if not priority or not reason:
        raise HTTPException(status_code=400, detail="priority and reason are required")

    repo = request.app.state.patient_repo
    await repo.override_patient_priority(
        patient_id, priority, reason, current_user.username
    )
    return {"message": "Priority overridden successfully"}


@router.delete("/patients/{patient_id}/override_priority")
async def clear_override(
    patient_id: int,
    request: Request,
    current_user: UserResponse = Depends(require_role(["doctor"])),
):
    repo = request.app.state.patient_repo
    await repo.meta_col.update_one(
        {"patient_id": patient_id},
        {
            "$unset": {
                "manual_priority": "",
                "manual_priority_reason": "",
                "manual_priority_by": "",
                "manual_priority_at": "",
            }
        },
    )
    return {"message": "Override cleared"}


@router.get("/patients/{patient_id}/history")
async def get_patient_history(
    patient_id: int,
    from_hour: int = 0,
    to_hour: int = 72,
    request: Request = None,
    # FIX: was completely unauthenticated — anyone could pull full patient history
    current_user: UserResponse = Depends(require_role(["doctor", "admin", "nurse"])),
):
    repo = request.app.state.patient_repo
    readings = await repo.get_history(patient_id, from_hour, to_hour)

    if not readings:
        raise HTTPException(status_code=404, detail="No history found for patient")

    vitals_series = []
    labs_series = []

    for r in readings:
        hour = r["hour_from_admission"]
        vitals_series.append({"hour": hour, **r.get("vitals", {})})
        if r.get("labs"):
            labs_series.append({"hour": hour, **r["labs"]})

    return {
        "patient_id": patient_id,
        "vitals": vitals_series,
        "labs": labs_series,
    }
