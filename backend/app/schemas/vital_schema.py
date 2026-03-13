from pydantic import BaseModel, Field


class VitalInput(BaseModel):
    patient_id: int
    hour_from_admission: int
    heart_rate: float = Field(..., gt=0)
    respiratory_rate: float = Field(..., gt=0)
    spo2_pct: float = Field(..., gt=0, le=100)
    temperature_c: float = Field(..., gt=0)
    systolic_bp: float = Field(..., gt=0)
    diastolic_bp: float = Field(..., gt=0)

    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": 2,
                "hour_from_admission": 29,
                "heart_rate": 120.7,
                "respiratory_rate": 37.1,
                "spo2_pct": 80.8,
                "temperature_c": 38.1,
                "systolic_bp": 70,
                "diastolic_bp": 40,
            }
        }
