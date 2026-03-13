import numpy as np
import pandas as pd


def ensure_sorted(df: pd.DataFrame):
    return df.sort_values(["patient_id", "hour_from_admission"]).reset_index(drop=True)


def handle_missing(df: pd.DataFrame, fill_value: float = 0.0):
    return df.fillna(fill_value)


def select_features(df: pd.DataFrame, feature_list: list):
    return df[feature_list]


def scale_features(df: pd.DataFrame, scaler, feature_list: list):
    df = select_features(df, feature_list)
    df = handle_missing(df)
    return scaler.transform(df)

def predict_logistic(model, scaler, df, feature_list, threshold):
    X_scaled = scale_features(df, scaler, feature_list)

    prob = model.predict_proba(X_scaled)[:, 1]
    label = (prob >= threshold).astype(int)

    return prob, label


def predict_isolation_forest(model, scaler, df, feature_list):
    X_scaled = scale_features(df, scaler, feature_list)

    preds = model.predict(X_scaled)

    anomaly_flag = np.where(preds == -1, 1, 0)

    return anomaly_flag
