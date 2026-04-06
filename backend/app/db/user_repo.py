from db.mongodb import get_db


class UserRepository:
    @property
    def col(self):
        return get_db().users

    async def get_user_by_username(self, username: str):
        return await self.col.find_one({"username": username})

    async def create_user(self, user_dict: dict):
        result = await self.col.insert_one(user_dict)
        return result.inserted_id

    async def list_users(self) -> list[dict]:
        cursor = self.col.find({}, {"_id": 0, "hashed_password": 0})
        return await cursor.to_list(length=None)

    async def delete_user(self, username: str) -> int:
        result = await self.col.delete_one({"username": username})
        return result.deleted_count
