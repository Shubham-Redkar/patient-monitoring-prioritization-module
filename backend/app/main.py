from fastapi import FastAPI
from contextlib import asynccontextmanager
import joblib

from routes.prediction_routes import router
from services.lab_service import LabService
from services.vital_service import VitalService


@asynccontextmanager
async def lifespan(app: FastAPI):
    lab_package = joblib.load("models/sepsis_logistic_model.pkl")
    vital_package = joblib.load("models/vital_anomaly_model.pkl")

    app.state.lab_service = LabService(
        lab_package["model"],
        lab_package["scaler"],
        lab_package["features"],
        lab_package["threshold"],
    )

    app.state.vital_service = VitalService(
        vital_package["iso_model"], vital_package["scaler"], vital_package["features"]
    )

    yield


app = FastAPI(title="Sepsis Monitoring API", version="1.0.0", lifespan=lifespan)


@app.get("/")
def root():
    return "Patient Monitoring Module"


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(router)
