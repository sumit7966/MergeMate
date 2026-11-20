from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.review import ReviewResponse
from app.schemas.finding import FindingResponse


class DashboardOverviewResponse(BaseModel):
    connected_repositories_count: int
    total_pull_requests_reviewed: int
    open_review_jobs_count: int
    findings_by_severity: Dict[str, int]
    findings_by_category: Dict[str, int]
    review_status_distribution: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
    recent_security_findings: List[FindingResponse]


class RecentReviewItem(BaseModel):
    id: str
    pull_request_id: str
    pr_number: int
    pr_title: str
    repository_name: str
    author: str
    verdict: str
    total_findings: int
    critical_count: int
    high_count: int
    created_at: datetime
    github_published: bool


class DashboardRecentReviewsResponse(BaseModel):
    reviews: List[RecentReviewItem]
    total: int


class WebhookPayload(BaseModel):
    action: Optional[str] = None
    number: Optional[int] = None
    pull_request: Optional[Dict[str, Any]] = None
    repository: Optional[Dict[str, Any]] = None
    installation: Optional[Dict[str, Any]] = None
    sender: Optional[Dict[str, Any]] = None

