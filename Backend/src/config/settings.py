"""
Application Settings and Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "crm_database"
    
    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # API
    API_TITLE: str = "CRM Grievance Management System"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "Government CRM system for grievance management"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # Security
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080"]
    
    # File upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    ALLOWED_EXTENSIONS: list = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]
    
    # Email (if needed)
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SENDER_EMAIL: Optional[str] = None
    
    # SMS Service
    SMS_API_KEY: Optional[str] = None
    SMS_PROVIDER: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance that loads from .env
settings = Settings()


settings = Settings()
