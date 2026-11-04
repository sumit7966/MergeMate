# MergeMate Security Architecture & Threat Model

MergeMate is built with a zero-trust, defense-in-depth security philosophy.

---

## 1. Webhook Authentication & Integrity

- **HMAC SHA-256 Signatures**: MergeMate enforces cryptographic verification on all inbound webhooks using `X-Hub-Signature-256`. Webhooks with missing, mismatched, or malformed signatures are rejected with `401 Unauthorized`.
- **Replay Protection**: Each webhook delivery carries an `X-GitHub-Delivery` UUID. MergeMate records and deduplicates deliveries in the database. Replays of identical delivery IDs are ignored to prevent denial-of-service or repeated execution.

---

## 2. Prompt Injection Defense

Repository code and pull request diffs are inherently **untrusted input**. MergeMate implements strict defenses:
1. **Delimited Context**: Diff chunks and filenames are encapsulated inside strict delimiters.
2. **System Prompt Hardening**: System instructions explicitly forbid model execution of instructions embedded in diff comments, docstrings, or test files.
3. **Structured Pydantic Enforcement**: LLM output is strictly validated against Pydantic schemas. Hallucinated schemas or markdown leaks are rejected and scrubbed.
4. **Line-Number Existence Verification**: All AI-suggested line numbers are cross-referenced with the valid added lines parsed from the git diff. Findings pointing to invalid lines are downgraded to file-level comments to prevent GitHub API rejections.

---

## 3. Secret Detection & Automatic Redaction

- Gitleaks patterns identify AWS keys, GitHub tokens, database connection strings, and private keys.
- **Strict Redaction**: Identified secret strings are masked using `mask_secret()` (e.g. `ghp_...ab12`) before being logged, stored in PostgreSQL, or rendered on the frontend dashboard.

---

## 4. Ephemeral Non-Root Test Container Sandbox

- Submitted repository test code is **never** executed inside the FastAPI or Celery host processes.
- Execution occurs exclusively in ephemeral Docker containers:
  - User: `1000:1000` (non-root)
  - Network: `--network none` (blocked outbound sockets)
  - Memory: `--memory 512m`
  - CPU: `--cpus 1.0`
  - Execution timeout: `60 seconds`
  - Container auto-removal: `--rm`

---

## 5. Token Protection & Least Privilege

- MergeMate never requests admin or repository write permissions beyond Pull Requests and Checks.
- GitHub App tokens are generated on-demand as short-lived installation tokens valid for 10 minutes maximum.
- Private keys and installation tokens are stored server-side only in encrypted environment variables and are never transmitted to frontend clients.
