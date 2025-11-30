import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Settings class that reads from environment variables."""

    def __init__(self):
        # Debug: Print available env vars (will show in Railway logs)
        print("Loading settings from environment...")
        print(f"Available env vars: {[k for k in os.environ.keys() if not k.startswith('_')]}")

        # Supabase
        self.supabase_url = os.environ.get("SUPABASE_URL", "")
        self.supabase_key = os.environ.get("SUPABASE_KEY", "")
        self.supabase_service_key = os.environ.get("SUPABASE_SERVICE_KEY", "")

        # Google OAuth
        self.google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        self.google_client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        self.google_redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

        # Google Gemini
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY", "")

        # App
        self.frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
        self.secret_key = os.environ.get("SECRET_KEY", "default-secret-key")
        self.expense_email_label = os.environ.get("EXPENSE_EMAIL_LABEL", "Expenses")

        # Validate required settings
        missing = []
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.supabase_key:
            missing.append("SUPABASE_KEY")
        if not self.supabase_service_key:
            missing.append("SUPABASE_SERVICE_KEY")
        if not self.google_client_id:
            missing.append("GOOGLE_CLIENT_ID")
        if not self.google_client_secret:
            missing.append("GOOGLE_CLIENT_SECRET")
        if not self.gemini_api_key:
            missing.append("GEMINI_API_KEY")

        if missing:
            print(f"WARNING: Missing environment variables: {missing}")
            print("The app may not work correctly without these.")


_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
