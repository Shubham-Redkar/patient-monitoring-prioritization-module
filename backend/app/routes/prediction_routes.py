from fastapi import APIRouter, Request, HTTPException, Depends
import pandas as pd

from utils.vital_features import compute_vital_features
from utils.lab_features import compute_lab_features
from utils.alert_logic import determine_alert
from utils.explanability import extract_signals

from services.priority_service import PriorityService
from services.grok_services import generate_explanation
from schemas.response_schema import PredictionResponse
from schemas.user_schema import UserResponse
from utils.auth import require_role

router = APIRouter(prefix="/api/v1", tags=["prediction"])

priority_service = PriorityService()


@router.get("/patients/{patient_id}/predict", response_model=PredictionResponse)
async def predict(
    patient_id: int,
    hour: int,
    request: Request,
    # FIX: was completely unauthenticated — any caller could run predictions
    current_user: UserResponse = Depends(require_role(["doctor", "admin", "nurse"])),
):

    repo = request.app.state.patient_repo
    vital_service = request.app.state.vital_service
    lab_service = request.app.state.lab_service

    history = await repo.get_history(patient_id, 0, hour)

    if not history:
        raise HTTPException(status_code=404, detail="No patient history found")

    vital_rows = []
    lab_rows = []

    for r in history:
        base = {
            "patient_id": r["patient_id"],
            "hour_from_admission": r["hour_from_admission"],
        }
        vital_rows.append({**base, **r["vitals"]})
        if r.get("labs"):
            lab_rows.append({**base, **r["labs"]})

    vital_df = pd.DataFrame(vital_rows)
    lab_df = pd.DataFrame(lab_rows) if lab_rows else None

    vital_df = compute_vital_features(vital_df)
    vital_df = vital_service.detect_instability(vital_df)

    anomaly_flag = int(vital_df["vital_anomaly_flag"].iloc[-1])

    vital_df["anomaly_count_4h"] = (
        vital_df.groupby("patient_id")["vital_anomaly_flag"]
        .rolling(4, min_periods=1)
        .sum()
        .reset_index(level=0, drop=True)
    )

    sustained_instability = int(vital_df["anomaly_count_4h"].iloc[-1] >= 2)

    lab_prob = None
    lab_label = None

    if lab_df is not None and len(lab_df) > 0:
        lab_df = compute_lab_features(lab_df)
        latest_lab = lab_df.iloc[[-1]]
        lab_result = lab_service.predict_lab_risk(latest_lab)
        lab_prob = lab_result["lab_risk_probability"]
        lab_label = lab_result["lab_risk_label"]

    priority = priority_service.compute_priority(lab_label, sustained_instability)

    patient_meta = await repo.get_patient_meta(patient_id)
    if patient_meta and patient_meta.get("manual_priority"):
        priority = patient_meta["manual_priority"]

    previous = await repo.get_latest_reading(patient_id)
    previous_priority = previous.get("priority_level") if previous else None

    alert = determine_alert(priority, previous_priority)

    signals = extract_signals(
        vital_df,
        lab_df,
        priority,
        lab_service=lab_service,
        vital_service=vital_service,
    )

    explanation = None
    if signals.get("lab") or signals.get("vitals"):
        explanation = generate_explanation(
            signals, patient_id=patient_id, priority=priority
        )

    return {
        "patient_id": patient_id,
        "hour_from_admission": hour,
        "lab_risk_probability": lab_prob,
        "lab_risk_label": lab_label,
        "vital_anomaly_flag": anomaly_flag,
        "sustained_instability": sustained_instability,
        "priority_level": priority,
        "alert": alert,
        "signals": signals,
        "explanation": explanation,
    }
