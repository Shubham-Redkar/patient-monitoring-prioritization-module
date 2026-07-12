from utils.constants import FEATURE_META


def rule_based_vital_check(vital_df):
    row = vital_df.iloc[-1]
    monitored_limits = (
        ("heart_rate", True, True),
        ("respiratory_rate", False, True),
        ("spo2_pct", True, False),
        ("systolic_bp", True, False),
        ("temperature_c", True, True),
    )
    for feature, check_low, check_high in monitored_limits:
        limits = FEATURE_META[feature]
        value = row[feature]
        below_minimum = check_low and value < limits["low"]
        above_maximum = check_high and value > limits["high"]
        if below_minimum or above_maximum:
            return 1
    return 0
