import pandas as pd
from utils.feature_engineering import grouped_rolling, sorted_readings

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

    df = sorted_readings(df)

    for col in VITAL_COLS:

        df[f"{col}_diff_4h"] = df[col] - df.groupby("patient_id")[col].shift(
            WINDOW_SIZE
        )

        df[f"{col}_roll_std_4h"] = grouped_rolling(
            df, col, WINDOW_SIZE, "std"
        )

    return df
