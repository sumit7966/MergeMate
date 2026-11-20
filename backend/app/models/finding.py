from typing import Optional, List
from sqlalchemy import String, Integer, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin, generate_uuid


class ReviewFinding(Base, TimestampMixin):
    __tablename__ = "review_findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    review_id: Mapped[str] = mapped_column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # Categories: bug, security, performance, maintainability, error_handling, input_validation, edge_cases, concurrency, code_quality, secret_leak, dependency_vulnerability
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # Severity: critical, high, medium, low, info
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    line_start: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    line_end: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    code_evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    why_it_matters: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_fix: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Engine & Rule
    source_engine: Mapped[str] = mapped_column(String(50), nullable=False)  # ai, ruff, bandit, semgrep, gitleaks, osv
    rule_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    extra_metadata: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    # Relationships
    review: Mapped["Review"] = relationship("Review", back_populates="findings")
    feedbacks: Mapped[List["UserFeedback"]] = relationship("UserFeedback", back_populates="finding", cascade="all, delete-orphan")


class UserFeedback(Base, TimestampMixin):
    __tablename__ = "user_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    finding_id: Mapped[str] = mapped_column(String(36), ForeignKey("review_findings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # action: useful, incorrect, ignored
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    finding: Mapped["ReviewFinding"] = relationship("ReviewFinding", back_populates="feedbacks")
    user: Mapped["User"] = relationship("User", back_populates="feedbacks")

