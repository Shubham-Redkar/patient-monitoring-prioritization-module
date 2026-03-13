import pandas as pd


def compute_vital_features(df: pd.DataFrame, window_size: int = 4):

    vital_cols = [
        "heart_rate",
        "respiratory_rate",
        "spo2_pct",
        "temperature_c",
        "systolic_bp",
        "diastolic_bp"
    ]

    df = df.sort_values(["patient_id", "hour_from_admission"])

    for col in vital_cols:

        df[f"{col}_diff_4h"] = (
            df[col] -
            df.groupby("patient_id")[col].shift(window_size)
        )

        df[f"{col}_roll_std_4h"] = (
            df.groupby("patient_id")[col]
            .rolling(window_size, min_periods=1)
            .std()
            .reset_index(level=0, drop=True)
        )

    return df
