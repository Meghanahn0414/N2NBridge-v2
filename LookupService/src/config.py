"""
Lookup Service settings.
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # ── MongoDB (the lookup service's OWN db — never a representative's db) ─────
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB:  str = os.getenv("MONGODB_DB", "master_lookup")

    # ── Auth for representative servers registering themselves ──────────────────
    LOOKUP_REGISTER_KEY: str = os.getenv("LOOKUP_REGISTER_KEY", "change-this-shared-secret")

    # ── Server ────────────────────────────────────────────────────────────────
    HOST:  str  = os.getenv("HOST", "0.0.0.0")
    PORT:  int  = int(os.getenv("PORT", "9000"))
    DEBUG: bool = os.getenv("DEBUG", "False").strip().lower() in ("1", "true", "yes")

    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")


settings = Settings()
