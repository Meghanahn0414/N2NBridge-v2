# Application Settings
import os
from dotenv import load_dotenv

load_dotenv()

# Database Settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "crm_db")

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# API Settings
API_VERSION = "v1"
API_TITLE = "CRM API"
DEBUG = os.getenv("DEBUG", "True") == "True"

# CORS Settings
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
]

# File Upload Settings
UPLOAD_DIR = "uploads/profiles"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
