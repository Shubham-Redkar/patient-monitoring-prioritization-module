from db.mongodb import get_db
from datetime import datetime, timezone


class UserRepository:
    @property
    def col(self):
        return get_db().users

    async def get_user_by_username(self, username: str):
        return await self.col.find_one({"username": username})

    async def get_user_by_email(self, email: str):
        return await self.col.find_one({"email": email.lower()})

    async def create_user(self, user_dict: dict):
        result = await self.col.insert_one(user_dict)
        return result.inserted_id

    async def set_missing_account_fields(self, username: str, email: str):
        await self.col.update_one(
            {"username": username, "email": {"$exists": False}},
            {"$set": {"email": email, "token_version": 0}},
        )

    async def list_users(self) -> list[dict]:
        cursor = self.col.find({}, {"_id": 0, "hashed_password": 0})
        return await cursor.to_list(length=None)

    async def delete_user(self, username: str) -> int:
        result = await self.col.delete_one({"username": username})
        return result.deleted_count

    async def update_password(self, username: str, hashed_password: str):
        return await self.col.update_one(
            {"username": username},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "password_changed_at": datetime.now(timezone.utc),
                },
                "$inc": {"token_version": 1},
            },
        )

    async def create_password_reset_token(self, username, token_hash, expires_at):
        tokens = get_db().password_reset_tokens
        await tokens.delete_many({"username": username})
        await tokens.insert_one(
            {
                "username": username,
                "token_hash": token_hash,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
            }
        )

    async def consume_password_reset_token(self, token_hash: str):
        return await get_db().password_reset_tokens.find_one_and_delete(
            {
                "token_hash": token_hash,
                "expires_at": {"$gt": datetime.now(timezone.utc)},
            }
        )
