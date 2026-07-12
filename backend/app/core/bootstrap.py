from pathlib import Path
import logging
import asyncio

import joblib
from pymongo.errors import PyMongoError

from db.mongodb import init_indexes
from db.patient_repo import PatientRepository
from db.user_repo import UserRepository
from services.explanation_service import ExplanationService
from services.lab_service import LabService
from services.prediction_service import PredictionService
from services.vital_service import VitalService
from utils.auth import get_password_hash
from utils.explanability import SignalExplainer


MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
logger = logging.getLogger(__name__)
DEFAULT_USERS = (
    {"username": "doctor", "password": "doctor123", "role": "doctor", "email": "doctor@example.local"},
    {"username": "admin", "password": "admin123", "role": "admin", "email": "admin@example.local"},
    {"username": "nurse", "password": "nurse123", "role": "nurse", "email": "nurse@example.local"},
)


def _load_prediction_services():
    lab_package = joblib.load(MODEL_DIR / "sepsis_logistic_model.pkl")
    vital_package = joblib.load(MODEL_DIR / "vital_anomaly_model.pkl")
    return (
        LabService(
            lab_package["model"],
            lab_package["scaler"],
            lab_package["features"],
            lab_package["threshold"],
        ),
        VitalService(
            vital_package["iso_model"],
            vital_package["scaler"],
            vital_package["features"],
        ),
    )


async def _seed_users(repository):
    for user in DEFAULT_USERS:
        if await repository.get_user_by_username(user["username"]):
            await repository.set_missing_account_fields(
                user["username"], user["email"]
            )
            continue
        await repository.create_user(
            {
                "username": user["username"],
                "hashed_password": get_password_hash(user["password"]),
                "role": user["role"],
                "email": user["email"],
                "token_version": 0,
            }
        )


async def initialize_app_state(app):
    lab_service, vital_service = _load_prediction_services()
    patient_repo = PatientRepository()
    user_repo = UserRepository()
    signal_explainer = SignalExplainer(lab_service, vital_service)

    app.state.lab_service = lab_service
    app.state.vital_service = vital_service
    app.state.patient_repo = patient_repo
    app.state.user_repo = user_repo
    app.state.prediction_service = PredictionService(
        patient_repo,
        lab_service,
        vital_service,
        signal_explainer,
        ExplanationService(),
    )

    try:
        await asyncio.wait_for(init_indexes(), timeout=3)
        await _seed_users(user_repo)
        app.state.database_available = True
    except (PyMongoError, TimeoutError):
        app.state.database_available = False
        logger.warning(
            "MongoDB is unavailable; the API started in limited mode. "
            "Configure MONGO_URI to enable patient and authentication endpoints."
        )
