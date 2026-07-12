from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolves to backend/.env regardless of where uvicorn is launched from
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # MongoDB
    mongo_uri: str = Field("mongodb://127.0.0.1:27017", validation_alias="MONGO_URI")
    mongo_db: str = Field("patient_monitoring", validation_alias="MONGO_DB")

    # Auth
    jwt_secret_key: str = Field(
        "development-only-change-this-secret", validation_alias="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = Field("HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        60 * 24, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # Groq
    groq_api_key: str = Field("", validation_alias="GROQ_API_KEY")
    groq_model: str = Field("llama-3.1-8b-instant", validation_alias="GROQ_MODEL")

    # Password recovery. Empty SMTP_HOST logs reset links for local development.
    frontend_url: str = Field("http://localhost:5173", validation_alias="FRONTEND_URL")
    smtp_host: str = Field("", validation_alias="SMTP_HOST")
    smtp_port: int = Field(587, validation_alias="SMTP_PORT")
    smtp_username: str = Field("", validation_alias="SMTP_USERNAME")
    smtp_password: str = Field("", validation_alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(
        "no-reply@sepsis-monitor.local", validation_alias="SMTP_FROM_EMAIL"
    )
    smtp_use_tls: bool = Field(True, validation_alias="SMTP_USE_TLS")
    password_reset_expire_minutes: int = Field(
        30, validation_alias="PASSWORD_RESET_EXPIRE_MINUTES"
    )

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
