import shutil
import subprocess
import json
import tempfile
import os
import re
from typing import List, Dict, Any
from app.schemas.finding import FindingCreate
from app.core.logging import logger


class RuffAdapter:
    @staticmethod
    def is_available() -> bool:
        return shutil.which("ruff") is not None

    @classmethod
    def scan_diff(cls, files_diff: List[Dict[str, Any]]) -> List[FindingCreate]:
        findings: List[FindingCreate] = []

        # If ruff is installed, we can run it on temporary files, otherwise run AST regex rule checks
        if cls.is_available():
            try:
                with tempfile.TemporaryDirectory() as tmpdir:
                    for f in files_diff:
                        filename = f.get("filename", "")
                        if not filename.endswith(".py"):
                            continue
                        patch = f.get("patch", "")
                        # Write changed lines to temporary target file
                        filepath = os.path.join(tmpdir, os.path.basename(filename))
                        # extract lines
                        added_lines = [l[1:] for l in patch.splitlines() if l.startswith("+") and not l.startswith("+++")]
                        with open(filepath, "w", encoding="utf-8") as out:
                            out.write("\n".join(added_lines))

                    res = subprocess.run(
                        ["ruff", "check", "--output-format", "json", tmpdir],
                        capture_output=True,
                        text=True,
                        timeout=15
                    )
                    if res.stdout:
                        data = json.loads(res.stdout)
                        for item in data:
                            findings.append(FindingCreate(
                                title=f"Ruff Lint: {item.get('code', 'E001')} - {item.get('message')}",
                                description=item.get("message", "Lint rule violation detected by Ruff."),
                                category="code_quality",
                                severity="low",
                                confidence=0.99,
                                file_path=item.get("filename", ""),
                                line_start=item.get("location", {}).get("row", 1),
                                why_it_matters="Code style and syntax standard compliance improves maintainability and prevents latent bugs.",
                                suggested_fix=item.get("fix", {}).get("message", "Apply automated ruff fix or adjust formatting."),
                                source_engine="ruff",
                                rule_id=item.get("code", "RUFF-001")
                            ))
                        return findings
            except Exception as e:
                logger.warning(f"Ruff execution skipped or encountered error: {e}")

        # Fallback static pattern checker for Ruff rules
        for f in files_diff:
            filename = f.get("filename", "")
            if not filename.endswith(".py"):
                continue
            patch = f.get("patch", "")
            lineno = 1
            for line in patch.splitlines():
                if line.startswith("@@"):
                    # Parse hunk header
                    m = re.search(r"\+(\d+)", line)
                    if m:
                        lineno = int(m.group(1))
                    continue
                if line.startswith("+") and not line.startswith("+++"):
                    code = line[1:]
                    # Check wildcard import
                    if re.search(r"from\s+[\w\.]+\s+import\s+\*", code):
                        findings.append(FindingCreate(
                            title="Ruff F403: 'from module import *' Used; Unable to Detect Undefined Names",
                            description="Star imports pollute the module namespace and make it impossible to statically verify identifiers.",
                            category="maintainability",
                            severity="medium",
                            confidence=0.98,
                            file_path=filename,
                            line_start=lineno,
                            code_evidence=code.strip(),
                            why_it_matters="Star imports obscure symbol origin and can unintentionally override built-in or imported names.",
                            suggested_fix="Import only explicitly required names: 'from module import specific_func'.",
                            source_engine="ruff",
                            rule_id="F403"
                        ))
                    # Check mutable default argument
                    if re.search(r"def\s+\w+\(.*=\s*(\[\]|\{\})\)", code):
                        findings.append(FindingCreate(
                            title="Ruff B006: Do Not Use Mutable Data Structures for Argument Defaults",
                            description="Default parameter initialized to mutable object (list/dict) retains mutations across subsequent calls.",
                            category="bug",
                            severity="high",
                            confidence=0.95,
                            file_path=filename,
                            line_start=lineno,
                            code_evidence=code.strip(),
                            why_it_matters="Function arguments are evaluated once at definition time, creating shared mutable state between invocations.",
                            suggested_fix="Use None as default and initialize inside function: arg = arg or []",
                            source_engine="ruff",
                            rule_id="B006"
                        ))
                    lineno += 1

        return findings

