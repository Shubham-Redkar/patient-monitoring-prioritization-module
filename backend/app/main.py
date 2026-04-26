from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routes.upload_routes import router as upload_router
from routes.prediction_routes import router as prediction_router
from routes.alert_routes import router as alert_router
from routes.patient_routes import router as patient_router
from routes.auth_routes import router as auth_router
from services.lab_service import LabService
from services.vital_service import VitalService
from db.mongodb import init_indexes
from db.patient_repo import PatientRepository
from db.user_repo import UserRepository
from utils.explanability import init_explainers
from utils.auth import get_password_hash
import joblib


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
    app.state.user_repo = UserRepository()

    init_explainers(app.state.lab_service, app.state.vital_service)

    await init_indexes()

    default_users = [
        {"username": "doctor", "password": "doctor123", "role": "doctor"},
        {"username": "admin", "password": "admin123", "role": "admin"},
        {"username": "nurse", "password": "nurse123", "role": "nurse"},
    ]
    for u in default_users:
        existing = await app.state.user_repo.get_user_by_username(u["username"])
        if not existing:
            await app.state.user_repo.create_user(
                {
                    "username": u["username"],
                    "hashed_password": get_password_hash(u["password"]),
                    "role": u["role"],
                }
            )

    yield


app = FastAPI(title="Sepsis Monitoring API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Catch-all for unhandled exceptions so every route avoids boilerplate
    try/except blocks. HTTPExceptions are re-raised by FastAPI before reaching
    this handler, so they are unaffected."""
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/")
def root():
    return {"message": "Patient Monitoring Module"}


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(upload_router)
app.include_router(alert_router)
app.include_router(patient_router)
