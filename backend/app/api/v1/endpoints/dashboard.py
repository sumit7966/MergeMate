from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.dashboard import DashboardOverviewResponse, RecentReviewItem
from app.services.dashboard_service import DashboardService
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return DashboardService.get_overview(db, user.id)


@router.get("/recent-reviews", response_model=List[RecentReviewItem])
def get_recent_reviews(limit: int = 10, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return DashboardService.get_recent_reviews(db, limit=limit)
