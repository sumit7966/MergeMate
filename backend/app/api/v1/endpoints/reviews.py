from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.review import ReviewResponse, TestResultResponse
from app.schemas.finding import FindingResponse
from app.models.review import Review
from app.models.finding import ReviewFinding
from app.models.test_result import TestResult
from app.integrations.github.publisher import GitHubReviewPublisher
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[ReviewResponse])
def list_reviews(
    pull_request_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Review)
    if pull_request_id:
        query = query.filter(Review.pull_request_id == pull_request_id)
    return query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{id}", response_model=ReviewResponse)
def get_review(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.id == id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review


@router.get("/{id}/findings", response_model=List[FindingResponse])
def get_review_findings(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    findings = db.query(ReviewFinding).filter(ReviewFinding.review_id == id).order_by(ReviewFinding.severity).all()
    return findings


@router.get("/{id}/tests", response_model=List[TestResultResponse])
def get_review_tests(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tests = db.query(TestResult).filter(TestResult.review_id == id).all()
    return tests


@router.post("/{id}/publish")
async def publish_review_to_github(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    review = db.query(Review).filter(Review.id == id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    
    findings = db.query(ReviewFinding).filter(ReviewFinding.review_id == id).all()
    pr = review.pull_request
    repo = pr.repository
    installation_id = repo.installation.installation_id if (repo and repo.installation) else None

    success = await GitHubReviewPublisher.publish_to_github(
        pull_request=pr,
        review=review,
        findings=findings,
        installation_id=installation_id
    )
    db.commit()
    db.refresh(review)
    return {
        "success": success,
        "github_published": review.github_published,
        "github_review_id": review.github_review_id,
        "github_published_at": review.github_published_at
    }
