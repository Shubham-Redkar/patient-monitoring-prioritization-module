import pandas as pd
from utils.preprocessing import predict_isolation_forest
from utils.vital_rules import rule_based_vital_check


class VitalService:

    def __init__(self, model, scaler, features):
        self.model = model
        self.scaler = scaler
        self.features = features

    def detect_instability(self, vital_df: pd.DataFrame):
        if len(vital_df) < 4:
            anomaly_flag = rule_based_vital_check(vital_df)
            vital_df["vital_anomaly_flag"] = [anomaly_flag]
            return vital_df

        anomaly_flags = predict_isolation_forest(
            model=self.model,
            scaler=self.scaler,
            df=vital_df,
            feature_list=self.features,
        )

        vital_df["vital_anomaly_flag"] = anomaly_flags

        return vital_df
