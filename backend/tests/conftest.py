import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.core.security import create_access_token, hash_password
from app.models.user import User
from app.models.organization import Organization, OrganizationMember

# In-memory SQLite with StaticPool so all sessions share the memory DB cleanly without locking
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user():
    session = TestingSessionLocal()
    user = session.query(User).filter(User.email == "test.reviewer@mergemate.io").first()
    if not user:
        user = User(
            email="test.reviewer@mergemate.io",
            hashed_password=hash_password("password123"),
            full_name="Test Reviewer"
        )
        session.add(user)
        session.flush()

        org = Organization(name="Test Org", slug=f"test-org-{user.id[:6]}")
        session.add(org)
        session.flush()

        member = OrganizationMember(organization_id=org.id, user_id=user.id, role="owner")
        session.add(member)
        session.commit()
        session.refresh(user)
    session.close()
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}
