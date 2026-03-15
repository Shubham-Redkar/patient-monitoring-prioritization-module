from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import joblib

from routes.upload_routes import router as upload_router
from routes.prediction_routes import router as prediction_router
from routes.alert_routes import router as alert_router
from routes.patient_routes import router as patient_router

from services.lab_service import LabService
from services.vital_service import VitalService

from db.mongodb import init_indexes
from db.patient_repo import PatientRepository


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

    app.state.patient_repo = PatientRepository()

    await init_indexes()

    yield


app = FastAPI(title="Sepsis Monitoring API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Patient Monitoring Module"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(prediction_router)
app.include_router(upload_router)
app.include_router(alert_router)
app.include_router(patient_router)
