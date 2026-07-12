import pandas as pd


IDENTITY_COLUMNS = ["patient_id", "hour_from_admission"]


def sorted_readings(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.sort_values(IDENTITY_COLUMNS).reset_index(drop=True)


def grouped_rolling(frame, column, window, operation):
    return (
        frame.groupby("patient_id")[column]
        .rolling(window, min_periods=1)
        .agg(operation)
        .reset_index(level=0, drop=True)
    )
