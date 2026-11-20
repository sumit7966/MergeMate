from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.models.github import GitHubInstallation
from app.models.repository import Repository, RepositorySettings
from app.models.pull_request import PullRequest
from app.models.review import ReviewJob, Review, ReviewComment
from app.models.finding import ReviewFinding
from app.models.test_result import TestResult
from app.core.security import hash_password
from app.core.logging import logger


class DemoDataService:
    @staticmethod
    def seed_demo_data(db: Session):
        # 1. Demo User
        user = db.query(User).filter(User.email == "alex.dev@mergemate.io").first()
        if not user:
            user = User(
                email="alex.dev@mergemate.io",
                hashed_password=hash_password("password123"),
                full_name="Alex Rivera",
                github_username="alexrivera-dev"
            )
            db.add(user)
            db.flush()

        # 2. Demo Organization
        org = db.query(Organization).filter(Organization.slug == "mergemate-engineering").first()
        if not org:
            org = Organization(
                name="MergeMate Engineering",
                slug="mergemate-engineering"
            )
            db.add(org)
            db.flush()

            member = OrganizationMember(
                organization_id=org.id,
                user_id=user.id,
                role="owner"
            )
            db.add(member)

        # 3. GitHub Installation
        installation = db.query(GitHubInstallation).filter(GitHubInstallation.installation_id == 543210).first()
        if not installation:
            installation = GitHubInstallation(
                organization_id=org.id,
                installation_id=543210,
                account_login="mergemate-engineering",
                account_type="Organization",
                permissions={"pull_requests": "write", "contents": "read", "checks": "write"}
            )
            db.add(installation)
            db.flush()

        # 4. Repositories
        repo1 = db.query(Repository).filter(Repository.full_name == "mergemate-engineering/payment-service").first()
        if not repo1:
            repo1 = Repository(
                organization_id=org.id,
                github_installation_id=installation.id,
                github_repo_id=987101,
                name="payment-service",
                full_name="mergemate-engineering/payment-service",
                description="High-throughput payment processing engine with Stripe and Adyen webhooks",
                is_private=True,
                default_branch="main",
                language="Python"
            )
            db.add(repo1)
            db.flush()

            repo1_settings = RepositorySettings(
                repository_id=repo1.id,
                auto_review_enabled=True,
                ai_review_enabled=True,
                static_analysis_enabled=True,
                security_scanning_enabled=True,
                test_execution_enabled=True,
                github_publishing_enabled=True,
                severity_threshold="low",
                ai_model="gpt-4o-mini"
            )
            db.add(repo1_settings)

        repo2 = db.query(Repository).filter(Repository.full_name == "mergemate-engineering/auth-gateway").first()
        if not repo2:
            repo2 = Repository(
                organization_id=org.id,
                github_installation_id=installation.id,
                github_repo_id=987102,
                name="auth-gateway",
                full_name="mergemate-engineering/auth-gateway",
                description="Zero-trust identity broker and OAuth2 federated token service",
                is_private=True,
                default_branch="main",
                language="Python"
            )
            db.add(repo2)
            db.flush()

            repo2_settings = RepositorySettings(
                repository_id=repo2.id,
                auto_review_enabled=True,
                ai_review_enabled=True,
                static_analysis_enabled=True,
                security_scanning_enabled=True,
                test_execution_enabled=False
            )
            db.add(repo2_settings)

        # 5. Pull Request with realistic diff
        pr = db.query(PullRequest).filter(PullRequest.repository_id == repo1.id, PullRequest.pr_number == 42).first()
        if not pr:
            sample_diff = (
                "diff --git a/services/payment_processor.py b/services/payment_processor.py\n"
                "index 83a1c2..91b4d0 100644\n"
                "--- a/services/payment_processor.py\n"
                "+++ b/services/payment_processor.py\n"
                "@@ -15,6 +15,28 @@\n"
                " import httpx\n"
                " import logging\n"
                "+from db.session import get_db_cursor\n"
                "+\n"
                "+def refund_transaction(transaction_id: str, amount_cents: int):\n"
                "+    # Insecure query interpolation without parameter binding\n"
                "+    cursor = get_db_cursor()\n"
                "+    query = f\"SELECT * FROM transactions WHERE id = '{transaction_id}'\"\n"
                "+    cursor.execute(query)\n"
                "+    record = cursor.fetchone()\n"
                "+\n"
                "+    try:\n"
                "+        # Missing timeout on external banking API\n"
                "+        response = httpx.post('https://api.banking-partner.internal/v1/refund', json={'tx': transaction_id, 'amount': amount_cents})\n"
                "+    except:\n"
                "+        logging.error('Refund webhook failed')\n"
                "+        return False\n"
                "+\n"
                "+    return response.status_code == 200\n"
            )

            files_meta = [
                {
                    "filename": "services/payment_processor.py",
                    "status": "modified",
                    "additions": 18,
                    "deletions": 0,
                    "changes": 18,
                    "patch": sample_diff
                }
            ]

            pr = PullRequest(
                repository_id=repo1.id,
                github_pr_id=102030,
                pr_number=42,
                title="feat: Add customer refund endpoint and banking partner hook",
                state="open",
                author_username="alexrivera-dev",
                author_avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
                source_branch="feature/refund-flow",
                target_branch="main",
                head_sha="9f8d7b6a5c4e3b2a1f0e9d8c7b6a5c4e3b2a1f0e",
                base_sha="1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
                additions=18,
                deletions=0,
                changed_files_count=1,
                meta_info={"files": files_meta}
            )
            db.add(pr)
            db.flush()

            # Review Job
            job = ReviewJob(
                pull_request_id=pr.id,
                commit_sha=pr.head_sha,
                trigger_type="webhook",
                status="COMPLETED",
                started_at=datetime.now(timezone.utc) - timedelta(minutes=5),
                completed_at=datetime.now(timezone.utc) - timedelta(minutes=4)
            )
            db.add(job)
            db.flush()

            # Review
            review = Review(
                pull_request_id=pr.id,
                review_job_id=job.id,
                commit_sha=pr.head_sha,
                verdict="REQUEST_CHANGES",
                summary="MergeMate identified 1 critical SQL injection vulnerability, 1 high-risk bare exception handler, and an unbound external HTTP call in services/payment_processor.py.",
                explanation="The introduced refund handler contains raw string interpolation in database operations that can be leveraged to dump or delete records. Furthermore, omitting HTTP timeouts exposes worker threads to starvation.",
                total_findings=3,
                critical_count=1,
                high_count=1,
                medium_count=1,
                low_count=0,
                confidence_score=0.96,
                analysis_duration_seconds=1.42,
                tools_executed=["ai_review_engine", "ruff", "bandit", "isolated_test_runner"],
                github_published=True,
                github_review_id=884910,
                github_published_at=datetime.now(timezone.utc) - timedelta(minutes=4)
            )
            db.add(review)
            db.flush()

            # Findings
            f1 = ReviewFinding(
                review_id=review.id,
                title="Critical SQL Injection via String Interpolation in Query",
                description="Database query constructed using Python f-string with untrusted 'transaction_id' parameter. Allows malicious attackers to bypass authentication or execute arbitrary SQL statements.",
                category="security",
                severity="critical",
                confidence=0.98,
                file_path="services/payment_processor.py",
                line_start=21,
                line_end=22,
                code_evidence="query = f\"SELECT * FROM transactions WHERE id = '{transaction_id}'\"",
                why_it_matters="Direct string formatting in SQL bypasses database sanitization and exposes all financial ledger records to exfiltration or tampering.",
                suggested_fix="cursor.execute(\"SELECT * FROM transactions WHERE id = %s\", (transaction_id,))",
                source_engine="ai",
                rule_id="MM-SEC-SQLI-01"
            )
            db.add(f1)

            f2 = ReviewFinding(
                review_id=review.id,
                title="Dangerous Bare Exception Handler Masks Critical Failures",
                description="Using 'except:' without specifying an exception class catches SystemExit and KeyboardInterrupt, concealing fatal service anomalies.",
                category="error_handling",
                severity="high",
                confidence=0.94,
                file_path="services/payment_processor.py",
                line_start=28,
                line_end=30,
                code_evidence="except:\n    logging.error('Refund webhook failed')",
                why_it_matters="Hides underlying syntax or memory exceptions and complicates production diagnostics.",
                suggested_fix="except httpx.HTTPError as err:\n    logger.error(f'External banking API failure: {err}')",
                source_engine="ruff",
                rule_id="B001"
            )
            db.add(f2)

            f3 = ReviewFinding(
                review_id=review.id,
                title="HTTP Client Call Lacks Explicit Timeout",
                description="httpx.post called without an explicit timeout argument. Network latency or partner outages can cause requests to block indefinitely.",
                category="performance",
                severity="medium",
                confidence=0.90,
                file_path="services/payment_processor.py",
                line_start=27,
                line_end=27,
                code_evidence="response = httpx.post('https://api.banking-partner.internal/v1/refund', ...)",
                why_it_matters="Unbounded I/O calls deplete the connection pool and freeze asynchronous worker threads.",
                suggested_fix="httpx.post('https://api.banking-partner.internal/v1/refund', json=..., timeout=10.0)",
                source_engine="bandit",
                rule_id="B113"
            )
            db.add(f3)

            # Test results
            test_res = TestResult(
                review_id=review.id,
                total_tests=14,
                passed_tests=13,
                failed_tests=1,
                skipped_tests=0,
                duration_seconds=1.12,
                passed=False,
                container_id="mm-container-isolated-9f8d7b6a",
                raw_output=(
                    "============================= test session starts =============================\n"
                    "rootdir: /app/workspace\n"
                    "tests/test_payments.py ..........F...                                   [100%]\n"
                    "================================== FAILURES ===================================\n"
                    "FAILED tests/test_payments.py::test_refund_sql_injection - AssertionError: Injection vector was not escaped\n"
                    "=========================== 1 failed, 13 passed in 1.12s =========================="
                ),
                error_summary="1 test failed in tests/test_payments.py::test_refund_sql_injection"
            )
            db.add(test_res)

        db.commit()
        logger.info("Demo data seed completed successfully.")

