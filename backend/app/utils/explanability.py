def extract_signals(vital_df, lab_df, priority):

    lab_signals = []
    vital_signals = []

    if lab_df["lactate"].iloc[-1] > 2:
        lab_signals.append("Elevated lactate level")

    if lab_df["crp_level"].iloc[-1] > 30:
        lab_signals.append("High CRP indicating inflammation")

    if vital_df["heart_rate_diff_4h"].iloc[-1] > 20:
        vital_signals.append("Rapid increase in heart rate")

    if vital_df["respiratory_rate_roll_std_4h"].iloc[-1] > 4:
        vital_signals.append("Respiratory instability")

    return {"lab": lab_signals, "vitals": vital_signals, "priority": priority}
