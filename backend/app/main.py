from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.database.session import SessionLocal, engine
from app.models import Base
from app.services.demo_data_service import DemoDataService
from app.middleware.correlation_id import CorrelationIdMiddleware

from app.api.v1.endpoints import (
    auth,
    github,
    webhooks,
    repositories,
    pull_requests,
    reviews,
    findings,
    dashboard,
    organizations,
    settings as settings_endpoint,
    demo,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured logging
    setup_logging()
    logger.info("Initializing MergeMate platform...")

    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)

    # Seed demo data if database is fresh
    db = SessionLocal()
    try:
        from app.models.repository import Repository
        if db.query(Repository).count() == 0:
            logger.info("Fresh database detected. Seeding sample repositories and PR reviews...")
            DemoDataService.seed_demo_data(db)
    except Exception as e:
        logger.error(f"Error during startup data verification: {e}")
    finally:
        db.close()

    yield
    logger.info("Shutting down MergeMate backend gracefully...")


app = FastAPI(
    title="MergeMate — AI-Powered Pull Request Review Assistant",
    description="Industry-style developer platform automating initial code reviews, security scans, static analysis, and isolated tests.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Correlation ID Middleware
app.add_middleware(CorrelationIdMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred. Correlation ID logged.", "type": type(exc).__name__}
    )


# Health Check
@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MergeMate Backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE
    }


# Include V1 Routers
api_v1_str = settings.API_V1_STR
app.include_router(auth.router, prefix=f"{api_v1_str}/auth", tags=["Authentication"])
app.include_router(github.router, prefix=f"{api_v1_str}/github", tags=["GitHub App"])
app.include_router(webhooks.router, prefix=f"{api_v1_str}/webhooks", tags=["Webhooks"])
app.include_router(repositories.router, prefix=f"{api_v1_str}/repositories", tags=["Repositories"])
app.include_router(pull_requests.router, prefix=f"{api_v1_str}/pull-requests", tags=["Pull Requests"])
app.include_router(reviews.router, prefix=f"{api_v1_str}/reviews", tags=["Reviews"])
app.include_router(findings.router, prefix=f"{api_v1_str}/findings", tags=["Findings"])
app.include_router(dashboard.router, prefix=f"{api_v1_str}/dashboard", tags=["Dashboard"])
app.include_router(organizations.router, prefix=f"{api_v1_str}/organizations", tags=["Organizations"])
app.include_router(settings_endpoint.router, prefix=f"{api_v1_str}/settings", tags=["Settings"])
app.include_router(demo.router, prefix=f"{api_v1_str}/demo", tags=["Demo & Simulation"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

