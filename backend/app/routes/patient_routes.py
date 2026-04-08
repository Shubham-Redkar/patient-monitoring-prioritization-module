from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, Depends
from schemas.user_schema import UserResponse
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["patients"])


def utc_now_iso() -> str:
    """Return current UTC time as a timezone-aware ISO 8601 string.
    e.g. '2026-04-05T10:46:48+00:00'
    Use this instead of datetime.utcnow() so the frontend correctly
    converts to local time via new Date(isoString).toLocaleString().
    """
    return datetime.now(timezone.utc).isoformat()


def normalise_set_at(raw) -> str | None:
    """Normalise whatever timestamp shape is stored in DB to a UTC ISO string.
    1. Timezone-aware datetime  -> convert to UTC, serialise
    2. Naive datetime (legacy)  -> attach UTC tzinfo, serialise
    3. Already a string / None  -> pass through as-is
    """
    if isinstance(raw, datetime):
        if raw.tzinfo is None:
            raw = raw.replace(tzinfo=timezone.utc)
        return raw.astimezone(timezone.utc).isoformat()
    return raw


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
    current_user: UserResponse = Depends(require_role(["doctor", "admin", "nurse"])),
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
            # FIX: normalise to UTC ISO string so frontend toLocaleString() works
            "set_at": normalise_set_at(meta.get("manual_priority_at")),
        }

    return {"patient_id": patient_id, "manual_override": override}


@router.post("/patients/{patient_id}/override_priority")
async def override_priority(
    patient_id: int,
    request: Request,
    data: dict,
    current_user: UserResponse = Depends(require_role(["doctor"])),
):
    priority = data.get("priority")
    reason = data.get("reason")
    if not priority or not reason:
        raise HTTPException(status_code=400, detail="priority and reason are required")

    repo = request.app.state.patient_repo
    # FIX: pass utc_now_iso() as the username arg position is unchanged;
    # override_patient_priority signature: (patient_id, priority, reason, set_by)
    # The repo itself should store utc_now_iso() — update it there, not here.
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
