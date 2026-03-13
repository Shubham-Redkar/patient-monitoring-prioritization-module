import pandas as pd
from utils.preprocessing import predict_logistic


class LabService:

    def __init__(self, model, scaler, features, threshold):
        self.model = model
        self.scaler = scaler
        self.features = features
        self.threshold = threshold

    def predict_lab_risk(self, df: pd.DataFrame):

        prob, label = predict_logistic(
            model=self.model,
            scaler=self.scaler,
            df=df,
            feature_list=self.features,
            threshold=self.threshold,
        )

        return {
            "lab_risk_probability": float(prob[0]),
            "lab_risk_label": int(label[0]),
        }
