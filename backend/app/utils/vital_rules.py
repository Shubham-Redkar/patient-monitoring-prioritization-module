from utils.constants import FEATURE_META


def rule_based_vital_check(vital_df):
    row = vital_df.iloc[-1]

    hr = FEATURE_META["heart_rate"]
    if hr["high"] is not None and row["heart_rate"] > hr["high"]:
        return 1
    if hr["low"] is not None and row["heart_rate"] < hr["low"]:
        return 1

    rr = FEATURE_META["respiratory_rate"]
    if rr["high"] is not None and row["respiratory_rate"] > rr["high"]:
        return 1

    spo2 = FEATURE_META["spo2_pct"]
    if spo2["low"] is not None and row["spo2_pct"] < spo2["low"]:
        return 1

    sbp = FEATURE_META["systolic_bp"]
    if sbp["low"] is not None and row["systolic_bp"] < sbp["low"]:
        return 1

    temp = FEATURE_META["temperature_c"]
    if temp["high"] is not None and row["temperature_c"] > temp["high"]:
        return 1
    if temp["low"] is not None and row["temperature_c"] < temp["low"]:
        return 1

    return 0
