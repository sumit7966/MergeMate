from app.engines.static_analysis.ruff_adapter import RuffAdapter
from app.engines.static_analysis.bandit_adapter import BanditAdapter
from app.engines.security.gitleaks_adapter import GitleaksAdapter
from app.engines.security.osv_adapter import OSVAdapter


def test_ruff_adapter_detects_mutable_default():
    files = [{
        "filename": "handlers/user.py",
        "patch": (
            "@@ -1,3 +1,5 @@\n"
            "+def process_items(items=[]):\n"
            "+    items.append(1)\n"
        )
    }]
    findings = RuffAdapter.scan_diff(files)
    assert any("B006" in f.rule_id or "Mutable" in f.title for f in findings)


def test_bandit_adapter_detects_pickle():
    files = [{
        "filename": "cache.py",
        "patch": (
            "@@ -5,2 +5,4 @@\n"
            "+import pickle\n"
            "+data = pickle.loads(untrusted_payload)\n"
        )
    }]
    findings = BanditAdapter.scan_diff(files)
    assert any("B301" in f.rule_id for f in findings)


def test_gitleaks_adapter_masks_leaked_key():
    files = [{
        "filename": "config.py",
        "patch": (
            "@@ -1,2 +1,3 @@\n"
            "+AWS_KEY = 'AKIA1234567890ABCDEF'\n"
        )
    }]
    findings = GitleaksAdapter.scan_diff(files)
    assert len(findings) == 1
    f = findings[0]
    assert f.severity == "critical"
    # Verify the plain secret is NOT exposed in the output
    assert "AKIA1234567890ABCDEF" not in f.code_evidence
    assert "..." in f.code_evidence


def test_osv_adapter_detects_vulnerable_package():
    files = [{
        "filename": "requirements.txt",
        "patch": (
            "@@ -1,1 +1,3 @@\n"
            "+requests==2.25.0\n"
            "+fastapi==0.110.0\n"
        )
    }]
    findings = OSVAdapter.scan_diff(files)
    assert any("CVE-2023-32681" in f.title for f in findings)

