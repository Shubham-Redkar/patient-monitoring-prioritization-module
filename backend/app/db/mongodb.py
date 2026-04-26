from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from core.config import get_settings
import certifi


_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            get_settings().mongo_uri,
            tls=True,
            tlsCAFile=certifi.where(),
        )
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

    print("MongoDB indexes ensured.")
