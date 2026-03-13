from pydantic import BaseModel, Field


class LabInput(BaseModel):
    patient_id: int
    hour_from_admission: int
    wbc_count: float = Field(..., ge=0)
    lactate: float = Field(..., ge=0)
    creatinine: float = Field(..., ge=0)
    crp_level: float = Field(..., ge=0)
    hemoglobin: float = Field(..., ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": 2,
                "hour_from_admission": 29,
                "wbc_count": 12.5,
                "lactate": 3.2,
                "creatinine": 1.8,
                "crp_level": 55.0,
                "hemoglobin": 11.2,
            }
        }
