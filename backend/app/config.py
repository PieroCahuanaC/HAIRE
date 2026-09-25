"""Configuración central del backend, leída desde variables de entorno (.env)."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Base de datos
    database_url: str = Field(alias="DATABASE_URL")

    # Supabase Storage
    supabase_url: str = Field(alias="SUPABASE_URL")
    supabase_service_key: str = Field(alias="SUPABASE_SERVICE_KEY")
    supabase_bucket: str = Field(default="cv", alias="SUPABASE_BUCKET")

    # Groq
    groq_api_key: str = Field(alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    groq_fallback_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_FALLBACK_MODEL")

    # JWT
    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=480, alias="JWT_EXPIRE_MINUTES")

    # Auth interina
    auth_demo_password: str = Field(alias="AUTH_DEMO_PASSWORD")

    # CORS: string separado por comas (se parsea en `cors_origins`).
    cors_origins_raw: str = Field(
        default="http://localhost:3000", alias="CORS_ORIGINS"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
