from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class OrganizationBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=100)
    avatar_url: Optional[str] = None


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)


class OrganizationResponse(OrganizationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberAddRequest(BaseModel):
    email: str
    role: str = "developer"  # owner, admin, developer, viewer


class MemberUpdateRequest(BaseModel):
    role: str


class OrganizationMemberResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: str
    user: UserResponse
    created_at: datetime

    class Config:
        from_attributes = True
