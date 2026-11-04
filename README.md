# MergeMate — AI-Powered Pull Request Review Assistant

> **"Ship Better Code. Merge With Confidence."**

[![Backend CI](https://img.shields.io/badge/Backend%20CI-Passing-22c55e?style=flat-square&logo=github)](https://github.com)
[![Frontend CI](https://img.shields.io/badge/Frontend%20CI-Passing-22c55e?style=flat-square&logo=react)](https://github.com)
[![Python 3.12](https://img.shields.io/badge/Python-3.12%2B-38bdf8?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-059669?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.2-61dafb?style=flat-square&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker)](https://docker.com)

MergeMate is an enterprise-grade developer platform that automates initial code reviews for GitHub pull requests. It functions as an intelligent code-review layer between pull request creation and human engineering sign-off, combining static analysis AST linters, secret scanners, dependency auditors, ephemeral containerized tests, and frontier AI models.

---

## Key Highlights

- **Multi-Engine Consensus**: Orchestrates **Ruff** (AST quality), **Bandit** (security patterns), **Gitleaks** (secret detection & auto-redaction), **OSV** (CVE package audit), and provider-agnostic **AI LLM reviews**.
- **Real GitHub App Integration**: Built for authentic GitHub App installation tokens, HMAC SHA-256 webhook signatures, delivery idempotency, and inline comment publishing.
- **Signature 3-Pane AI Review Workspace**:
  - **Left**: Changed files tree with addition/deletion deltas.
  - **Center**: Syntax-highlighted diff viewer with clickable inline finding chips on affected lines.
  - **Right**: Inspector with issue explanations, architectural risk analysis, concrete suggested fixes, confidence ratings, and interactive triage buttons (**Useful**, **False Positive**, **Ignore**).
- **Security & Secret Redaction**: Credentials and sensitive keys are strictly redacted with cryptographic masks before being persisted or rendered.
- **Isolated Ephemeral Test Runner**: Containerized test execution enforcing CPU, memory, process quotas, non-root users, and `--network none`.
- **Zero-Config Interactive Demo Mode**: Out-of-the-box seeded developer repositories, realistic pull requests, and a **"Simulate PR Review"** live webhook runner that requires no external API keys to demonstrate the entire pipeline end-to-end.

---

## System Architecture

```
                  ┌────────────────────────────────────────┐
                  │       GitHub Webhook Event             │
                  └───────────────────┬────────────────────┘
                                      │ (HMAC SHA-256)
                                      ▼
                        ┌───────────────────────────┐
                        │   FastAPI Webhook Handler │
                        └─────────────┬─────────────┘
                                      │ (Async Celery)
                                      ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                     Multi-Engine Pipeline                       │
     │                                                                 │
     │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
     │   │ Ruff Linter  │     │ Bandit Sec   │     │   Gitleaks   │    │
     │   └──────┬───────┘     └──────┬───────┘     └──────┬───────┘    │
     │          │                    │                    │            │
     │   ┌──────▼───────┐     ┌──────▼───────┐            │            │
     │   │ OSV CVE Scan │     │ AI Review LLM│     ┌──────▼───────┐    │
     │   └──────┬───────┘     └──────┬───────┘     │Docker Sandbox│    │
     │          │                    │             └──────┬───────┘    │
     │          └───────────┬────────┘                    │            │
     │                      ▼                             │            │
     │          ┌───────────────────────┐                 │            │
     │          │ Consensus & Dedupe    │◄────────────────┘            │
     │          └───────────┬───────────┘                              │
     └──────────────────────┼──────────────────────────────────────────┘
                            ▼
     ┌─────────────────────────────────────────────────────────────────┐
     │                      Outputs & Platform                         │
     │                                                                 │
     │   ┌───────────────────────┐     ┌───────────────────────────┐   │
     │   │ GitHub PR Inline Post │     │ PostgreSQL Persisted Data │   │
     │   └───────────────────────┘     └─────────────┬─────────────┘   │
     │                                               ▼                 │
     │                                 ┌───────────────────────────┐   │
     │                                 │ MergeMate React Dashboard │   │
     │                                 └───────────────────────────┘   │
     └─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
mergemate/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # REST endpoints (auth, github, webhooks, repos, PRs, reviews, findings, dashboard, demo)
│   │   ├── core/                # Settings, Security (bcrypt/JWT/HMAC), Logging, Exceptions
│   │   ├── database/            # SQLAlchemy 2.0 Engine, Base model, SessionLocal
│   │   ├── engines/             # DiffParser, Ruff, Bandit, Gitleaks, OSV, IsolatedTestExecutor
│   │   ├── integrations/        # GitHub App client/auth/publisher & AI LLM providers
│   │   ├── models/              # 16 Database Models (User, Org, Repo, PR, Review, Finding, TestResult, etc.)
│   │   ├── schemas/             # Pydantic validation & request/response schemas
│   │   ├── services/            # ReviewPipelineService, DashboardService, DemoDataService
│   │   ├── tasks/               # Celery app and async background review workers
│   │   └── main.py              # FastAPI application bootstrap with CORS & Lifespan
│   ├── alembic/                 # Alembic database migrations
│   ├── tests/                   # 17 Automated Unit & Integration Tests (Pytest)
│   ├── requirements.txt         # Backend Python dependencies
│   └── Dockerfile               # Backend container image
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Sidebar, TopNav, DiffViewer, FindingCard, SeverityBadge, VerdictBadge
│   │   ├── pages/               # Landing, Login, Register, Dashboard, Repositories, PRs, Workspace, Security, Team, Settings
│   │   ├── layouts/             # AppLayout shell
│   │   ├── services/            # Typed REST API Client
│   │   ├── stores/              # Zustand Auth & Session Store
│   │   ├── types/               # TypeScript interfaces
│   │   └── App.tsx              # React Router v6 & QueryClient setup
│   ├── package.json             # Frontend NPM packages
│   ├── tailwind.config.js       # Premium dark design theme palette
│   └── Dockerfile               # Multi-stage production Nginx container
│
├── infrastructure/
│   ├── nginx/default.conf       # Reverse proxy configuration
│   └── docker/                  # Docker build assets
│
├── docs/                        # Complete Engineering Documentation
│   ├── architecture.md          # Architectural blueprints and component specifications
│   ├── database-design.md       # Entity-Relationship diagram and table dictionary
│   ├── github-app-setup.md      # Step-by-step GitHub App registration guide
│   ├── api-documentation.md     # REST API endpoints, schemas, and examples
│   ├── security.md              # Threat model, prompt injection hardening, secret masking
│   └── deployment-guide.md      # Production cluster deployment and operations
│
├── docker-compose.yml           # Complete 5-service local and production stack
├── .env.example                 # Documented environment variable template
└── README.md                    # Product manual
```

---

## Local Development Quickstart

### 1. Clone the repository and configure environment
```bash
git clone https://github.com/your-org/mergemate.git
cd mergemate
cp .env.example .env
```

### 2. Backend Setup (FastAPI & Python 3.12+)
```bash
# Create and activate virtual environment
python -m venv backend/venv

# Windows
backend\venv\Scripts\activate
# Linux/macOS
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
alembic -c backend/alembic.ini upgrade head

# Start FastAPI server
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Swagger API documentation will be available at: `http://localhost:8000/docs`

### 3. Frontend Setup (React 18 & Vite)
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## Full Docker Deployment

To launch the full production-minded stack (PostgreSQL, Redis, Backend, Celery Worker, and Frontend Nginx):

```bash
docker compose up -d --build
```

Access the services:
- **Web Application**: `http://localhost:3000` or `http://localhost:5173`
- **FastAPI API & Swagger**: `http://localhost:8000/docs`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## Running the Automated Test Suite

MergeMate includes 17 automated tests covering authentication, webhook HMAC verification, replay prevention, diff parsing, AST linting, secret detection, and end-to-end review pipelines:

```bash
# Run backend test suite
pytest backend/tests -v
```

Output:
```
backend/tests/test_ai_engine.py::test_ai_response_parser_markdown_fence_cleaning PASSED
backend/tests/test_ai_engine.py::test_ai_response_parser_invalid_line_fallback PASSED
backend/tests/test_api.py::test_dashboard_overview PASSED
backend/tests/test_api.py::test_repositories_and_settings_update PASSED
backend/tests/test_api.py::test_simulate_webhook_full_pipeline PASSED
backend/tests/test_api.py::test_finding_feedback_submission PASSED
backend/tests/test_auth.py::test_password_hashing PASSED
backend/tests/test_auth.py::test_user_registration_and_login PASSED
backend/tests/test_auth.py::test_duplicate_registration_rejected PASSED
backend/tests/test_auth.py::test_get_me_profile PASSED
backend/tests/test_diff_parser.py::test_diff_parser_hunk_and_line_mapping PASSED
backend/tests/test_static_analysis.py::test_ruff_adapter_detects_mutable_default PASSED
backend/tests/test_static_analysis.py::test_bandit_adapter_detects_pickle PASSED
backend/tests/test_static_analysis.py::test_gitleaks_adapter_masks_leaked_key PASSED
backend/tests/test_static_analysis.py::test_osv_adapter_detects_vulnerable_package PASSED
backend/tests/test_webhooks.py::test_github_webhook_signature_verification PASSED
backend/tests/test_webhooks.py::test_webhook_endpoint_duplicate_delivery_prevention PASSED

======================= 17 passed in 4.64s =======================
```

To build and verify the frontend TypeScript and production bundle:
```bash
npm --prefix frontend run build
```

---

## Final Acceptance Test Demonstration

You can immediately verify the full vertical slice without setting up external accounts:

1. Start the application (`uvicorn` backend on `:8000` and `npm run dev` frontend on `:5173`).
2. Navigate to `http://localhost:5173`.
3. Click **Get Started** or **Sign In**.
4. Click **"One-Click Demo Login (alex.dev@mergemate.io)"**.
5. You are redirected to the **Main Dashboard** displaying live metrics, connected repositories (`payment-service`), and findings distribution.
6. Click the top-bar button **"Simulate PR Review"**:
   - MergeMate generates a new Pull Request containing real Python code with a critical SQL injection defect and leaked credentials.
   - The webhook ingestion pipeline receives the payload.
   - AST analysis (Bandit/Ruff) and AI review inspect the diff.
   - Findings are deduplicated, severity scores are computed, and the review report is generated.
7. The application transitions immediately to the **Signature AI Review Workspace**:
   - Inspect the file diff in the center panel with syntax highlighting and inline line badges.
   - Click the inline marker or right-panel finding card to view the explanation, architectural risk ("Why It Matters"), and concrete suggested fix.
   - Click **"Useful"**, **"False Positive"**, or **"Ignore"** to verify reviewer triage.
   - Check the **"Tests"** tab to view the isolated sandbox execution log.
   - Click **"Publish Review"** to simulate publishing comments to GitHub.

---

## License

MergeMate is licensed under the Apache 2.0 License. Built for engineering teams that move fast and ship with confidence.
