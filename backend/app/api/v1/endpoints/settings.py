from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
def get_user_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/profile", response_model=UserResponse)
def update_user_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    for field, val in user_in.model_dump(exclude_unset=True).items():
        setattr(user, field, val)

    db.commit()
    db.refresh(user)
    return user


@router.get("/notifications")
def get_notification_settings(user: User = Depends(get_current_user)):
    return {
        "email_notifications": True,
        "slack_alerts": False,
        "github_review_sync": True,
        "critical_vulnerability_alert": True
    }


@router.patch("/notifications")
def update_notification_settings(settings: dict, user: User = Depends(get_current_user)):
    return {"message": "Notification preferences updated", "settings": settings}

