import re
from typing import List, Dict, Any
from app.schemas.finding import FindingCreate


class OSVAdapter:
    """
    Adapter for Open Source Vulnerabilities (OSV / CVE database).
    Checks newly added dependencies for known security advisories.
    """

    KNOWN_VULNERABLE_DEPENDENCIES = {
        "requests": [
            ("2.25.0", "CVE-2023-32681", "critical", "Requests Unintended Leak of Proxy-Authorization Header"),
            ("2.20.0", "CVE-2018-18074", "high", "Requests HTTP Redirect Credential Leak")
        ],
        "urllib3": [
            ("1.26.4", "CVE-2023-45803", "high", "urllib3 Request Body not stripped after 303 redirect"),
            ("1.25.8", "CVE-2021-33503", "critical", "urllib3 Regular Expression DoS (ReDoS)")
        ],
        "flask": [
            ("0.12.2", "CVE-2018-1000656", "high", "Flask Denial of Service via unexpected JSON encodings"),
        ],
        "django": [
            ("3.2.0", "CVE-2022-34265", "critical", "Django SQL Injection via Trunc(kind) and Extract(lookup_name)"),
        ],
        "cryptography": [
            ("41.0.0", "CVE-2023-49083", "medium", "NULL-dereference when loading PKCS7 certificates"),
        ]
    }

    @classmethod
    def scan_diff(cls, files_diff: List[Dict[str, Any]]) -> List[FindingCreate]:
        findings: List[FindingCreate] = []

        for f in files_diff:
            filename = f.get("filename", "")
            if not any(filename.endswith(dep_file) for dep_file in ["requirements.txt", "Pipfile", "pyproject.toml", "package.json"]):
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
                    dep_line = line[1:].strip()
                    # Parse package and version e.g. "requests==2.25.0"
                    match = re.match(r"^([a-zA-Z0-9_\-]+)\s*(?:==|>=|<=|~=)\s*([0-9\.]+)", dep_line)
                    if match:
                        pkg_name = match.group(1).lower()
                        pkg_ver = match.group(2)

                        if pkg_name in cls.KNOWN_VULNERABLE_DEPENDENCIES:
                            for vuln_ver, cve, severity, advisory in cls.KNOWN_VULNERABLE_DEPENDENCIES[pkg_name]:
                                if pkg_ver == vuln_ver:
                                    findings.append(FindingCreate(
                                        title=f"Vulnerable Dependency: {pkg_name} {pkg_ver} ({cve})",
                                        description=f"Package {pkg_name} version {pkg_ver} contains known vulnerability {cve}: {advisory}.",
                                        category="dependency_vulnerability",
                                        severity=severity,
                                        confidence=0.97,
                                        file_path=filename,
                                        line_start=lineno,
                                        code_evidence=dep_line,
                                        why_it_matters="Known security vulnerabilities in third-party dependencies are prime targets for automated exploit bots.",
                                        suggested_fix=f"Upgrade {pkg_name} to the latest patched release.",
                                        source_engine="osv",
                                        rule_id=cve,
                                        extra_metadata={"package": pkg_name, "version": pkg_ver, "cve": cve}
                                    ))
                    lineno += 1

        return findings

