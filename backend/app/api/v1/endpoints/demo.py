import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.demo_data_service import DemoDataService
from app.models.repository import Repository
from app.models.pull_request import PullRequest
from app.models.review import ReviewJob
from app.services.review_pipeline_service import ReviewPipelineService
from app.schemas.review import ReviewResponse

router = APIRouter()


@router.post("/seed")
def seed_demo_environment(db: Session = Depends(get_db)):
    DemoDataService.seed_demo_data(db)
    return {"status": "success", "message": "Demo repositories, PRs, and reviews seeded successfully."}


@router.post("/simulate-webhook", response_model=ReviewResponse)
async def simulate_incoming_pr_review(db: Session = Depends(get_db)):
    """
    Simulates a live PR creation webhook event on GitHub:
    Creates a new PR containing real code with a security defect, executes the full pipeline,
    and returns the review report.
    """
    repo = db.query(Repository).first()
    if not repo:
        DemoDataService.seed_demo_data(db)
        repo = db.query(Repository).first()

    pr_num = int(datetime.now(timezone.utc).timestamp()) % 10000 + 100
    commit_sha = uuid.uuid4().hex

    bad_code_diff = (
        "diff --git a/app/routes/auth.py b/app/routes/auth.py\n"
        "index a1b2c3..d4e5f6 100644\n"
        "--- a/app/routes/auth.py\n"
        "+++ b/app/routes/auth.py\n"
        "@@ -10,6 +10,18 @@\n"
        " import os\n"
        " import jwt\n"
        "+from database import db\n"
        "+\n"
        "+def authenticate_user(username: str, token: str):\n"
        "+    # CRITICAL: Leaked test master token & SQL injection\n"
        "+    hardcoded_secret = 'ghp_secretTokenProd1234567890abcdefghijklmn'\n"
        "+    query = f\"SELECT * FROM users WHERE username = '{username}'\"\n"
        "+    res = db.execute(query)\n"
        "+    if token == hardcoded_secret:\n"
        "+        return True\n"
        "+    return res is not None\n"
    )

    files_meta = [
        {
            "filename": "app/routes/auth.py",
            "status": "modified",
            "additions": 12,
            "deletions": 0,
            "changes": 12,
            "patch": bad_code_diff
        }
    ]

    pr = PullRequest(
        repository_id=repo.id,
        github_pr_id=pr_num + 50000,
        pr_number=pr_num,
        title=f"feat: Update authentication validator [Simulated PR #{pr_num}]",
        state="open",
        author_username="contributor-demo",
        source_branch=f"feature/auth-patch-{pr_num}",
        target_branch="main",
        head_sha=commit_sha,
        base_sha="master_sha_000000000000000000000000000000",
        additions=12,
        deletions=0,
        changed_files_count=1,
        meta_info={"files": files_meta}
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)

    job = ReviewJob(
        pull_request_id=pr.id,
        commit_sha=commit_sha,
        trigger_type="webhook",
        status="PENDING"
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Execute full pipeline synchronously for simulation
    review = await ReviewPipelineService.execute_review(
        db=db,
        review_job_id=job.id,
        files_diff=files_meta
    )
    return review
