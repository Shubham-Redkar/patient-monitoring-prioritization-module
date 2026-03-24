from fastapi import APIRouter, UploadFile, File, Request, HTTPException, Depends
import pandas as pd
import io
from schemas.user_schema import UserResponse
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["data"])


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...), 
    request: Request = None,
    current_user: UserResponse = Depends(require_role(["nurse", "admin"]))
):

    try:

        repo = request.app.state.patient_repo

        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        readings = []

        for _, row in df.iterrows():

            vitals = {
                "heart_rate": row["heart_rate"],
                "respiratory_rate": row["respiratory_rate"],
                "spo2_pct": row["spo2_pct"],
                "temperature_c": row["temperature_c"],
                "systolic_bp": row["systolic_bp"],
                "diastolic_bp": row["diastolic_bp"],
            }

            labs = {
                "wbc_count": row["wbc_count"],
                "lactate": row["lactate"],
                "creatinine": row["creatinine"],
                "crp_level": row["crp_level"],
                "hemoglobin": row["hemoglobin"],
            }

            readings.append(
                {
                    "patient_id": int(row["patient_id"]),
                    "hour_from_admission": int(row["hour_from_admission"]),
                    "vitals": vitals,
                    "labs": labs,
                    "predictions": {},
                }
            )

        await repo.bulk_upsert_readings(readings)

        return {"message": "CSV uploaded successfully", "rows_inserted": len(readings)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/patients/{patient_id}")
async def delete_patient_data(
    patient_id: int, 
    request: Request = None,
    current_user: UserResponse = Depends(require_role(["nurse", "admin"]))
):
    try:
        repo = request.app.state.patient_repo
        result = await repo.col.delete_many({"patient_id": patient_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found or already deleted")
        return {"message": "Patient data deleted successfully", "deleted_count": result.deleted_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
