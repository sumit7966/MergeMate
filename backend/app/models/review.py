from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, ForeignKey, JSON, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class ReviewJob(Base, TimestampMixin):
    __tablename__ = "review_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    pull_request_id: Mapped[str] = mapped_column(String(36), ForeignKey("pull_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    commit_sha: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    trigger_type: Mapped[str] = mapped_column(String(50), default="webhook")  # webhook, manual, rerun
    
    # Lifecycle: PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False, index=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    pull_request: Mapped["PullRequest"] = relationship("PullRequest", back_populates="review_jobs")
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="review_job", uselist=False, cascade="all, delete-orphan")


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    pull_request_id: Mapped[str] = mapped_column(String(36), ForeignKey("pull_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    review_job_id: Mapped[str] = mapped_column(String(36), ForeignKey("review_jobs.id", ondelete="CASCADE"), unique=True, nullable=False)
    commit_sha: Mapped[str] = mapped_column(String(40), nullable=False)
    
    # Review Outcome
    verdict: Mapped[str] = mapped_column(String(30), default="COMMENT", nullable=False)  # COMMENT, APPROVE, REQUEST_CHANGES
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Counts
    total_findings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    critical_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    high_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medium_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Metrics
    confidence_score: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    analysis_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tools_executed: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    
    # GitHub Publication Status
    github_published: Mapped[bool] = mapped_column(default=False, nullable=False)
    github_review_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    github_published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    pull_request: Mapped["PullRequest"] = relationship("PullRequest", back_populates="reviews")
    review_job: Mapped["ReviewJob"] = relationship("ReviewJob", back_populates="review")
    findings: Mapped[List["ReviewFinding"]] = relationship("ReviewFinding", back_populates="review", cascade="all, delete-orphan")
    comments: Mapped[List["ReviewComment"]] = relationship("ReviewComment", back_populates="review", cascade="all, delete-orphan")
    test_results: Mapped[List["TestResult"]] = relationship("TestResult", back_populates="review", cascade="all, delete-orphan")


class ReviewComment(Base, TimestampMixin):
    __tablename__ = "review_comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    line: Mapped[int] = mapped_column(Integer, nullable=False)
    side: Mapped[str] = mapped_column(String(10), default="RIGHT", nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    github_comment_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    review: Mapped["Review"] = relationship("Review", back_populates="comments")
