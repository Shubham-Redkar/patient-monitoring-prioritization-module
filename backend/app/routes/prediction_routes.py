from fastapi import APIRouter, Request, HTTPException
import pandas as pd

from schemas.predict_schema import PredictionInput
from schemas.response_schema import PredictionResponse

from services.priority_service import PriorityService


router = APIRouter(prefix="/api/v1", tags=["prediction"])

priority_service = PriorityService()


@router.post("/predict", response_model=PredictionResponse)
def predict(request: Request, data: PredictionInput):

    try:
        lab_service = request.app.state.lab_service
        vital_service = request.app.state.vital_service

        # ----------------------
        # Vital processing
        # ----------------------

        vital_df = pd.DataFrame([data.vital.model_dump()])

        vital_df = vital_service.detect_instability(vital_df)

        anomaly_flag = int(vital_df["vital_anomaly_flag"].iloc[-1])

        sustained_instability = anomaly_flag

        # ----------------------
        # Lab processing (optional)
        # ----------------------

        lab_label = None
        lab_prob = None

        if data.lab is not None:

            lab_df = pd.DataFrame([data.lab.model_dump()])

            lab_result = lab_service.predict_lab_risk(lab_df)

            lab_prob = lab_result["lab_risk_probability"]
            lab_label = lab_result["lab_risk_label"]

        # ----------------------
        # Priority
        # ----------------------

        priority = priority_service.compute_priority(lab_label, sustained_instability)

        return {
            "patient_id": data.vital.patient_id,
            "hour_from_admission": data.vital.hour_from_admission,
            "lab_risk_probability": lab_prob,
            "lab_risk_label": lab_label,
            "vital_anomaly_flag": anomaly_flag,
            "sustained_instability": sustained_instability,
            "priority_level": priority,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
