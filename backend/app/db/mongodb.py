from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from dotenv import load_dotenv
import os
import certifi

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB")

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            MONGO_URI,
            tls=True,
            tlsCAFile=certifi.where(),
        )
    return _client


def get_db():
    return get_client()[DB_NAME]


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

    # FIX: users collection had no index on username — every login and /me check
    # performed a full collection scan. unique=True also prevents duplicate usernames
    # at the database layer (previously only the app layer checked for duplicates,
    # which had a race-condition window).
    await db.users.create_index(
        [("username", ASCENDING)],
        unique=True,
        name="users_username_unique",
    )

    print("MongoDB indexes ensured.")
