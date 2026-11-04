from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.finding import FindingResponse


class TestResultResponse(BaseModel):
    id: str
    review_id: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    duration_seconds: float
    passed: bool
    container_id: Optional[str] = None
    raw_output: Optional[str] = None
    error_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCommentResponse(BaseModel):
    id: str
    review_id: str
    file_path: str
    line: int
    side: str
    body: str
    github_comment_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewJobResponse(BaseModel):
    id: str
    pull_request_id: str
    commit_sha: str
    trigger_type: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    id: str
    pull_request_id: str
    review_job_id: str
    commit_sha: str
    verdict: str
    summary: str
    explanation: Optional[str] = None
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    confidence_score: float
    analysis_duration_seconds: float
    tools_executed: Optional[List[str]] = []
    github_published: bool
    github_review_id: Optional[int] = None
    github_published_at: Optional[datetime] = None
    created_at: datetime
    findings: Optional[List[FindingResponse]] = []
    test_results: Optional[List[TestResultResponse]] = []

    class Config:
        from_attributes = True
