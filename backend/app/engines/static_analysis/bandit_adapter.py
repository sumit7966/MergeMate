import re
from typing import List, Dict, Any
from app.schemas.finding import FindingCreate


class BanditAdapter:
    """
    Adapter for Python security static analysis (Bandit standards).
    Detects insecure cryptographic practices, dangerous serialization, and unsafe assertions.
    """

    @classmethod
    def scan_diff(cls, files_diff: List[Dict[str, Any]]) -> List[FindingCreate]:
        findings: List[FindingCreate] = []

        for f in files_diff:
            filename = f.get("filename", "")
            if not filename.endswith(".py"):
                continue
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

                    # B301: pickle
                    if "pickle.loads" in code or "pickle.load" in code:
                        findings.append(FindingCreate(
                            title="Bandit B301: Insecure Deserialization via pickle",
                            description="Unpickling untrusted data can lead to remote code execution (RCE).",
                            category="security",
                            severity="critical",
                            confidence=0.99,
                            file_path=filename,
                            line_start=lineno,
                            code_evidence=code.strip(),
                            why_it_matters="Pickle bytecode can instantiate arbitrary objects and execute arbitrary OS commands.",
                            suggested_fix="Use a safer serialization format such as JSON, Protocol Buffers, or HMAC-signed payloads.",
                            source_engine="bandit",
                            rule_id="B301"
                        ))

                    # B506: yaml.load without Loader
                    if "yaml.load(" in code and "Loader=yaml.SafeLoader" not in code and "safe_load" not in code:
                        findings.append(FindingCreate(
                            title="Bandit B506: Use of Unsafe yaml.load",
                            description="Calling yaml.load without specifying SafeLoader allows arbitrary object deserialization.",
                            category="security",
                            severity="high",
                            confidence=0.98,
                            file_path=filename,
                            line_start=lineno,
                            code_evidence=code.strip(),
                            why_it_matters="Allows attackers crafting YAML to execute arbitrary Python code.",
                            suggested_fix="Use yaml.safe_load(...) instead.",
                            source_engine="bandit",
                            rule_id="B506"
                        ))

                    # B101: assert used in production code
                    if re.search(r"^\s*assert\s+", code) and not ("test" in filename.lower()):
                        findings.append(FindingCreate(
                            title="Bandit B101: Use of assert Detected in Production Code",
                            description="Assertions are stripped when Python is run with optimizations (-O flag).",
                            category="bug",
                            severity="medium",
                            confidence=0.92,
                            file_path=filename,
                            line_start=lineno,
                            code_evidence=code.strip(),
                            why_it_matters="Security or validation logic guarded solely by 'assert' statements can be bypassed in production.",
                            suggested_fix="Raise explicit exceptions such as ValueError or PermissionDenied instead of asserting.",
                            source_engine="bandit",
                            rule_id="B101"
                        ))

                    lineno += 1

        return findings
