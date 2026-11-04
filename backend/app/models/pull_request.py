from typing import Optional, List
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class PullRequest(Base, TimestampMixin):
    __tablename__ = "pull_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    repository_id: Mapped[str] = mapped_column(String(36), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False, index=True)
    
    github_pr_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    pr_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    state: Mapped[str] = mapped_column(String(20), default="open", nullable=False)  # open, closed, merged
    author_username: Mapped[str] = mapped_column(String(100), nullable=False)
    author_avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    source_branch: Mapped[str] = mapped_column(String(200), nullable=False)
    target_branch: Mapped[str] = mapped_column(String(200), nullable=False)
    head_sha: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    base_sha: Mapped[str] = mapped_column(String(40), nullable=False)
    
    html_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    diff_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    additions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    deletions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    changed_files_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    meta_info: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    # Relationships
    repository: Mapped["Repository"] = relationship("Repository", back_populates="pull_requests")
    review_jobs: Mapped[List["ReviewJob"]] = relationship("ReviewJob", back_populates="pull_request", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="pull_request", cascade="all, delete-orphan")
