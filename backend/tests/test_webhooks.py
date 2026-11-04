import hmac
import hashlib
import json
from app.core.security import verify_github_signature


def test_github_webhook_signature_verification():
    secret = "my_webhook_secret_key"
    payload = b'{"action": "opened", "number": 1}'
    
    # Valid HMAC
    mac = hmac.new(secret.encode("utf-8"), msg=payload, digestmod=hashlib.sha256)
    valid_sig = f"sha256={mac.hexdigest()}"
    assert verify_github_signature(payload, valid_sig, secret=secret) is True

    # Invalid HMAC
    invalid_sig = "sha256=0000000000000000000000000000000000000000000000000000000000000000"
    assert verify_github_signature(payload, invalid_sig, secret=secret) is False

    # Missing signature
    assert verify_github_signature(payload, None, secret=secret) is False


def test_webhook_endpoint_duplicate_delivery_prevention(client):
    payload = {
        "action": "opened",
        "number": 101,
        "repository": {"full_name": "mergemate/test-repo"}
    }
    delivery_id = "delivery-uuid-999888"

    headers = {
        "X-GitHub-Event": "pull_request",
        "X-GitHub-Delivery": delivery_id
    }

    res1 = client.post("/api/v1/webhooks/github", json=payload, headers=headers)
    assert res1.status_code == 200

    # Resend identical delivery ID
    res2 = client.post("/api/v1/webhooks/github", json=payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json().get("status") == "ignored"
    assert res2.json().get("reason") == "duplicate_delivery"
