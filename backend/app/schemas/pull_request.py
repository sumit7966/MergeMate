from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class ChangedFile(BaseModel):
    filename: str
    status: str  # modified, added, removed
    additions: int
    deletions: int
    changes: int
    patch: Optional[str] = None
    raw_url: Optional[str] = None


class PullRequestBase(BaseModel):
    pr_number: int
    title: str
    state: str
    author_username: str
    author_avatar_url: Optional[str] = None
    source_branch: str
    target_branch: str
    head_sha: str
    base_sha: str
    html_url: Optional[str] = None
    diff_url: Optional[str] = None
    additions: int = 0
    deletions: int = 0
    changed_files_count: int = 0


class PullRequestResponse(PullRequestBase):
    id: str
    repository_id: str
    created_at: datetime
    updated_at: datetime
    latest_review_status: Optional[str] = None
    latest_review_verdict: Optional[str] = None
    findings_count: Optional[int] = 0

    class Config:
        from_attributes = True


class PullRequestDetailResponse(PullRequestResponse):
    files: Optional[List[ChangedFile]] = []
