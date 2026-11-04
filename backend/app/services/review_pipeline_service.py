import time
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.pull_request import PullRequest
from app.models.review import ReviewJob, Review, ReviewComment
from app.models.finding import ReviewFinding
from app.models.test_result import TestResult
from app.schemas.finding import FindingCreate

from app.engines.diff_parser import DiffParser
from app.engines.static_analysis.ruff_adapter import RuffAdapter
from app.engines.static_analysis.bandit_adapter import BanditAdapter
from app.engines.security.gitleaks_adapter import GitleaksAdapter
from app.engines.security.osv_adapter import OSVAdapter
from app.engines.test_runner.isolated_executor import IsolatedTestExecutor
from app.integrations.ai.openai_provider import OpenAIProvider
from app.integrations.github.publisher import GitHubReviewPublisher
from app.core.logging import logger


class ReviewPipelineService:
    """
    Complete end-to-end multi-engine review orchestrator.
    Executes static analysis, secret scans, vulnerability audits, AI analysis,
    isolated container tests, result deduplication, and GitHub publication.
    """

    @classmethod
    async def execute_review(
        cls,
        db: Session,
        review_job_id: str,
        files_diff: Optional[List[Dict[str, Any]]] = None
    ) -> Review:
        start_time = time.time()
        
        job = db.query(ReviewJob).filter(ReviewJob.id == review_job_id).first()
        if not job:
            raise ValueError(f"ReviewJob {review_job_id} not found")

        job.status = "PROCESSING"
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        pr: PullRequest = job.pull_request
        repo = pr.repository
        settings = repo.settings

        tools_executed = []
        all_raw_findings: List[FindingCreate] = []

        try:
            print("PIPELINE: STEP 1 prepare files", flush=True)
            # 1. Prepare files and diffs
            if not files_diff:
                files_diff = pr.meta_info.get("files", []) if pr.meta_info else []

            print("PIPELINE: STEP 2 static analysis", flush=True)
            # 2. Static Analysis: Ruff
            if settings and settings.static_analysis_enabled:
                ruff_findings = RuffAdapter.scan_diff(files_diff)
                all_raw_findings.extend(ruff_findings)
                tools_executed.append("ruff")

                # Static Analysis: Bandit
                bandit_findings = BanditAdapter.scan_diff(files_diff)
                all_raw_findings.extend(bandit_findings)
                tools_executed.append("bandit")

            print("PIPELINE: STEP 3 security scanning", flush=True)
            # 3. Security Scanning: Gitleaks & OSV
            if settings and settings.security_scanning_enabled:
                gitleaks_findings = GitleaksAdapter.scan_diff(files_diff)
                all_raw_findings.extend(gitleaks_findings)
                tools_executed.append("gitleaks")

                osv_findings = OSVAdapter.scan_diff(files_diff)
                all_raw_findings.extend(osv_findings)
                tools_executed.append("osv")

            print("PIPELINE: STEP 4 AI review", flush=True)
            # 4. AI Code Review Engine
            ai_summary = "AI analysis completed."
            ai_explanation = None
            ai_verdict = "COMMENT"
            ai_confidence = 0.90

            if settings and settings.ai_review_enabled:
                ai_provider = OpenAIProvider(model=settings.ai_model)
                ai_result = await ai_provider.review_diff(
                    repo_name=repo.full_name,
                    pr_title=pr.title,
                    files_diff=files_diff,
                    custom_instructions=settings.custom_instructions
                )
                ai_summary = ai_result.get("summary", ai_summary)
                ai_explanation = ai_result.get("explanation")
                ai_verdict = ai_result.get("verdict", "COMMENT")
                ai_confidence = ai_result.get("confidence_score", 0.90)
                all_raw_findings.extend(ai_result.get("findings", []))
                tools_executed.append("ai_review_engine")

            print("PIPELINE: STEP 5 deduplicate", flush=True)
            # 5. Deduplicate findings (by file_path + line_start + rule_id/title)
            deduped_findings: List[FindingCreate] = []
            seen_signatures = set()

            for f in all_raw_findings:
                sig = f"{f.file_path}:{f.line_start}:{f.title[:30]}"
                if sig not in seen_signatures:
                    seen_signatures.add(sig)
                    deduped_findings.append(f)

            print("PIPELINE: STEP 6 test runner", flush=True)
            # 6. Isolated Test Execution
            test_res = None
            if settings and settings.test_execution_enabled:
                test_output = IsolatedTestExecutor.run_tests(
                    repo_name=repo.full_name,
                    commit_sha=job.commit_sha
                )
                tools_executed.append("isolated_test_runner")
                test_res = test_output

            print("PIPELINE: STEP 7 db persist", flush=True)

            # 7. Compute severity totals
            critical_c = sum(1 for f in deduped_findings if f.severity == "critical")
            high_c = sum(1 for f in deduped_findings if f.severity == "high")
            medium_c = sum(1 for f in deduped_findings if f.severity == "medium")
            low_c = sum(1 for f in deduped_findings if f.severity in ["low", "info"])

            duration = round(time.time() - start_time, 2)

            # 8. Create Review record
            review = Review(
                pull_request_id=pr.id,
                review_job_id=job.id,
                commit_sha=job.commit_sha,
                verdict=ai_verdict,
                summary=ai_summary,
                explanation=ai_explanation,
                total_findings=len(deduped_findings),
                critical_count=critical_c,
                high_count=high_c,
                medium_count=medium_c,
                low_count=low_c,
                confidence_score=ai_confidence,
                analysis_duration_seconds=duration,
                tools_executed=tools_executed,
                github_published=False
            )
            db.add(review)
            db.flush()

            # 9. Persist Findings
            persisted_findings: List[ReviewFinding] = []
            for f in deduped_findings:
                rf = ReviewFinding(
                    review_id=review.id,
                    title=f.title,
                    description=f.description,
                    category=f.category,
                    severity=f.severity,
                    confidence=f.confidence,
                    file_path=f.file_path,
                    line_start=f.line_start,
                    line_end=f.line_end,
                    code_evidence=f.code_evidence,
                    why_it_matters=f.why_it_matters,
                    suggested_fix=f.suggested_fix,
                    source_engine=f.source_engine,
                    rule_id=f.rule_id,
                    extra_metadata=f.extra_metadata or {}
                )
                db.add(rf)
                persisted_findings.append(rf)

            # 10. Persist Test Results if executed
            if test_res:
                tr = TestResult(
                    review_id=review.id,
                    total_tests=test_res["total_tests"],
                    passed_tests=test_res["passed_tests"],
                    failed_tests=test_res["failed_tests"],
                    skipped_tests=test_res["skipped_tests"],
                    duration_seconds=test_res["duration_seconds"],
                    passed=test_res["passed"],
                    container_id=test_res["container_id"],
                    raw_output=test_res["raw_output"],
                    error_summary=test_res["error_summary"],
                    details=test_res["details"]
                )
                db.add(tr)

            print("PIPELINE: STEP 11 GitHub publishing", flush=True)
            # 11. GitHub Publishing
            installation_id = repo.installation.installation_id if repo.installation else None
            if settings and settings.github_publishing_enabled:
                await GitHubReviewPublisher.publish_to_github(
                    pull_request=pr,
                    review=review,
                    findings=persisted_findings,
                    installation_id=installation_id
                )

            print("PIPELINE: STEP 12 mark completed", flush=True)

            # 12. Mark job completed
            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(review)

            logger.info(f"Review pipeline successfully completed for PR #{pr.pr_number} with {len(persisted_findings)} findings.")
            return review

        except Exception as e:
            db.rollback()
            job.status = "FAILED"
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            logger.error(f"Review pipeline failed: {e}", exc_info=True)
            raise e
