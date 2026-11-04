from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class Repository(Base, TimestampMixin):
    __tablename__ = "repositories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    github_installation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("github_installations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    github_repo_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)  # owner/repo
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    default_branch: Mapped[str] = mapped_column(String(100), default="main", nullable=False)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="repositories")
    installation: Mapped[Optional["GitHubInstallation"]] = relationship("GitHubInstallation", back_populates="repositories")
    settings: Mapped[Optional["RepositorySettings"]] = relationship("RepositorySettings", back_populates="repository", uselist=False, cascade="all, delete-orphan")
    pull_requests: Mapped[List["PullRequest"]] = relationship("PullRequest", back_populates="repository", cascade="all, delete-orphan")


class RepositorySettings(Base, TimestampMixin):
    __tablename__ = "repository_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    repository_id: Mapped[str] = mapped_column(String(36), ForeignKey("repositories.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Feature Toggles
    auto_review_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ai_review_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    static_analysis_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    security_scanning_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    test_execution_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    github_publishing_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Thresholds & Rules
    severity_threshold: Mapped[str] = mapped_column(String(20), default="low", nullable=False)  # low, medium, high, critical
    ai_model: Mapped[str] = mapped_column(String(50), default="gpt-4o-mini", nullable=False)
    custom_instructions: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    excluded_paths: Mapped[Optional[list]] = mapped_column(JSON, default=lambda: ["*.lock", "dist/*", "build/*", "node_modules/*", ".git/*"])
    max_file_size_kb: Mapped[int] = mapped_column(Integer, default=500, nullable=False)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="settings")
