from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "dev"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    database_url: str = "sqlite:///./app.db"
    data_dir: str = "./data"

    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    auth_disabled: bool = True
    auth_token: str | None = None

    default_model_provider: str = "openai"
    default_model_base_url: str = "https://api.openai.com"
    default_model_name: str = "gpt-4o-mini"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

