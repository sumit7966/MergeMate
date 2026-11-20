from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.pull_request import PullRequestResponse, PullRequestDetailResponse, ChangedFile
from app.models.pull_request import PullRequest
from app.models.review import Review, ReviewJob
from app.tasks.review_tasks import process_review_job
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[PullRequestResponse])
def list_pull_requests(
    state: Optional[str] = None,
    repository_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(PullRequest)
    if state and state != "all":
        query = query.filter(PullRequest.state == state)
    if repository_id:
        query = query.filter(PullRequest.repository_id == repository_id)
    if search:
        query = query.filter(PullRequest.title.ilike(f"%{search}%"))

    prs = query.order_by(PullRequest.updated_at.desc()).offset(skip).limit(limit).all()
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


@router.get("/{id}", response_model=PullRequestDetailResponse)
def get_pull_request(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pr = db.query(PullRequest).filter(PullRequest.id == id).first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pull request not found")

    latest_review = db.query(Review).filter(Review.pull_request_id == pr.id).order_by(Review.created_at.desc()).first()
    res = PullRequestDetailResponse.model_validate(pr)
    if latest_review:
        res.latest_review_verdict = latest_review.verdict
        res.latest_review_status = "COMPLETED"
        res.findings_count = latest_review.total_findings

    raw_files = pr.meta_info.get("files", []) if pr.meta_info else []
    res.files = [ChangedFile(**f) for f in raw_files]
    return res


@router.get("/{id}/files", response_model=List[ChangedFile])
def get_pull_request_files(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pr = db.query(PullRequest).filter(PullRequest.id == id).first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pull request not found")

    raw_files = pr.meta_info.get("files", []) if pr.meta_info else []
    return [ChangedFile(**f) for f in raw_files]


@router.post("/{id}/review")
def trigger_pull_request_review(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pr = db.query(PullRequest).filter(PullRequest.id == id).first()
    if not pr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pull request not found")

    job = ReviewJob(
        pull_request_id=pr.id,
        commit_sha=pr.head_sha,
        trigger_type="manual",
        status="QUEUED"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Trigger background pipeline
    process_review_job.delay(job.id)

    return {"message": "Review job queued", "job_id": job.id, "status": job.status}


@router.post("/{id}/review/rerun")
def rerun_pull_request_review(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return trigger_pull_request_review(id, db, user)

