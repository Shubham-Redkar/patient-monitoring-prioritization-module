from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path

# Resolves to backend/.env regardless of where uvicorn is launched from
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # MongoDB
    mongo_uri: str = Field(..., validation_alias="MONGO_URI")
    mongo_db: str = Field(..., validation_alias="MONGO_DB")

    # Auth
    jwt_secret_key: str = Field(..., validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        60 * 24, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # Groq
    groq_api_key: str = Field(..., validation_alias="GROQ_API_KEY")
    groq_model: str = Field("llama-3.1-8b-instant", validation_alias="GROQ_MODEL")

    # Gemini
    google_api_key: str = Field("", validation_alias="GOOGLE_API_KEY")
    gemini_model: str = Field("gemini-2.0-flash", validation_alias="GEMINI_MODEL")

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
