from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, Token, RefreshTokenRequest
from app.schemas.user import UserResponse, UserProfileResponse
from app.services.auth_service import AuthService, get_current_user
from app.models.user import User
from app.models.organization import OrganizationMember

router = APIRouter()


@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    res = AuthService.register(db, req)
    return res


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    res = AuthService.login(db, req)
    return res


@router.post("/refresh", response_model=Token)
def refresh(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    from app.core.security import decode_token, create_access_token, create_refresh_token
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer"
    }


@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserProfileResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    membership = db.query(OrganizationMember).filter(OrganizationMember.user_id == user.id).first()
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        github_username=user.github_username,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        updated_at=user.updated_at,
        current_organization_id=membership.organization_id if membership else None,
        current_role=membership.role if membership else None
    )
