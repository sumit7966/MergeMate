import asyncio
from app.tasks.celery_app import celery_app
from app.database.session import SessionLocal
from app.services.review_pipeline_service import ReviewPipelineService
from app.core.logging import logger


@celery_app.task(name="app.tasks.review_tasks.process_review_job", bind=True, max_retries=2)
def process_review_job(self, review_job_id: str):
    logger.info(f"Celery executing review task for job: {review_job_id}")
    db = SessionLocal()
    try:
        # Run async pipeline in event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        review = loop.run_until_complete(
            ReviewPipelineService.execute_review(db=db, review_job_id=review_job_id)
        )
        loop.close()
        return {"status": "SUCCESS", "review_id": review.id}
    except Exception as exc:
        logger.error(f"Task failure on review job {review_job_id}: {exc}")
        db.rollback()
        raise self.retry(exc=exc, countdown=10)
    finally:
        db.close()

