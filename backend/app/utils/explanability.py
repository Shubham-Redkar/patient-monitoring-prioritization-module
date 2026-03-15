import shap
from utils.preprocessing import scale_features

FEATURE_META = {
    "wbc_count": {"unit": "x10⁹/L", "normal": "4-11", "low": 4, "high": 11},
    "lactate": {"unit": "mmol/L", "normal": "< 2", "low": None, "high": 2},
    "creatinine": {"unit": "mg/dL", "normal": "< 1.2", "low": None, "high": 1.2},
    "crp_level": {"unit": "mg/L", "normal": "< 10", "low": None, "high": 10},
    "hemoglobin": {"unit": "g/dL", "normal": "> 12", "low": 12, "high": None},
    "heart_rate": {"unit": "bpm", "normal": "60-100", "low": 60, "high": 100},
    "respiratory_rate": {
        "unit": "breaths/min",
        "normal": "12-20",
        "low": 12,
        "high": 20,
    },
    "spo2_pct": {"unit": "%", "normal": "> 95", "low": 95, "high": None},
    "temperature_c": {"unit": "°C", "normal": "36-38.3", "low": 36, "high": 38.3},
    "systolic_bp": {"unit": "mmHg", "normal": "90-120", "low": 90, "high": 120},
    "diastolic_bp": {"unit": "mmHg", "normal": "60-80", "low": 60, "high": 80},
}


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
    unit = meta.get("unit", "")
    normal = meta.get("normal", "unknown")
    status = _status(feature, value)
    direction = "↑" if shap_val > 0 else "↓"
    return (
        f"{feature}: {round(value, 2)} {unit} "
        f"[{status}, normal: {normal}] "
        f"(SHAP {direction}{round(abs(shap_val), 3)})"
    )


def get_top_shap_signals(model, scaler, features, df, explainer_cls, row):
    X = scale_features(df.iloc[[-1]], scaler, features)
    explainer = (
        explainer_cls(model, X)
        if explainer_cls == shap.LinearExplainer
        else shap.TreeExplainer(model)
    )
    shap_vals = explainer.shap_values(X)[0]

    ranked = sorted(zip(features, shap_vals), key=lambda x: abs(x[1]), reverse=True)[:3]

    return [_format_signal(f, float(row[f]), v) for f, v in ranked if f in row]


def extract_signals(vital_df, lab_df, priority, lab_service=None, vital_service=None):

    lab_signals = []
    vital_signals = []

    try:
        if lab_df is not None and not lab_df.empty and lab_service:
            lab_signals = get_top_shap_signals(
                lab_service.model,
                lab_service.scaler,
                lab_service.features,
                lab_df,
                shap.LinearExplainer,
                lab_df.iloc[-1],
            )
    except Exception:
        pass

    try:
        if vital_service:
            vital_signals = get_top_shap_signals(
                vital_service.model,
                vital_service.scaler,
                vital_service.features,
                vital_df,
                shap.TreeExplainer,
                vital_df.iloc[-1],
            )
    except Exception:
        pass

    return {"lab": lab_signals, "vitals": vital_signals, "priority": priority}
