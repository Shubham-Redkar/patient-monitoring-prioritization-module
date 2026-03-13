import pandas as pd

VITAL_COLS = [
    "heart_rate",
    "respiratory_rate",
    "spo2_pct",
    "temperature_c",
    "systolic_bp",
    "diastolic_bp",
]

WINDOW_SIZE = 4


def compute_vital_features(df: pd.DataFrame):

    df = df.sort_values(["patient_id", "hour_from_admission"]).reset_index(drop=True)

    for col in VITAL_COLS:

        df[f"{col}_diff_4h"] = df[col] - df.groupby("patient_id")[col].shift(
            WINDOW_SIZE
        )

        df[f"{col}_roll_std_4h"] = (
            df.groupby("patient_id")[col]
            .rolling(WINDOW_SIZE, min_periods=1)
            .std()
            .reset_index(level=0, drop=True)
        )

    return df
