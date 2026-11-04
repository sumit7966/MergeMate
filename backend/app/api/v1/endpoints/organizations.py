from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.organization import OrganizationResponse, OrganizationMemberResponse, MemberAddRequest, MemberUpdateRequest
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/{id}/members", response_model=List[OrganizationMemberResponse])
def get_organization_members(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    members = db.query(OrganizationMember).filter(OrganizationMember.organization_id == id).all()
    return members


@router.post("/{id}/members", response_model=OrganizationMemberResponse)
def add_organization_member(
    id: str,
    req: MemberAddRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    org = db.query(Organization).filter(Organization.id == id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    target_user = db.query(User).filter(User.email == req.email.lower()).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this email not found")

    existing = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == id,
        OrganizationMember.user_id == target_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this organization")

    member = OrganizationMember(
        organization_id=id,
        user_id=target_user.id,
        role=req.role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.patch("/{id}/members/{member_id}", response_model=OrganizationMemberResponse)
def update_organization_member(
    id: str,
    member_id: str,
    req: MemberUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    member = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == id,
        OrganizationMember.id == member_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    member.role = req.role
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{id}/members/{member_id}")
def remove_organization_member(
    id: str,
    member_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    member = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == id,
        OrganizationMember.id == member_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}
