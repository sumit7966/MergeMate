import pytest
from app.services.demo_data_service import DemoDataService
from app.api.v1.endpoints.dashboard import get_dashboard_overview, get_recent_reviews
from app.api.v1.endpoints.repositories import list_repositories, update_repository_settings
from app.api.v1.endpoints.findings import submit_finding_feedback
from app.api.v1.endpoints.demo import simulate_incoming_pr_review
from app.schemas.repository import RepositorySettingsUpdate
from app.schemas.finding import FindingFeedbackRequest
from app.models.finding import ReviewFinding
from app.models.organization import Organization, OrganizationMember


def test_dashboard_overview(db_session, test_user):
    DemoDataService.seed_demo_data(db_session)
    org = db_session.query(Organization).filter(Organization.slug == "mergemate-engineering").first()
    # Add test_user to org to verify multi-tenant isolation
    membership = OrganizationMember(organization_id=org.id, user_id=test_user.id, role="admin")
    db_session.add(membership)
    db_session.commit()

    overview = get_dashboard_overview(db=db_session, user=test_user)
    assert overview["connected_repositories_count"] >= 1
    assert "critical" in overview["findings_by_severity"]
    assert len(overview["recent_activity"]) >= 1


def test_repositories_and_settings_update(db_session, test_user):
    DemoDataService.seed_demo_data(db_session)
    repos = list_repositories(db=db_session, user=test_user)
    assert len(repos) >= 1
    repo_id = repos[0].id

    # Update settings
    updated_settings = update_repository_settings(
        id=repo_id,
        settings_in=RepositorySettingsUpdate(auto_review_enabled=False, severity_threshold="high"),
        db=db_session,
        user=test_user
    )
    assert updated_settings.auto_review_enabled is False
    assert updated_settings.severity_threshold == "high"


@pytest.mark.asyncio
async def test_simulate_webhook_full_pipeline(db_session):
    DemoDataService.seed_demo_data(db_session)
    # Simulates complete end-to-end review pipeline
    review = await simulate_incoming_pr_review(db=db_session)
    assert review.verdict in ["COMMENT", "REQUEST_CHANGES"]
    assert review.total_findings > 0
    assert review.analysis_duration_seconds >= 0


def test_finding_feedback_submission(db_session, test_user):
    DemoDataService.seed_demo_data(db_session)
    finding = db_session.query(ReviewFinding).first()
    assert finding is not None

    fb = submit_finding_feedback(
        id=finding.id,
        feedback_in=FindingFeedbackRequest(action="useful", comment="Caught SQL injection before deploy!"),
        db=db_session,
        user=test_user
    )
    assert fb.action == "useful"
    assert fb.finding_id == finding.id
