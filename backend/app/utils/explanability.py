import shap
from utils.preprocessing import scale_features

FEATURE_META = {
    "wbc_count": {"unit": "x10⁹/L", "normal": "4–11", "low": 4, "high": 11},
    "lactate": {"unit": "mmol/L", "normal": "< 2", "low": None, "high": 2},
    "creatinine": {"unit": "mg/dL", "normal": "< 1.2", "low": None, "high": 1.2},
    "crp_level": {"unit": "mg/L", "normal": "< 10", "low": None, "high": 10},
    "hemoglobin": {"unit": "g/dL", "normal": "> 12", "low": 12, "high": None},
    "heart_rate": {"unit": "bpm", "normal": "60–100", "low": 60, "high": 100},
    "respiratory_rate": {"unit": "br/min", "normal": "12–20", "low": 12, "high": 20},
    "spo2_pct": {"unit": "%", "normal": "> 95", "low": 95, "high": None},
    "temperature_c": {"unit": "°C", "normal": "36–38.3", "low": 36, "high": 38.3},
    "systolic_bp": {"unit": "mmHg", "normal": "90–120", "low": 90, "high": 120},
    "diastolic_bp": {"unit": "mmHg", "normal": "60–80", "low": 60, "high": 80},
}

# Cache explainers at module level — built once, reused every request
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
                lab_service.scaler.transform([[0] * len(lab_service.features)])
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


def _format_signal(feature, value, shap_val):
    meta = FEATURE_META.get(feature, {})
    direction = "↑" if shap_val > 0 else "↓"
    return (
        f"{feature}: {round(value, 2)} {meta.get('unit', '')} "
        f"[{_status(feature, value)}, normal: {meta.get('normal', '?')}] "
        f"(SHAP {direction}{round(abs(shap_val), 3)})"
    )


def _get_signals(explainer, scaler, features, df, row):
    X = scale_features(df.iloc[[-1]], scaler, features)
    shap_vals = explainer.shap_values(X)[0]
    ranked = sorted(zip(features, shap_vals), key=lambda x: abs(x[1]), reverse=True)[:3]
    return [_format_signal(f, float(row[f]), v) for f, v in ranked if f in row]


def extract_signals(vital_df, lab_df, priority, lab_service=None, vital_service=None):

    lab_signals = []
    vital_signals = []

    try:
        if lab_df is not None and not lab_df.empty and lab_service and _lab_explainer:
            lab_signals = _get_signals(
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
            vital_signals = _get_signals(
                _vital_explainer,
                vital_service.scaler,
                vital_service.features,
                vital_df,
                vital_df.iloc[-1],
            )
    except Exception:
        pass

    return {"lab": lab_signals, "vitals": vital_signals, "priority": priority}
