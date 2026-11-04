from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class RepositorySettingsBase(BaseModel):
    auto_review_enabled: bool = True
    ai_review_enabled: bool = True
    static_analysis_enabled: bool = True
    security_scanning_enabled: bool = True
    test_execution_enabled: bool = False
    github_publishing_enabled: bool = True
    severity_threshold: str = "low"
    ai_model: str = "gpt-4o-mini"
    custom_instructions: Optional[str] = None
    excluded_paths: Optional[List[str]] = ["*.lock", "dist/*", "build/*", "node_modules/*", ".git/*"]
    max_file_size_kb: int = 500


class RepositorySettingsUpdate(BaseModel):
    auto_review_enabled: Optional[bool] = None
    ai_review_enabled: Optional[bool] = None
    static_analysis_enabled: Optional[bool] = None
    security_scanning_enabled: Optional[bool] = None
    test_execution_enabled: Optional[bool] = None
    github_publishing_enabled: Optional[bool] = None
    severity_threshold: Optional[str] = None
    ai_model: Optional[str] = None
    custom_instructions: Optional[str] = None
    excluded_paths: Optional[List[str]] = None
    max_file_size_kb: Optional[int] = None


class RepositorySettingsResponse(RepositorySettingsBase):
    id: str
    repository_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RepositoryBase(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    is_private: bool = False
    default_branch: str = "main"
    language: Optional[str] = None
    is_active: bool = True


class RepositoryResponse(RepositoryBase):
    id: str
    organization_id: str
    github_repo_id: int
    created_at: datetime
    updated_at: datetime
    settings: Optional[RepositorySettingsResponse] = None

    class Config:
        from_attributes = True
