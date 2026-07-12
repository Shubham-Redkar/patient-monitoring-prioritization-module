import pandas as pd

from services.priority_service import PriorityService
from utils.alert_logic import determine_alert
from utils.datetime_utils import to_utc_iso
from utils.lab_features import compute_lab_features
from utils.vital_features import compute_vital_features


class PatientHistoryNotFound(Exception):
    pass


class PredictionService:
    """Orchestrates prediction without coupling the workflow to FastAPI."""

    def __init__(
        self,
        repository,
        lab_service,
        vital_service,
        signal_explainer,
        explanation_service,
    ):
        self.repository = repository
        self.lab_service = lab_service
        self.vital_service = vital_service
        self.signal_explainer = signal_explainer
        self.explanation_service = explanation_service
        self.priority_service = PriorityService()

    @staticmethod
    def _history_frames(history):
        vital_rows, lab_rows = [], []
        for reading in history:
            identity = {
                "patient_id": reading["patient_id"],
                "hour_from_admission": reading["hour_from_admission"],
            }
            vital_rows.append({**identity, **reading["vitals"]})
            if reading.get("labs"):
                lab_rows.append({**identity, **reading["labs"]})
        return pd.DataFrame(vital_rows), pd.DataFrame(lab_rows) if lab_rows else None

    async def predict(self, patient_id: int, hour: int) -> dict:
        history = await self.repository.get_history(patient_id, 0, hour)
        if not history:
            raise PatientHistoryNotFound

        vital_df, lab_df = self._history_frames(history)
        vital_df = self.vital_service.detect_instability(
            compute_vital_features(vital_df)
        )
        anomaly_flag = int(vital_df["vital_anomaly_flag"].iloc[-1])
        recent_anomalies = vital_df.groupby("patient_id")["vital_anomaly_flag"].transform(
            lambda values: values.rolling(4, min_periods=1).sum()
        )
        sustained_instability = int(recent_anomalies.iloc[-1] >= 2)

        lab_probability = lab_label = None
        if lab_df is not None:
            lab_df = compute_lab_features(lab_df)
            lab_result = self.lab_service.predict_lab_risk(lab_df.iloc[[-1]])
            lab_probability = lab_result["lab_risk_probability"]
            lab_label = lab_result["lab_risk_label"]

        priority = self.priority_service.compute_priority(
            lab_label, sustained_instability
        )
        meta = await self.repository.get_patient_meta(patient_id) or {}
        priority = meta.get("manual_priority", priority)

        previous = await self.repository.get_latest_reading(patient_id)
        alert = determine_alert(
            priority, previous.get("priority_level") if previous else None
        )
        acknowledged = bool(meta.get("alert_acknowledged"))
        alert.update(
            acknowledged=acknowledged,
            acknowledged_by=meta.get("alert_acknowledged_by") if acknowledged else None,
            acknowledged_at=(
                to_utc_iso(meta.get("alert_acknowledged_at"))
                if acknowledged
                else None
            ),
        )

        signals = self.signal_explainer.extract(
            vital_df,
            lab_df,
            priority,
        )
        explanation = None
        if priority in {"Critical", "High"} and (
            signals.get("lab") or signals.get("vitals")
        ):
            explanation = self.explanation_service.generate(
                signals, patient_id, priority
            )

        return {
            "patient_id": patient_id,
            "hour_from_admission": hour,
            "lab_risk_probability": lab_probability,
            "lab_risk_label": lab_label,
            "vital_anomaly_flag": anomaly_flag,
            "sustained_instability": sustained_instability,
            "priority_level": priority,
            "alert": alert,
            "signals": signals,
            "explanation": explanation,
        }
