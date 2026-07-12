import pandas as pd
from utils.feature_engineering import grouped_rolling, sorted_readings


LAB_COLS = ["wbc_count", "lactate", "creatinine", "crp_level", "hemoglobin"]

WINDOW_SIZE = 6


def compute_lab_features(df: pd.DataFrame):

    df = sorted_readings(df)

    for col in LAB_COLS:

        df[f"{col}_roll_mean_6h"] = grouped_rolling(
            df, col, WINDOW_SIZE, "mean"
        )

        df[f"{col}_trend_6h"] = df[col] - df[f"{col}_roll_mean_6h"]

    return df
