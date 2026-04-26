from pydantic import BaseModel, Field
from utils.constants import FEATURE_META


class ReadingBase(BaseModel):
    """Shared identity fields for every patient reading row.
    Both VitalInput and LabInput inherit from this so patient_id and
    hour_from_admission are defined exactly once."""

    patient_id: int
    hour_from_admission: int


_hr = FEATURE_META["heart_rate"]
_rr = FEATURE_META["respiratory_rate"]
_spo2 = FEATURE_META["spo2_pct"]
_temp = FEATURE_META["temperature_c"]
_sbp = FEATURE_META["systolic_bp"]
_dbp = FEATURE_META["diastolic_bp"]


class VitalInput(ReadingBase):
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
