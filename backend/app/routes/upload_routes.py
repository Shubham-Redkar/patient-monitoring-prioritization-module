from fastapi import APIRouter, UploadFile, File, Request, HTTPException, Depends
import pandas as pd
import io
from pydantic import ValidationError

from schemas.user_schema import UserResponse
from schemas.vital_schema import VitalInput
from schemas.lab_schema import LabInput
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["data"])

# All columns the CSV must contain
REQUIRED_COLUMNS = {
    "patient_id",
    "hour_from_admission",
    "heart_rate",
    "respiratory_rate",
    "spo2_pct",
    "temperature_c",
    "systolic_bp",
    "diastolic_bp",
    "wbc_count",
    "lactate",
    "creatinine",
    "crp_level",
    "hemoglobin",
}


@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: UserResponse = Depends(require_role(["nurse", "admin"])),
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception:
        raise HTTPException(status_code=422, detail="Could not parse file as CSV.")

    if df.empty:
        raise HTTPException(status_code=422, detail="CSV file is empty.")

    # Check all required columns are present before touching any row
    missing_cols = REQUIRED_COLUMNS - set(df.columns)
    if missing_cols:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required columns: {', '.join(sorted(missing_cols))}",
        )

    readings = []
    row_errors = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # +2 → 1-based, skipping header
        errors_for_row = []

        # Validate vitals
        try:
            vital = VitalInput(
                patient_id=row["patient_id"],
                hour_from_admission=row["hour_from_admission"],
                heart_rate=row["heart_rate"],
                respiratory_rate=row["respiratory_rate"],
                spo2_pct=row["spo2_pct"],
                temperature_c=row["temperature_c"],
                systolic_bp=row["systolic_bp"],
                diastolic_bp=row["diastolic_bp"],
            )
        except (ValidationError, Exception) as e:
            if isinstance(e, ValidationError):
                for err in e.errors():
                    field = err["loc"][-1] if err["loc"] else "unknown"
                    errors_for_row.append(f"{field}: {err['msg']}")
            else:
                errors_for_row.append(f"vitals: {str(e)}")
            vital = None

        # Validate labs
        try:
            lab = LabInput(
                patient_id=row["patient_id"],
                hour_from_admission=row["hour_from_admission"],
                wbc_count=row["wbc_count"],
                lactate=row["lactate"],
                creatinine=row["creatinine"],
                crp_level=row["crp_level"],
                hemoglobin=row["hemoglobin"],
            )
        except (ValidationError, Exception) as e:
            if isinstance(e, ValidationError):
                for err in e.errors():
                    field = err["loc"][-1] if err["loc"] else "unknown"
                    errors_for_row.append(f"{field}: {err['msg']}")
            else:
                errors_for_row.append(f"labs: {str(e)}")
            lab = None

        if errors_for_row:
            row_errors.append({"row": row_num, "errors": errors_for_row})
            continue  # skip invalid rows, collect all errors first

        readings.append(
            {
                "patient_id": vital.patient_id,
                "hour_from_admission": vital.hour_from_admission,
                "vitals": {
                    "heart_rate": vital.heart_rate,
                    "respiratory_rate": vital.respiratory_rate,
                    "spo2_pct": vital.spo2_pct,
                    "temperature_c": vital.temperature_c,
                    "systolic_bp": vital.systolic_bp,
                    "diastolic_bp": vital.diastolic_bp,
                },
                "labs": {
                    "wbc_count": lab.wbc_count,
                    "lactate": lab.lactate,
                    "creatinine": lab.creatinine,
                    "crp_level": lab.crp_level,
                    "hemoglobin": lab.hemoglobin,
                },
            }
        )

    # If any rows failed validation, reject the whole upload with details
    if row_errors:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"{len(row_errors)} row(s) failed validation. No data was inserted.",
                "errors": row_errors,
            },
        )

    repo = request.app.state.patient_repo
    await repo.bulk_upsert_readings(readings)

    return {
        "message": "CSV uploaded successfully",
        "rows_inserted": len(readings),
    }


@router.delete("/patients/{patient_id}")
async def delete_patient_data(
    patient_id: int,
    request: Request = None,
    current_user: UserResponse = Depends(require_role(["nurse", "admin"])),
):
    repo = request.app.state.patient_repo
    result = await repo.col.delete_many({"patient_id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Patient not found or already deleted"
        )
    return {
        "message": "Patient data deleted successfully",
        "deleted_count": result.deleted_count,
    }
