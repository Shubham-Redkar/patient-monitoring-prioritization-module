def rule_based_vital_check(vital_df):

    row = vital_df.iloc[-1]

    if row["heart_rate"] > 120:
        return 1

    if row["respiratory_rate"] > 30:
        return 1

    if row["spo2_pct"] < 90:
        return 1

    if row["systolic_bp"] < 90:
        return 1

    if row["temperature_c"] > 38.5:
        return 1

    return 0
