from pydantic import BaseModel, Field
from typing import Literal, Optional, Any


class AlertInfo(BaseModel):
    alert: bool
    level: Optional[str] = None
    message: Optional[str] = None


class PredictionResponse(BaseModel):
    patient_id: int
    hour_from_admission: int

    lab_risk_probability: Optional[float] = None
    lab_risk_label: Optional[int] = None

    vital_anomaly_flag: int = Field(
        ..., description="Isolation Forest anomaly flag (1 = anomaly, 0 = normal)"
    )
    sustained_instability: int = Field(
        ..., description="Instability over rolling window"
    )

    # Fixed: removed "Low", added "Normal" to match PriorityService output
    priority_level: Literal["Normal", "Medium", "High", "Critical"] = Field(
        ..., description="Final patient priority level"
    )

    alert: AlertInfo
    signals: Optional[dict[str, Any]] = None
    explanation: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "patient_id": 2,
                "hour_from_admission": 29,
                "lab_risk_probability": 0.78,
                "lab_risk_label": 1,
                "vital_anomaly_flag": 1,
                "sustained_instability": 1,
                "priority_level": "Critical",
                "alert": {
                    "alert": True,
                    "level": "CRITICAL",
                    "message": "Priority escalated to Critical",
                },
                "signals": {
                    "lab": ["High lactate: 3.2"],
                    "vitals": ["Tachycardia: HR 120"],
                },
                "explanation": "Elevated lactate and sustained tachycardia indicate possible septic shock.",
            }
        }
