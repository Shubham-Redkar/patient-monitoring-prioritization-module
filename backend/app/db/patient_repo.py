from typing import Optional
from datetime import datetime, timezone
from db.mongodb import get_db
from pymongo import ReplaceOne


class PatientRepository:

    @property
    def col(self):
        return get_db().patient_readings

    @property
    def meta_col(self):
        return get_db().patient_meta

    # Insert or update a reading
    async def upsert_reading(
        self,
        patient_id: int,
        hour_from_admission: int,
        vitals: dict,
        predictions: dict,
        labs: Optional[dict] = None,
    ):

        doc = {
            "patient_id": patient_id,
            "hour_from_admission": hour_from_admission,
            "vitals": vitals,
            "labs": labs,
            "predictions": predictions,
        }

        await self.col.replace_one(
            {
                "patient_id": patient_id,
                "hour_from_admission": hour_from_admission,
            },
            doc,
            upsert=True,
        )

    # Bulk insert for seeding data
    async def bulk_upsert_readings(self, readings: list[dict]):

        if not readings:
            return

        ops = [
            ReplaceOne(
                {
                    "patient_id": r["patient_id"],
                    "hour_from_admission": r["hour_from_admission"],
                },
                r,
                upsert=True,
            )
            for r in readings
        ]

        await self.col.bulk_write(ops, ordered=False)

    # Fetch history between hours
    async def get_history(
        self,
        patient_id: int,
        from_hour: int,
        to_hour: int,
    ) -> list[dict]:

        cursor = self.col.find(
            {
                "patient_id": patient_id,
                "hour_from_admission": {"$gte": from_hour, "$lte": to_hour},
            },
            {"_id": 0},
        ).sort("hour_from_admission", 1)

        return await cursor.to_list(length=None)

    # Latest reading for a patient
    async def get_latest_reading(self, patient_id: int) -> Optional[dict]:

        return await self.col.find_one(
            {"patient_id": patient_id},
            {"_id": 0},
            sort=[("hour_from_admission", -1)],
        )

    # List all patients
    async def list_patients(self) -> list[int]:

        return await self.col.distinct("patient_id")

    async def acknowledge_alert(self, patient_id, doctor_name):

        result = await self.col.update_one(
            {"patient_id": patient_id},
            {
                "$set": {
                    "alert.acknowledged": True,
                    "alert.acknowledged_by": doctor_name,
                    "alert.acknowledged_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.modified_count

    async def override_patient_priority(
        self, patient_id: int, priority: str, reason: str, doctor_name: str
    ):
        await self.meta_col.update_one(
            {"patient_id": patient_id},
            {
                "$set": {
                    "manual_priority": priority,
                    "manual_priority_reason": reason,
                    "manual_priority_by": doctor_name,
                    "manual_priority_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

    async def get_patient_meta(self, patient_id: int):
        return await self.meta_col.find_one({"patient_id": patient_id})
