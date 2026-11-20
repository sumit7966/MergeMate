# MergeMate REST API Specification (/api/v1)

MergeMate exposes a structured REST API documented via OpenAPI. When the backend is running, the interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## Authentication Endpoints

### Register User
`POST /api/v1/auth/register`
```json
{
  "email": "sarah@acme.com",
  "password": "strongPassword123",
  "full_name": "Sarah Connor",
  "organization_name": "Acme Cybernetics"
}
```
**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

### Login
`POST /api/v1/auth/login`
```json
{
  "email": "sarah@acme.com",
  "password": "strongPassword123"
}
```

### Current User Profile
`GET /api/v1/auth/me` (Bearer token required)

---

## Webhooks

### Inbound GitHub Webhook
`POST /api/v1/webhooks/github`
- **Headers**:
  - `X-Hub-Signature-256`: `sha256=<hmac_sha256_hex>`
  - `X-GitHub-Event`: `pull_request`
  - `X-GitHub-Delivery`: `<unique_delivery_uuid>`
- **Response (200 OK):**
```json
{
  "status": "queued",
  "review_job_id": "8b9e1a2f-...",
  "pull_request_id": "c3d4e5f6-..."
}
```

---

## Repositories & Pull Requests

### List Repositories
`GET /api/v1/repositories`

### Update Repository Settings
`PATCH /api/v1/repositories/{id}/settings`
```json
{
  "auto_review_enabled": true,
  "ai_review_enabled": true,
  "severity_threshold": "medium",
  "custom_instructions": "Verify all SQL queries use parameterized arguments."
}
```

### List Pull Requests
`GET /api/v1/pull-requests?state=open&repository_id={repo_id}`

### Pull Request Details & Files
`GET /api/v1/pull-requests/{id}`
`GET /api/v1/pull-requests/{id}/files`

### Trigger / Rerun Review
`POST /api/v1/pull-requests/{id}/review`
`POST /api/v1/pull-requests/{id}/review/rerun`

---

## Reviews & Findings

### Get Review Report
`GET /api/v1/reviews/{id}`
`GET /api/v1/reviews/{id}/findings`
`GET /api/v1/reviews/{id}/tests`

### Publish Review to GitHub
`POST /api/v1/reviews/{id}/publish`

### Submit Triage Feedback on Finding
`POST /api/v1/findings/{id}/feedback`
```json
{
  "action": "useful",  // "useful" | "incorrect" | "ignored"
  "comment": "Prevented critical production vulnerability."
}
```

---

## Interactive Demo & Simulation

### Seed Sample Data
`POST /api/v1/demo/seed`

### Simulate Live PR Webhook Event
`POST /api/v1/demo/simulate-webhook`
Generates a realistic pull request with deliberate security defects, runs the entire multi-engine analysis pipeline, stores findings, and returns the review report.

