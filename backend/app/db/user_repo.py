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
