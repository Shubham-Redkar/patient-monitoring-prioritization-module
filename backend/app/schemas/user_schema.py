from pydantic import BaseModel, Field
from typing import Literal


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    role: Literal["doctor", "nurse"]


class UserResponse(BaseModel):
    username: str
    role: str
    full_name: str = ""


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
