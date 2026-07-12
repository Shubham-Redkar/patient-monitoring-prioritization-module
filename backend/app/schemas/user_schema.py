from pydantic import BaseModel, Field, field_validator
from typing import Literal
import re


class EmailModel(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("Enter a valid email address")
        return value


class UserCreate(EmailModel):
    username: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=72)
    role: Literal["doctor", "nurse"]


class AdminUserCreate(EmailModel):
    username: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=72)
    role: Literal["doctor", "nurse", "admin"]
    full_name: str = Field("", max_length=100)


class UserResponse(BaseModel):
    username: str
    role: str
    full_name: str = ""
    email: str = ""


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72)


class ForgotPasswordRequest(EmailModel):
    pass


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=20)
    new_password: str = Field(..., min_length=8, max_length=72)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
