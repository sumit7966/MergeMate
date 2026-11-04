import json
import re
from typing import Dict, Any, List, Set
from app.schemas.finding import FindingCreate
from app.core.logging import logger


class AIResponseParser:
    @staticmethod
    def clean_json_string(raw_text: str) -> str:
        """Strip markdown fences, leading/trailing whitespace"""
        text = raw_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()

    @classmethod
    def parse_and_validate(
        cls,
        raw_output: str,
        valid_lines_by_file: Dict[str, Set[int]]
    ) -> Dict[str, Any]:
        """
        Parses JSON, validates structured findings, and checks inline line validity.
        """
        cleaned = cls.clean_json_string(raw_output)
        try:
            data = json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse LLM JSON output: {e}\nRaw output: {raw_output[:500]}")
            return {
                "summary": "AI code review completed with formatting anomalies.",
                "explanation": "Unable to parse structured review output into schema.",
                "verdict": "COMMENT",
                "confidence_score": 0.5,
                "findings": []
            }

        summary = data.get("summary", "AI review completed.")
        explanation = data.get("explanation", "")
        verdict = data.get("verdict", "COMMENT")
        if verdict not in ["COMMENT", "APPROVE", "REQUEST_CHANGES"]:
            verdict = "COMMENT"
        
        confidence_score = float(data.get("confidence_score", 0.88))
        raw_findings = data.get("findings", [])

        validated_findings: List[FindingCreate] = []

        for item in raw_findings:
            try:
                file_path = str(item.get("file_path", "")).strip()
                line_start = item.get("line_start")
                if line_start is not None:
                    try:
                        line_start = int(line_start)
                    except (ValueError, TypeError):
                        line_start = None

                # Line validation check: if line is specified but not in the diff,
                # we retain the finding but set line_start to None so it appears in the review summary rather than failing GitHub inline comment
                if file_path in valid_lines_by_file and line_start is not None:
                    valid_lines = valid_lines_by_file[file_path]
                    if valid_lines and line_start not in valid_lines:
                        logger.info(f"Finding line {line_start} not in diff for {file_path}, moved to file-level summary")
                        # Keep nearest valid line or move to file-level
                        line_start = None

                finding = FindingCreate(
                    title=str(item.get("title", "Potential Issue")).strip(),
                    description=str(item.get("description", "")).strip(),
                    category=str(item.get("category", "bug")).lower(),
                    severity=str(item.get("severity", "medium")).lower(),
                    confidence=min(1.0, max(0.0, float(item.get("confidence", 0.8)))),
                    file_path=file_path,
                    line_start=line_start,
                    line_end=item.get("line_end"),
                    code_evidence=item.get("code_evidence"),
                    why_it_matters=str(item.get("why_it_matters", "May cause software defects.")).strip(),
                    suggested_fix=str(item.get("suggested_fix", "Review and revise implementation.")).strip(),
                    source_engine=str(item.get("source_engine", "ai")),
                    rule_id=item.get("rule_id", "MM-AI-01"),
                    extra_metadata=item.get("extra_metadata", {})
                )
                validated_findings.append(finding)
            except Exception as fe:
                logger.warning(f"Skipping invalid finding schema item: {fe}")
                continue

        return {
            "summary": summary,
            "explanation": explanation,
            "verdict": verdict,
            "confidence_score": confidence_score,
            "findings": validated_findings
        }
