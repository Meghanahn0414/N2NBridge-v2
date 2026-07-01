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
    # Master DB stores the representative registry (slug → tenant db_name mapping)
    MONGODB_MASTER_DB: str = os.getenv("MONGODB_MASTER_DB", "crm_master")

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
        "http://localhost:19006",      # Expo web dev server
        "http://127.0.0.1:19006",
        "http://192.168.1.10:3000",
        "http://192.168.1.36:3000",
        "http://10.62.179.92:3000",
    ]
    CORS_ALLOW_REGEX: str = os.getenv(
        "CORS_ALLOW_REGEX",
        r"http://(localhost|127\.0\.0\.1|192\.168\.1\.\d+|10\.62\.179\.\d+)(:\d+)?"
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
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_EMAIL") or os.getenv("SENDER_EMAIL")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    SENDER_EMAIL: Optional[str] = os.getenv("SENDER_EMAIL") or os.getenv("SMTP_USERNAME") or os.getenv("SMTP_EMAIL")

    # ── SMS / Twilio ───────────────────────────────────────────────────────────
    SMS_API_KEY: Optional[str] = os.getenv("SMS_API_KEY")
    SMS_API_URL: Optional[str] = os.getenv("SMS_API_URL")
    SMS_PROVIDER: Optional[str] = os.getenv("SMS_PROVIDER") or "fast2sms"
    TWILIO_ACCOUNT_SID: Optional[str] = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: Optional[str] = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: Optional[str] = os.getenv("TWILIO_PHONE_NUMBER")
    FAST2SMS_API_KEY: Optional[str] = os.getenv("FAST2SMS_API_KEY")
    TWOFACTOR_API_KEY: Optional[str] = None
    VONAGE_API_KEY: Optional[str] = None
    VONAGE_API_SECRET: Optional[str] = None

    # ── AI / Anthropic ─────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: Optional[str] = None


settings = Settings()
