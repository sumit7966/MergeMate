from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class FindingBase(BaseModel):
    title: str
    description: str
    category: str  # bug, security, performance, maintainability, error_handling, input_validation, edge_cases, concurrency, code_quality, secret_leak, dependency_vulnerability
    severity: str  # critical, high, medium, low, info
    confidence: float = Field(ge=0.0, le=1.0)
    file_path: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    code_evidence: Optional[str] = None
    why_it_matters: str
    suggested_fix: str
    source_engine: str  # ai, ruff, bandit, semgrep, gitleaks, osv
    rule_id: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class FindingCreate(FindingBase):
    pass


class FindingFeedbackRequest(BaseModel):
    action: str = Field(description="useful, incorrect, or ignored")
    comment: Optional[str] = None


class UserFeedbackResponse(BaseModel):
    id: str
    finding_id: str
    user_id: str
    action: str
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FindingResponse(FindingBase):
    id: str
    review_id: str
    created_at: datetime
    user_feedbacks: Optional[List[UserFeedbackResponse]] = []

    class Config:
        from_attributes = True
