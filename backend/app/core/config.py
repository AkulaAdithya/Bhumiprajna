"""
Bhumi Prajna - Application Configuration
Loads settings from environment variables / .env file.
Secrets are kept outside source code.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:@localhost:5432/pravaah"

    # JWT
    JWT_SECRET_KEY: str = "change-this-to-a-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Application
    APP_NAME: str = "Bhumi Prajna"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Admin seed credentials
    ADMIN_EMAIL: str = "admin@pravaah.gov.in"
    ADMIN_PASSWORD: str = "Pravaah@2026"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
