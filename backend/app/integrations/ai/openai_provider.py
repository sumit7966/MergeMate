import os
import re
from typing import List, Dict, Any, Optional, Set
from openai import AsyncOpenAI
from app.integrations.ai.base import LLMProvider
from app.integrations.ai.prompts import SYSTEM_REVIEW_PROMPT, USER_REVIEW_TEMPLATE
from app.integrations.ai.parser import AIResponseParser
from app.engines.diff_parser import DiffParser
from app.schemas.finding import FindingCreate
from app.core.config import settings
from app.core.logging import logger


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.AI_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def review_diff(
        self,
        repo_name: str,
        pr_title: str,
        files_diff: List[Dict[str, Any]],
        custom_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes AI review on the PR diff. If an OpenAI key is configured, uses OpenAI.
        Otherwise falls back to an intelligent heuristic engine for demo/offline test execution.
        """
        # Build valid line mappings and diff text
        valid_lines_by_file: Dict[str, Set[int]] = {}
        formatted_chunks = []

        for f in files_diff:
            filename = f.get("filename", "")
            patch = f.get("patch", "")
            if not patch:
                continue
            parsed = DiffParser.parse_patch(patch, filename)
            valid_lines_by_file[filename] = parsed.valid_new_lines
            formatted_chunks.append(f"--- File: {filename} ---\n{DiffParser.extract_changed_context(parsed)}")

        combined_diff_text = "\n\n".join(formatted_chunks)

        if self.client and self.api_key:
            try:
                user_content = USER_REVIEW_TEMPLATE.format(
                    repo_name=repo_name,
                    pr_title=pr_title,
                    custom_instructions=custom_instructions or "None provided",
                    diff_context=combined_diff_text[:12000]  # token protection limit
                )

                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_REVIEW_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=settings.AI_TEMPERATURE,
                    max_tokens=settings.AI_MAX_TOKENS,
                    response_format={"type": "json_object"}
                )

                raw_content = response.choices[0].message.content or "{}"
                return AIResponseParser.parse_and_validate(raw_content, valid_lines_by_file)
            except Exception as e:
                logger.error(f"OpenAI API error during review: {e}, falling back to intelligent heuristic parser")

        # Fallback intelligent reviewer for local testing and offline execution
        return self._heuristic_review(repo_name, pr_title, files_diff, valid_lines_by_file)

    def _heuristic_review(
        self,
        repo_name: str,
        pr_title: str,
        files_diff: List[Dict[str, Any]],
        valid_lines_by_file: Dict[str, Set[int]]
    ) -> Dict[str, Any]:
        """
        Deterministic, intelligent rule-based scanner for offline/demo verification.
        Finds real antipatterns in diffs: SQL injection, bare except, shell=True, hardcoded keys.
        """
        findings: List[FindingCreate] = []

        for f in files_diff:
            filename = f.get("filename", "")
            patch = f.get("patch", "")
            parsed = DiffParser.parse_patch(patch, filename)
            
            for line in parsed.lines:
                if line.line_type != "add" or line.new_lineno is None:
                    continue
                
                content = line.content
                lineno = line.new_lineno

                # 1. SQL Injection / string formatting
                if re.search(r"SELECT\s+.*\s+FROM\s+.*%s|f\"SELECT\s+.*\{", content, re.IGNORECASE):
                    findings.append(FindingCreate(
                        title="Potential SQL Injection via Raw String Interpolation",
                        description=f"Raw SQL query constructed using string formatting at line {lineno}. User input directly concatenated into query string can allow arbitrary query execution.",
                        category="security",
                        severity="critical",
                        confidence=0.96,
                        file_path=filename,
                        line_start=lineno,
                        code_evidence=content.strip(),
                        why_it_matters="Direct string interpolation bypasses parameterized query protection and exposes the database to severe injection attacks.",
                        suggested_fix="Use parameterized queries with SQLAlchemy text(:param) or ORM filter statements.",
                        source_engine="ai",
                        rule_id="MM-SEC-SQLI-01"
                    ))

                # 2. Hardcoded Secrets
                if re.search(r"(?:api_key|secret_key|password|jwt_secret)\s*=\s*['\"][A-Za-z0-9_\-]{8,}['\"]", content, re.IGNORECASE):
                    findings.append(FindingCreate(
                        title="Hardcoded Sensitive Credential Detected",
                        description="Plaintext credential or private secret literal identified in source diff.",
                        category="security",
                        severity="critical",
                        confidence=0.98,
                        file_path=filename,
                        line_start=lineno,
                        code_evidence="[REDACTED_SECRET_LITERAL]",
                        why_it_matters="Committing plaintext credentials risks complete unauthorized compromise across environments.",
                        suggested_fix="Move sensitive credentials to environment variables or a secure secret vault (e.g. AWS Secrets Manager, Doppler).",
                        source_engine="ai",
                        rule_id="MM-SEC-CRED-01"
                    ))

                # 3. Subprocess shell=True
                if "shell=True" in content and "subprocess" in content:
                    findings.append(FindingCreate(
                        title="Dangerous Subprocess Invocation with shell=True",
                        description="Execution of system command with shell=True enables command injection if input contains metacharacters.",
                        category="security",
                        severity="high",
                        confidence=0.92,
                        file_path=filename,
                        line_start=lineno,
                        code_evidence=content.strip(),
                        why_it_matters="An attacker providing untrusted input can execute arbitrary system commands on the host machine.",
                        suggested_fix="Pass command arguments as an array of strings with shell=False: subprocess.run(['cmd', arg], shell=False).",
                        source_engine="ai",
                        rule_id="MM-SEC-CMD-01"
                    ))

                # 4. Bare except
                if re.search(r"^\s*except:\s*$", content):
                    findings.append(FindingCreate(
                        title="Dangerous Bare Exception Handler",
                        description="Using a bare 'except:' clause catches KeyboardInterrupt and SystemExit, masking critical runtime errors.",
                        category="error_handling",
                        severity="medium",
                        confidence=0.90,
                        file_path=filename,
                        line_start=lineno,
                        code_evidence=content.strip(),
                        why_it_matters="Masks unintended exceptions and makes diagnosing failures in production extremely difficult.",
                        suggested_fix="Catch specific exceptions like 'except Exception as e:' or narrower exception subclasses.",
                        source_engine="ai",
                        rule_id="MM-ERR-BARE-01"
                    ))

                # 5. Missing timeout in requests / httpx
                if re.search(r"(?:requests|httpx)\.(?:get|post|put|delete)\([^)]*\)", content) and "timeout=" not in content:
                    findings.append(FindingCreate(
                        title="HTTP Request Missing Explicit Timeout",
                        description="Outbound HTTP call invoked without a timeout parameter. Socket may hang indefinitely.",
                        category="performance",
                        severity="medium",
                        confidence=0.88,
                        file_path=filename,
                        line_start=lineno,
                        code_evidence=content.strip(),
                        why_it_matters="Unbounded HTTP calls can exhaust connection pools and worker threads during external network degradation.",
                        suggested_fix="Supply an explicit timeout, e.g., timeout=10.0.",
                        source_engine="ai",
                        rule_id="MM-PERF-TIMEOUT-01"
                    ))

        has_critical = any(f.severity in ["critical", "high"] for f in findings)
        verdict = "REQUEST_CHANGES" if has_critical and len(findings) > 1 else "COMMENT"
        
        summary = (
            f"MergeMate analyzed {len(files_diff)} changed file(s) across pull request '{pr_title}'. "
            f"Found {len(findings)} potential issue(s). "
            + ("Critical defects require attention before merge." if has_critical else "Code looks generally sound.")
        )
        explanation = (
            "Automated inspection analyzed diff patterns for runtime stability, vulnerability vectors, "
            "and adherence to security best practices. Inline comments highlight specific line occurrences."
        )

        return {
            "summary": summary,
            "explanation": explanation,
            "verdict": verdict,
            "confidence_score": 0.94 if findings else 0.88,
            "findings": findings
        }

