import pytest
from app.core.security import verify_password, hash_password
from app.schemas.auth import RegisterRequest, LoginRequest
from app.api.v1.endpoints.auth import register, login, get_me
from app.models.user import User


def test_password_hashing():
    raw = "super_secure_pass123"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong_pass", hashed) is False


def test_user_registration_and_login(db_session):
    reg_req = RegisterRequest(
        email="developer.jane@example.com",
        password="strongPassword123",
        full_name="Jane Developer",
        organization_name="Jane Corp"
    )
    reg_res = register(reg_req, db_session)
    assert "access_token" in reg_res
    assert "refresh_token" in reg_res
    assert reg_res["token_type"] == "bearer"

    # Login
    login_req = LoginRequest(
        email="developer.jane@example.com",
        password="strongPassword123"
    )
    login_res = login(login_req, db_session)
    assert "access_token" in login_res
    assert login_res["user"].email == "developer.jane@example.com"


def test_duplicate_registration_rejected(db_session):
    from fastapi import HTTPException
    reg_req = RegisterRequest(
        email="duplicate@example.com",
        password="strongPassword123",
        full_name="Duplicate User"
    )
    register(reg_req, db_session)
    with pytest.raises(HTTPException) as exc_info:
        register(reg_req, db_session)
    assert exc_info.value.status_code == 400
    assert "already exists" in str(exc_info.value.detail)


def test_get_me_profile(db_session, test_user):
    profile = get_me(user=test_user, db=db_session)
    assert profile.email == "test.reviewer@mergemate.io"
    assert profile.full_name == "Test Reviewer"
    assert profile.is_active is True
