import json
from fastapi import APIRouter, Request, Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import verify_github_signature
from app.models.webhook_event import WebhookEvent
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.review import ReviewJob
from app.tasks.review_tasks import process_review_job
from app.core.logging import logger

router = APIRouter()


@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
    x_github_delivery: str = Header(None),
    db: Session = Depends(get_db)
):
    body_bytes = await request.body()

    # 1. Signature verification
    if not verify_github_signature(body_bytes, x_hub_signature_256):
        logger.warning("Invalid webhook signature rejected")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    # 2. Idempotency check via delivery ID
    delivery_id = x_github_delivery or "simulated-delivery"
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.delivery_id == delivery_id).first()
    if existing_event:
        logger.info(f"Duplicate webhook delivery {delivery_id} ignored")
        return {"status": "ignored", "reason": "duplicate_delivery"}

    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    action = payload.get("action")
    repo_data = payload.get("repository", {})
    repo_full_name = repo_data.get("full_name")

    # Store webhook event
    event = WebhookEvent(
        delivery_id=delivery_id,
        event_type=x_github_event or "unknown",
        action=action,
        repository_full_name=repo_full_name,
        payload=payload,
        processed=False
    )
    db.add(event)
    db.commit()

    # Handle pull_request events
    if x_github_event == "pull_request" and action in ["opened", "synchronize", "reopened"]:
        pr_data = payload.get("pull_request", {})
        repo = db.query(Repository).filter(Repository.full_name == repo_full_name).first()
        
        if repo and repo.is_active:
            # Check or create PullRequest
            pr_number = pr_data.get("number")
            head_sha = pr_data.get("head", {}).get("sha", "")
            base_sha = pr_data.get("base", {}).get("sha", "")

            pr = db.query(PullRequest).filter(
                PullRequest.repository_id == repo.id,
                PullRequest.pr_number == pr_number
            ).first()

            if not pr:
                pr = PullRequest(
                    repository_id=repo.id,
                    github_pr_id=pr_data.get("id", 0),
                    pr_number=pr_number,
                    title=pr_data.get("title", ""),
                    state=pr_data.get("state", "open"),
                    author_username=pr_data.get("user", {}).get("login", "unknown"),
                    author_avatar_url=pr_data.get("user", {}).get("avatar_url"),
                    source_branch=pr_data.get("head", {}).get("ref", ""),
                    target_branch=pr_data.get("base", {}).get("ref", ""),
                    head_sha=head_sha,
                    base_sha=base_sha,
                    additions=pr_data.get("additions", 0),
                    deletions=pr_data.get("deletions", 0),
                    changed_files_count=pr_data.get("changed_files", 0)
                )
                db.add(pr)
                db.commit()
                db.refresh(pr)
            else:
                pr.head_sha = head_sha
                pr.title = pr_data.get("title", pr.title)
                pr.state = pr_data.get("state", pr.state)
                db.commit()

            # Create Review Job
            job = ReviewJob(
                pull_request_id=pr.id,
                commit_sha=head_sha,
                trigger_type="webhook",
                status="QUEUED"
            )
            db.add(job)
            db.commit()
            db.refresh(job)

            # Trigger background task asynchronously
            process_review_job.delay(job.id)

            event.processed = True
            db.commit()

            return {
                "status": "queued",
                "review_job_id": job.id,
                "pull_request_id": pr.id
            }

    event.processed = True
    db.commit()
    return {"status": "received", "event": x_github_event, "action": action}
