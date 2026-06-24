"""
Application Settings and Configuration
"""
import os
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # ── MongoDB ────────────────────────────────────────────────────────────────
    MONGODB_URL: str = os.getenv("MONGODB_URL", os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    MONGODB_DB: str = os.getenv("MONGODB_DB", "crm_database")

    # ── JWT ────────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # ── API ────────────────────────────────────────────────────────────────────
    API_TITLE: str = "CRM Management System"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "CRM system for enterprise management"

    # ── Server ─────────────────────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://192.168.1.10:3000",
        "http://192.168.1.36:3000",
        "http://10.62.179.92:3000",
    ]
    CORS_ALLOW_REGEX: str = os.getenv(
        "CORS_ALLOW_REGEX",
        r"http://(localhost|127\.0\.0\.1|192\.168\.1\.\d+|10\.62\.179\.\d+):(3000|5173|5174|5175)"
    )
    # Production EC2 origin — appended to CORS_ORIGINS at startup
    FRONTEND_ORIGIN: Optional[str] = None

    # ── File Upload ────────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    ALLOWED_EXTENSIONS: list = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]

    # ── AWS S3 (file storage) ──────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: Optional[str] = None
    # When True, uploads go to S3; when False, falls back to local disk
    USE_S3_STORAGE: bool = bool(os.getenv("S3_BUCKET_NAME"))

    # ── Redis ──────────────────────────────────────────────────────────────────
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    # Cache TTLs (seconds)
    CACHE_TTL_LOOKUPS: int = 3600       # lookup/reference data — 1 hour
    CACHE_TTL_DASHBOARD: int = 300      # dashboard stats — 5 minutes
    CACHE_TTL_ANALYTICS: int = 600      # analytics reports — 10 minutes
    CACHE_TTL_USER: int = 900           # user profile — 15 minutes

    # ── Celery ─────────────────────────────────────────────────────────────────
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/1"))
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/2"))

    # ── Rate Limiting ──────────────────────────────────────────────────────────
    # Requests per minute per IP for sensitive endpoints
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_OTP: str = "5/minute"
    RATE_LIMIT_DEFAULT: str = "200/minute"

    # ── Email ──────────────────────────────────────────────────────────────────
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SENDER_EMAIL: Optional[str] = None

    # ── SMS / Twilio ───────────────────────────────────────────────────────────
    SMS_API_KEY: Optional[str] = None
    SMS_API_URL: Optional[str] = None
    SMS_PROVIDER: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    FAST2SMS_API_KEY: Optional[str] = None
    TWOFACTOR_API_KEY: Optional[str] = None
    VONAGE_API_KEY: Optional[str] = None
    VONAGE_API_SECRET: Optional[str] = None

    # ── AI / Anthropic ─────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: Optional[str] = None


settings = Settings()
