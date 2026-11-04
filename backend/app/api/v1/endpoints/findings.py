from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.finding import FindingResponse, FindingFeedbackRequest, UserFeedbackResponse
from app.models.finding import ReviewFinding, UserFeedback
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/{id}", response_model=FindingResponse)
def get_finding(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    finding = db.query(ReviewFinding).filter(ReviewFinding.id == id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    return finding


@router.post("/{id}/feedback", response_model=UserFeedbackResponse)
def submit_finding_feedback(
    id: str,
    feedback_in: FindingFeedbackRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    finding = db.query(ReviewFinding).filter(ReviewFinding.id == id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")

    if feedback_in.action not in ["useful", "incorrect", "ignored"]:
        raise HTTPException(status_code=400, detail="Action must be 'useful', 'incorrect', or 'ignored'")

    # Check existing feedback by user for this finding
    fb = db.query(UserFeedback).filter(
        UserFeedback.finding_id == id,
        UserFeedback.user_id == user.id
    ).first()

    if not fb:
        fb = UserFeedback(
            finding_id=id,
            user_id=user.id,
            action=feedback_in.action,
            comment=feedback_in.comment
        )
        db.add(fb)
    else:
        fb.action = feedback_in.action
        fb.comment = feedback_in.comment

    db.commit()
    db.refresh(fb)
    return fb
