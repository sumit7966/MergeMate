import time
import jwt
from typing import Optional
import httpx
from app.core.config import settings
from app.core.logging import logger


class GitHubAppAuth:
    """
    Handles GitHub App RS256 JWT generation and exchange for short-lived installation access tokens.
    """

    @classmethod
    def generate_app_jwt(cls) -> Optional[str]:
        if not settings.GITHUB_APP_ID or not settings.GITHUB_APP_PRIVATE_KEY:
            return None

        now = int(time.time())
        payload = {
            "iat": now - 60,  # 1 min in past for clock drift
            "exp": now + (10 * 60),  # 10 minutes maximum
            "iss": settings.GITHUB_APP_ID
        }

        try:
            formatted_key = settings.GITHUB_APP_PRIVATE_KEY.replace("\\n", "\n")
            token = jwt.encode(payload, formatted_key, algorithm="RS256")
            return token
        except Exception as e:
            logger.error(f"Failed to generate GitHub App JWT: {e}")
            return None

    @classmethod
    async def get_installation_access_token(cls, installation_id: int) -> Optional[str]:
        app_jwt = cls.generate_app_jwt()
        if not app_jwt:
            return None

        headers = {
            "Authorization": f"Bearer {app_jwt}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }

        url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers)
                if res.status_code == 201:
                    data = res.json()
                    return data.get("token")
                logger.error(f"Failed to get installation token for {installation_id}: {res.status_code} {res.text}")
                return None
        except Exception as e:
            logger.error(f"Network error getting installation token: {e}")
            return None
