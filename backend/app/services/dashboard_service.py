from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.review import Review, ReviewJob
from app.models.finding import ReviewFinding
from app.models.organization import OrganizationMember


class DashboardService:
    @staticmethod
    def get_overview(db: Session, user_id: str) -> Dict[str, Any]:
        # Identify user's organizations
        user_memberships = db.query(OrganizationMember).filter(OrganizationMember.user_id == user_id).all()
        org_ids = [m.organization_id for m in user_memberships]

        repos_query = db.query(Repository)
        if org_ids:
            repos_query = repos_query.filter(Repository.organization_id.in_(org_ids))
        connected_repos_count = repos_query.count()

        # Total PRs reviewed
        total_pr_reviewed = db.query(Review).count()

        # Open review jobs (PENDING, QUEUED, PROCESSING)
        open_jobs_count = db.query(ReviewJob).filter(
            ReviewJob.status.in_(["PENDING", "QUEUED", "PROCESSING"])
        ).count()

        # Findings by severity
        severity_counts = {
            "critical": db.query(ReviewFinding).filter(ReviewFinding.severity == "critical").count(),
            "high": db.query(ReviewFinding).filter(ReviewFinding.severity == "high").count(),
            "medium": db.query(ReviewFinding).filter(ReviewFinding.severity == "medium").count(),
            "low": db.query(ReviewFinding).filter(ReviewFinding.severity == "low").count(),
        }

        # Findings by category
        categories = db.query(ReviewFinding.category, func.count(ReviewFinding.id)).group_by(ReviewFinding.category).all()
        category_counts = {cat: count for cat, count in categories}

        # Review status distribution
        verdicts = db.query(Review.verdict, func.count(Review.id)).group_by(Review.verdict).all()
        status_distribution = {v: count for v, count in verdicts}

        # Recent security findings
        recent_security = db.query(ReviewFinding).filter(
            ReviewFinding.category.in_(["security", "secret_leak", "dependency_vulnerability"])
        ).order_by(ReviewFinding.created_at.desc()).limit(5).all()

        # Recent activities
        recent_prs = db.query(PullRequest).order_by(PullRequest.updated_at.desc()).limit(5).all()
        activities = []
        for pr in recent_prs:
            activities.append({
                "id": pr.id,
                "type": "pull_request",
                "title": pr.title,
                "repo": pr.repository.name if pr.repository else "unknown",
                "pr_number": pr.pr_number,
                "author": pr.author_username,
                "state": pr.state,
                "timestamp": pr.updated_at.isoformat()
            })

        return {
            "connected_repositories_count": connected_repos_count,
            "total_pull_requests_reviewed": total_pr_reviewed,
            "open_review_jobs_count": open_jobs_count,
            "findings_by_severity": severity_counts,
            "findings_by_category": category_counts,
            "review_status_distribution": status_distribution,
            "recent_activity": activities,
            "recent_security_findings": recent_security
        }

    @staticmethod
    def get_recent_reviews(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        reviews = db.query(Review).order_by(Review.created_at.desc()).limit(limit).all()
        results = []
        for r in reviews:
            pr = r.pull_request
            results.append({
                "id": r.id,
                "pull_request_id": pr.id if pr else "",
                "pr_number": pr.pr_number if pr else 0,
                "pr_title": pr.title if pr else "Review",
                "repository_name": pr.repository.name if (pr and pr.repository) else "repo",
                "author": pr.author_username if pr else "dev",
                "verdict": r.verdict,
                "total_findings": r.total_findings,
                "critical_count": r.critical_count,
                "high_count": r.high_count,
                "created_at": r.created_at,
                "github_published": r.github_published
            })
        return results
