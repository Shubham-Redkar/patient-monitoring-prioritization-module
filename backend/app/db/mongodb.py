import certifi
from core.config import get_settings
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        uri = get_settings().mongo_uri
        options = {"serverSelectionTimeoutMS": 2000}
        if uri.startswith("mongodb+srv://"):
            options.update(tls=True, tlsCAFile=certifi.where())
        _client = AsyncIOMotorClient(uri, **options)
    return _client


def get_db():
    return get_client()[get_settings().mongo_db]


async def init_indexes():
    db = get_db()

    await db.patient_readings.create_index(
        [("patient_id", ASCENDING), ("hour_from_admission", ASCENDING)],
        unique=True,
        name="patient_hour_unique",
    )

    await db.patient_readings.create_index(
        [("patient_id", ASCENDING), ("hour_from_admission", DESCENDING)],
        name="patient_hour_desc",
    )

    await db.patient_readings.create_index(
        [("predictions.vital_anomaly_flag", ASCENDING), ("patient_id", ASCENDING)],
        name="anomaly_patient",
    )

    await db.users.create_index(
        [("username", ASCENDING)],
        unique=True,
        name="users_username_unique",
    )
    await db.users.create_index(
        [("email", ASCENDING)], unique=True, sparse=True, name="users_email_unique"
    )
    await db.password_reset_tokens.create_index(
        [("expires_at", ASCENDING)], expireAfterSeconds=0, name="reset_token_expiry"
    )
    await db.password_reset_tokens.create_index(
        [("token_hash", ASCENDING)], unique=True, name="reset_token_unique"
    )

    print("MongoDB indexes ensured.")
