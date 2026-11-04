import re
from typing import List, Dict, Any
from app.schemas.finding import FindingCreate
from app.core.security import mask_secret


class GitleaksAdapter:
    """
    Adapter for Secret & Credential Detection (Gitleaks pattern standards).
    Detects high-entropy keys, private certificates, cloud API tokens, and JWTs,
    ensuring secret values are strictly REDACTED in all outputs.
    """

    SECRET_PATTERNS = [
        ("AWS Access Key ID", r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}", "critical", "GITLEAKS-AWS-01"),
        ("GitHub Personal Access Token", r"gh[pousr]_[A-Za-z0-9_]{36,255}", "critical", "GITLEAKS-GH-01"),
        ("Generic High-Entropy API Key", r"(?i)(?:api_key|access_token|secret_key|auth_token)\s*[:=]\s*['\"]([A-Za-z0-9_\-\.]{24,})['\"]", "high", "GITLEAKS-GEN-01"),
        ("RSA Private Key", r"-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----", "critical", "GITLEAKS-PK-01"),
        ("Slack Webhook URL", r"https://hooks\.slack\.com/services/T[a-zA-Z0-9_]+/B[a-zA-Z0-9_]+/[a-zA-Z0-9_]+", "high", "GITLEAKS-SLACK-01"),
        ("Database Connection String with Credentials", r"(?:postgres|mysql|mongodb|redis):\/\/[^:\s]+:[^@\s]+@[^\s]+", "critical", "GITLEAKS-DB-01")
    ]

    @classmethod
    def scan_diff(cls, files_diff: List[Dict[str, Any]]) -> List[FindingCreate]:
        findings: List[FindingCreate] = []

        for f in files_diff:
            filename = f.get("filename", "")
            patch = f.get("patch", "")
            lineno = 1

            for line in patch.splitlines():
                if line.startswith("@@"):
                    m = re.search(r"\+(\d+)", line)
                    if m:
                        lineno = int(m.group(1))
                    continue

                if line.startswith("+") and not line.startswith("+++"):
                    code = line[1:]

                    for pattern_name, pattern_regex, severity, rule_id in cls.SECRET_PATTERNS:
                        match = re.search(pattern_regex, code)
                        if match:
                            raw_match = match.group(0)
                            safe_masked = mask_secret(raw_match)
                            
                            findings.append(FindingCreate(
                                title=f"Secret Leak Detected: {pattern_name}",
                                description=f"Potential sensitive credential matching {pattern_name} pattern found in diff.",
                                category="secret_leak",
                                severity=severity,
                                confidence=0.99,
                                file_path=filename,
                                line_start=lineno,
                                code_evidence=f"Masked credential: {safe_masked}",
                                why_it_matters="Leaked credentials can be harvested by malicious actors to compromise infrastructure and private databases.",
                                suggested_fix="Immediately revoke this token/key, rotate credentials, and store references in environment variables.",
                                source_engine="gitleaks",
                                rule_id=rule_id,
                                extra_metadata={"secret_type": pattern_name}
                            ))
                            break

                    lineno += 1

        return findings
