import shap
import pandas as pd
from utils.preprocessing import scale_features
from utils.constants import FEATURE_META

_lab_explainer = None
_vital_explainer = None


def init_explainers(lab_service, vital_service):
    """
    Call this once at startup (in lifespan) to build and cache SHAP explainers.
    Building explainers is expensive — caching saves ~200-500ms per request.
    """
    global _lab_explainer, _vital_explainer
    try:
        _lab_explainer = shap.LinearExplainer(
            lab_service.model,
            shap.maskers.Independent(
                lab_service.scaler.transform(
                    pd.DataFrame(
                        [[0] * len(lab_service.features)],
                        columns=lab_service.features,
                    )
                )
            ),
        )
    except Exception:
        _lab_explainer = None

    try:
        _vital_explainer = shap.TreeExplainer(vital_service.model)
    except Exception:
        _vital_explainer = None


def _status(feature, value):
    meta = FEATURE_META.get(feature)
    if not meta:
        return "unknown"
    if meta["high"] is not None and value > meta["high"]:
        return "HIGH"
    if meta["low"] is not None and value < meta["low"]:
        return "LOW"
    return "NORMAL"


def _format_signal_for_llm(feature, value):
    """Clinician-readable signal for the LLM prompt — no ML jargon."""
    meta = FEATURE_META.get(feature, {})
    status = _status(feature, value)
    display_name = feature.replace("_", " ")
    return (
        f"{display_name}: {round(value, 2)} {meta.get('unit', '')} "
        f"({status}, normal range: {meta.get('normal', 'unknown')})"
    )


def _format_signal(feature, value, shap_val):
    """Signal string for the frontend UI — includes direction arrow and magnitude."""
    meta = FEATURE_META.get(feature, {})
    direction = "↑" if shap_val > 0 else "↓"
    return (
        f"{feature}: {round(value, 2)} {meta.get('unit', '')} "
        f"[{_status(feature, value)}, normal: {meta.get('normal', '?')}] "
        f"({direction}{round(abs(shap_val), 3)})"
    )


def _get_signals(explainer, scaler, features, df, row):
    X = scale_features(df.iloc[[-1]], scaler, features)  # now a numpy array
    shap_vals = explainer.shap_values(X)[0]
    ranked = sorted(zip(features, shap_vals), key=lambda x: abs(x[1]), reverse=True)[:3]
    ui_signals = [_format_signal(f, float(row[f]), v) for f, v in ranked if f in row]
    llm_signals = [
        _format_signal_for_llm(f, float(row[f])) for f, v in ranked if f in row
    ]
    return ui_signals, llm_signals


def extract_signals(vital_df, lab_df, priority, lab_service=None, vital_service=None):

    lab_signals = []
    vital_signals = []
    lab_llm_signals = []
    vital_llm_signals = []

    try:
        if lab_df is not None and not lab_df.empty and lab_service and _lab_explainer:
            lab_signals, lab_llm_signals = _get_signals(
                _lab_explainer,
                lab_service.scaler,
                lab_service.features,
                lab_df,
                lab_df.iloc[-1],
            )
    except Exception:
        pass

    try:
        if vital_service and _vital_explainer:
            vital_signals, vital_llm_signals = _get_signals(
                _vital_explainer,
                vital_service.scaler,
                vital_service.features,
                vital_df,
                vital_df.iloc[-1],
            )
    except Exception:
        pass

    return {
        "lab": lab_signals,
        "vitals": vital_signals,
        "lab_llm": lab_llm_signals,
        "vitals_llm": vital_llm_signals,
        "priority": priority,
    }
