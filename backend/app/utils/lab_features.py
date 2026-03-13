import pandas as pd


LAB_COLS = ["wbc_count", "lactate", "creatinine", "crp_level", "hemoglobin"]

WINDOW_SIZE = 6


def compute_lab_features(df: pd.DataFrame):

    df = df.sort_values(["patient_id", "hour_from_admission"]).reset_index(drop=True)

    for col in LAB_COLS:

        df[f"{col}_roll_mean_6h"] = (
            df.groupby("patient_id")[col]
            .rolling(WINDOW_SIZE, min_periods=1)
            .mean()
            .reset_index(level=0, drop=True)
        )

        df[f"{col}_trend_6h"] = df[col] - df[f"{col}_roll_mean_6h"]

    return df
