from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/api/v1", tags=["patients"])


@router.get("/patients")
async def list_patients(request: Request):
    repo = request.app.state.patient_repo
    ids = await repo.list_patients()
    return {"patient_ids": sorted(ids)}


@router.get("/patients/{patient_id}/history")
async def get_patient_history(
    patient_id: int,
    from_hour: int = 0,
    to_hour: int = 72,
    request: Request = None,
):
    try:
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
