"""
Application Settings and Configuration
"""
from typing import Optional
import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "crm_database"
    
    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # API
    API_TITLE: str = "CRM Management System"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "CRM system for enterprise management"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Security
    # CORS: allow local frontend origins during development
    # In production, narrow this to the exact production origins.
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://10.62.179.92:3000",
    ]
    
    # File upload - use absolute path to project root/uploads
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    ALLOWED_EXTENSIONS: list = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]
    
    # Email (if needed)
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SENDER_EMAIL: Optional[str] = None
    
    # SMS Service
    SMS_API_KEY: Optional[str] = None
    SMS_PROVIDER: Optional[str] = None


# Create settings instance that loads from .env
settings = Settings()
