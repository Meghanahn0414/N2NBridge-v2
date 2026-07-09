from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application config. In production these come from the cloud vault,
    not a committed .env file."""

    DATABASE_URL: str = "postgresql+psycopg2://localhost:5432/n2bridge"
    JWT_SECRET: str = "dev-only-change-me"
    APP_ORIGINS: str = "http://localhost:8081"
    REDIS_URL: str = "redis://localhost:6379/0"
    APNS_CERT: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.APP_ORIGINS.split(",") if o.strip()]


settings = Settings()
