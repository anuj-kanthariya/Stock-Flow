"""
Application configuration settings using Pydantic BaseSettings.
Load environment variables from .env file.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly find and load the backend/.env file from the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_FILE_PATH, override=True)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # App
    APP_NAME: str = "StockFlow"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = ""

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://stockflow.app,https://stock-flow-three-eta.vercel.app"
    ).split(",")

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Business Logic
    DEFAULT_TAX_RATE: float = 18.0
    DEFAULT_CURRENCY: str = "INR"
    DEFAULT_LOW_STOCK_THRESHOLD: int = 10

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Storage
    STORAGE_PROVIDER: str = "local"


settings = Settings()
