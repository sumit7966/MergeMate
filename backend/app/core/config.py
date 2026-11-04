import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "MergeMate"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)
    DEMO_MODE: bool = Field(default=True, description="Enable mock data & interactive demo pipeline when GitHub/AI keys are absent")

    # Security
    SECRET_KEY: str = Field(default="mergemate-super-secret-production-grade-key-2026-xyz123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./mergemate.db",
        description="Database connection string (PostgreSQL for prod, SQLite for local fallback)"
    )

    # Redis & Celery
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0")
    CELERY_TASK_ALWAYS_EAGER: bool = Field(default=True, description="When True, tasks execute synchronously if Redis is unavailable")

    # GitHub App Integration
    GITHUB_APP_ID: Optional[str] = Field(default=None)
    GITHUB_APP_PRIVATE_KEY: Optional[str] = Field(default=None)
    GITHUB_APP_CLIENT_ID: Optional[str] = Field(default=None)
    GITHUB_APP_CLIENT_SECRET: Optional[str] = Field(default=None)
    GITHUB_WEBHOOK_SECRET: Optional[str] = Field(default=None)

    # AI Review Engine
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    AI_PROVIDER: str = Field(default="openai")
    AI_MODEL: str = Field(default="gpt-4o-mini")
    AI_TEMPERATURE: float = 0.2
    AI_MAX_TOKENS: int = 4096

    # Static Analysis & Security
    RUFF_ENABLED: bool = True
    BANDIT_ENABLED: bool = True
    SEMGREP_ENABLED: bool = True
    GITLEAKS_ENABLED: bool = True
    OSV_SCANNER_ENABLED: bool = True

    # Isolated Test Runner
    ISOLATED_TESTING_ENABLED: bool = False
    CONTAINER_TIMEOUT_SECONDS: int = 60
    CONTAINER_MAX_MEMORY_MB: int = 512
    CONTAINER_MAX_CPUS: float = 1.0

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:8000"]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
