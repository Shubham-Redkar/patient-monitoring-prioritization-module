from pydantic import BaseModel
from typing import Optional
from schemas.lab_schema import LabInput
from schemas.vital_schema import VitalInput


class PredictionInput(BaseModel):
    lab: Optional[LabInput] = None
    vital: VitalInput
