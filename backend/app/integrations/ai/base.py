from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.finding import FindingCreate


class LLMProvider(ABC):
    @abstractmethod
    async def review_diff(
        self,
        repo_name: str,
        pr_title: str,
        files_diff: List[Dict[str, Any]],
        custom_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes AI code review on the changed files and diffs.
        Returns a dictionary with:
        - summary: str
        - explanation: str
        - verdict: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES'
        - findings: List[FindingCreate]
        - confidence_score: float
        """
        pass
