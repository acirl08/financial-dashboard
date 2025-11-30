from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Google Gemini
    gemini_api_key: str

    # App
    frontend_url: str = "http://localhost:5173"
    secret_key: str
    expense_email_label: str = "Expenses"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
