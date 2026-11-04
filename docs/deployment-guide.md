# MergeMate Production Deployment Guide

This guide covers deploying MergeMate in production environments using Docker Compose, PostgreSQL, Redis, Celery, and Nginx reverse proxy.

---

## 1. Prerequisites

- Linux host (Ubuntu 22.04 LTS or newer recommended)
- Docker Engine 24+ and Docker Compose v2+
- Domain name with DNS A records pointing to host IP
- SSL certificate (e.g. Let's Encrypt Certbot)

---

## 2. Environment Configuration

1. Clone the repository to the host server:
   ```bash
   git clone https://github.com/your-org/mergemate.git
   cd mergemate
   ```

2. Copy the example configuration:
   ```bash
   cp .env.example .env
   ```

3. Generate a secure secret key:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
   Paste the generated string into `SECRET_KEY` in `.env`.

4. Configure your production credentials:
   - `POSTGRES_PASSWORD`: Strong database password
   - `OPENAI_API_KEY`: Your production OpenAI API key
   - `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET`: Configured from your GitHub App settings
   - Set `DEMO_MODE=false` in production.

---

## 3. Starting the Production Cluster

Run Docker Compose to build and start all containers:

```bash
docker compose up -d --build
```

Verify that all 5 services are running and healthy:

```bash
docker compose ps
```

Expected output:
- `mergemate-postgres` (healthy, port 5432)
- `mergemate-redis` (healthy, port 6379)
- `mergemate-backend` (running, port 8000)
- `mergemate-worker` (running, Celery worker)
- `mergemate-frontend` (running, port 80 / 3000)

---

## 4. Applying Database Migrations

Apply Alembic migrations to the PostgreSQL database container:

```bash
docker compose exec backend alembic upgrade head
```

---

## 5. Monitoring Logs

Check live backend and worker logs:

```bash
# Backend API logs
docker compose logs -f backend

# Celery review worker logs
docker compose logs -f celery_worker
```

---

## 6. Health Checks & Verification

Verify the API health endpoint:

```bash
curl -f http://localhost:8000/api/v1/health
```
Response:
```json
{
  "status": "healthy",
  "service": "MergeMate Backend",
  "version": "1.0.0",
  "environment": "production"
}
```
