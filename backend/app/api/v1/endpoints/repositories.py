from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.repository import RepositoryResponse, RepositorySettingsUpdate, RepositorySettingsResponse
from app.schemas.pull_request import PullRequestResponse
from app.models.repository import Repository, RepositorySettings
from app.models.pull_request import PullRequest
from app.models.review import Review
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[RepositoryResponse])
def list_repositories(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    repos = db.query(Repository).offset(skip).limit(limit).all()
    return repos


@router.get("/{id}", response_model=RepositoryResponse)
def get_repository(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    repo = db.query(Repository).filter(Repository.id == id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    return repo


@router.patch("/{id}/settings", response_model=RepositorySettingsResponse)
def update_repository_settings(
    id: str,
    settings_in: RepositorySettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    repo = db.query(Repository).filter(Repository.id == id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
    
    settings = repo.settings
    if not settings:
        settings = RepositorySettings(repository_id=repo.id)
        db.add(settings)
        db.flush()

    for field, val in settings_in.model_dump(exclude_unset=True).items():
        setattr(settings, field, val)

    db.commit()
    db.refresh(settings)
    return settings


@router.get("/{id}/pull-requests", response_model=List[PullRequestResponse])
def get_repository_pull_requests(
    id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    prs = db.query(PullRequest).filter(PullRequest.repository_id == id).offset(skip).limit(limit).all()
    results = []
    for pr in prs:
        latest_review = db.query(Review).filter(Review.pull_request_id == pr.id).order_by(Review.created_at.desc()).first()
        res = PullRequestResponse.model_validate(pr)
        if latest_review:
            res.latest_review_verdict = latest_review.verdict
            res.latest_review_status = "COMPLETED"
            res.findings_count = latest_review.total_findings
        results.append(res)
    return results
