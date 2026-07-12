import logging

import shap
import numpy as np

from utils.constants import FEATURE_META
from utils.preprocessing import scale_features


logger = logging.getLogger(__name__)


def _status(feature, value):
    meta = FEATURE_META.get(feature)
    if not meta:
        return "unknown"
    if meta["high"] is not None and value > meta["high"]:
        return "HIGH"
    if meta["low"] is not None and value < meta["low"]:
        return "LOW"
    return "NORMAL"


def _clinical_signal(feature, value):
    if "_diff_4h" in feature:
        name = feature.replace("_diff_4h", "").replace("_", " ")
        unit = FEATURE_META.get(feature.replace("_diff_4h", ""), {}).get("unit", "")
        return f"{name} 4-hour change: {round(value, 2)} {unit}"
    if "_roll_std_4h" in feature:
        name = feature.replace("_roll_std_4h", "").replace("_", " ")
        unit = FEATURE_META.get(feature.replace("_roll_std_4h", ""), {}).get("unit", "")
        return f"{name} 4-hour variability: {round(value, 2)} {unit}"
    meta = FEATURE_META.get(feature, {})
    return (
        f"{feature.replace('_', ' ')}: {round(value, 2)} {meta.get('unit', '')} "
        f"({_status(feature, value)}, normal range: {meta.get('normal', 'unknown')})"
    )


def _ui_signal(feature, value, contribution):
    if abs(contribution) < 1e-9:
        risk_effect = "neutral"
    else:
        risk_effect = "raises risk" if contribution > 0 else "lowers risk"
    if "_diff_4h" in feature or "_roll_std_4h" in feature:
        return f"{_clinical_signal(feature, value)} ({risk_effect}: {round(abs(contribution), 3)})"
    meta = FEATURE_META.get(feature, {})
    return (
        f"{feature}: {round(value, 2)} {meta.get('unit', '')} "
        f"[{_status(feature, value)}, normal: {meta.get('normal', '?')}] "
        f"({risk_effect}: {round(abs(contribution), 3)})"
    )


class SignalExplainer:
    """Owns SHAP explainers and converts their output to displayable signals."""

    def __init__(self, lab_service, vital_service):
        self.lab_service = lab_service
        self.vital_service = vital_service
        self.lab_explainer = None
        self.vital_explainer = None
        self._initialized = False

    def _initialize(self):
        """Build expensive SHAP objects only when signals are first requested."""
        if self._initialized:
            return
        self.lab_explainer = self._create_lab_explainer()
        self.vital_explainer = self._create_vital_explainer()
        self._initialized = True

    def _create_lab_explainer(self):
        service = self.lab_service
        try:
            # Predictions operate in standardized space. Zero is therefore the
            # training-feature mean and is a meaningful neutral baseline.
            masker = shap.maskers.Independent(
                np.zeros((1, len(service.features)), dtype=float)
            )
            return shap.LinearExplainer(service.model, masker)
        except Exception:
            logger.exception("Lab SHAP explainer could not be initialized")
            return None

    def _create_vital_explainer(self):
        try:
            return shap.TreeExplainer(self.vital_service.model)
        except Exception:
            logger.exception("Vital SHAP explainer could not be initialized")
            return None

    @staticmethod
    def _ranked_signals(explainer, service, frame, invert_direction=False):
        scaled = scale_features(
            frame.iloc[[-1]], service.scaler, service.features
        )
        contributions = explainer.shap_values(scaled)[0]
        # Isolation Forest TreeExplainer values describe normality/path length:
        # larger values are more normal. Invert them to express anomaly risk.
        if invert_direction:
            contributions = -np.asarray(contributions)
        ranked = sorted(
            zip(service.features, contributions),
            key=lambda item: abs(item[1]),
            reverse=True,
        )[:3]
        row = frame.iloc[-1]
        ranked = [(name, value) for name, value in ranked if name in row]
        return (
            [_ui_signal(name, float(row[name]), value) for name, value in ranked],
            [_clinical_signal(name, float(row[name])) for name, _ in ranked],
        )

    def _safe_signals(
        self, explainer, service, frame, label, invert_direction=False
    ):
        if explainer is None or frame is None or frame.empty:
            return [], []
        try:
            return self._ranked_signals(
                explainer, service, frame, invert_direction
            )
        except Exception:
            logger.exception("%s SHAP signal extraction failed", label)
            return [], []

    def extract(self, vital_df, lab_df, priority):
        self._initialize()
        lab, lab_llm = self._safe_signals(
            self.lab_explainer, self.lab_service, lab_df, "Lab"
        )
        vitals, vitals_llm = self._safe_signals(
            self.vital_explainer,
            self.vital_service,
            vital_df,
            "Vital",
            invert_direction=True,
        )
        return {
            "lab": lab,
            "vitals": vitals,
            "lab_llm": lab_llm,
            "vitals_llm": vitals_llm,
            "priority": priority,
        }
