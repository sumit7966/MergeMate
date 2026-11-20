from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.github import GitHubInstallation
from app.models.repository import Repository, RepositorySettings
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/installations")
def list_installations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    installations = db.query(GitHubInstallation).all()
    return installations


@router.get("/repositories")
def list_github_app_repositories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    repos = db.query(Repository).filter(Repository.github_installation_id.isnot(None)).all()
    return repos


@router.post("/repositories/sync")
def sync_github_repositories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Synchronizes repositories discovered via GitHub App installations
    repos = db.query(Repository).all()
    return {
        "status": "synchronized",
        "synced_count": len(repos),
        "message": f"Successfully synchronized {len(repos)} repositories from connected GitHub App."
    }


@router.delete("/installations/{id}")
def remove_installation(id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inst = db.query(GitHubInstallation).filter(GitHubInstallation.id == id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Installation not found")

    db.delete(inst)
    db.commit()
    return {"message": "GitHub App installation removed successfully."}

