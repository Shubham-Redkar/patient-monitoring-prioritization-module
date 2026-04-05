from pydantic import BaseModel, Field
from schemas.vital_schema import ReadingBase
from utils.constants import FEATURE_META

_wbc = FEATURE_META["wbc_count"]
_lac = FEATURE_META["lactate"]
_cre = FEATURE_META["creatinine"]
_crp = FEATURE_META["crp_level"]
_hgb = FEATURE_META["hemoglobin"]


class LabInput(ReadingBase):
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
