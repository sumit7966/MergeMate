from typing import List, Dict, Any, Optional
import httpx
from app.integrations.github.app_auth import GitHubAppAuth
from app.core.logging import logger


class GitHubClient:
    """
    Communicates with GitHub REST API on behalf of an installation or demo mode.
    """

    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    @classmethod
    async def for_installation(cls, installation_id: int) -> "GitHubClient":
        token = await GitHubAppAuth.get_installation_access_token(installation_id)
        return cls(token=token)

    async def get_pull_request(self, owner: str, repo: str, pull_number: int) -> Optional[Dict[str, Any]]:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=self.headers)
                if res.status_code == 200:
                    return res.json()
                logger.error(f"Failed to fetch PR #{pull_number}: {res.status_code}")
                return None
        except Exception as e:
            logger.error(f"Exception fetching PR: {e}")
            return None

    async def get_pull_request_files(self, owner: str, repo: str, pull_number: int) -> List[Dict[str, Any]]:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/files"
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.get(url, headers=self.headers)
                if res.status_code == 200:
                    return res.json()
                logger.error(f"Failed to fetch PR files: {res.status_code}")
                return []
        except Exception as e:
            logger.error(f"Exception fetching PR files: {e}")
            return []

    async def post_review(
        self,
        owner: str,
        repo: str,
        pull_number: int,
        commit_sha: str,
        body: str,
        event: str = "COMMENT",
        comments: Optional[List[Dict[str, Any]]] = None
    ) -> Optional[Dict[str, Any]]:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/reviews"
        payload = {
            "commit_id": commit_sha,
            "body": body,
            "event": event,
            "comments": comments or []
        }
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, headers=self.headers, json=payload)
                if res.status_code in [200, 201]:
                    return res.json()
                logger.error(f"Failed to publish GitHub review: {res.status_code} {res.text}")
                return None
        except Exception as e:
            logger.error(f"Exception posting GitHub review: {e}")
            return None

