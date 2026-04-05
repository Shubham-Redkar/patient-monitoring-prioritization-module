from pydantic import BaseModel, Field, field_validator
from typing import Literal
import re


class UserCreate(BaseModel):
    # FIX: added input validation — previously any string (including empty) was accepted
    username: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=128)
    # FIX: role is now a Literal so the schema rejects unknown roles at parse time,
    # before the auth_routes allowlist even gets a chance to check it
    role: Literal["doctor", "nurse"]


class UserResponse(BaseModel):
    username: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
