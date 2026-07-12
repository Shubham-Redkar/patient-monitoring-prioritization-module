from fastapi import APIRouter, UploadFile, File, Request, HTTPException, Depends
from schemas.user_schema import UserResponse
from services.csv_import_service import CsvImportError, parse_patient_csv
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["data"])

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: UserResponse = Depends(require_role(["nurse", "admin"])),
):
    try:
        readings = parse_patient_csv(await file.read())
    except CsvImportError as error:
        raise HTTPException(status_code=422, detail=error.detail)

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
    deleted_count = await repo.delete_patient(patient_id)
    if deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Patient not found or already deleted"
        )

    return {
        "message": "Patient data deleted successfully",
        "deleted_count": deleted_count,
    }
