import pandas as pd
from utils.preprocessing import predict_logistic

LAB_FEATURES = ["lactate", "wbc_count", "creatinine", "crp_level", "hemoglobin"]


class LabService:

    def __init__(self, model, scaler, features, threshold):
        self.model = model
        self.scaler = scaler
        self.features = features
        self.threshold = threshold

    def _engineer_features(self, lab_df: pd.DataFrame) -> pd.DataFrame:
        df = lab_df.copy()

        for col in LAB_FEATURES:
            df[f"{col}_roll_mean_6h"] = df[col]
            df[f"{col}_trend_6h"] = 0.0

        return df

    def predict_lab_risk(self, lab_df: pd.DataFrame):
        lab_df = self._engineer_features(lab_df)

        prob, label = predict_logistic(
            model=self.model,
            scaler=self.scaler,
            df=lab_df,
            feature_list=self.features,
            threshold=self.threshold,
        )

        return {"lab_risk_probability": float(prob[0]), "lab_risk_label": int(label[0])}
