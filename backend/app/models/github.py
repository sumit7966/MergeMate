from typing import Optional, List
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class GitHubInstallation(Base, TimestampMixin):
    __tablename__ = "github_installations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    installation_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    account_login: Mapped[str] = mapped_column(String(100), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), default="Organization")  # User or Organization
    target_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    events: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    suspended_at: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="installations")
    repositories: Mapped[List["Repository"]] = relationship("Repository", back_populates="installation", cascade="all, delete-orphan")

