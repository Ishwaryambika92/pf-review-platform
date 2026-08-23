# TrueClaim — PF Services Review & Verification Platform

A review platform for PF (Provident Fund) service providers, built around
proof-based verification: every review can carry supporting evidence, and
only a moderator's decision — never the frontend — can grant the
"Verified Experience" / "Proof Verified" badges.

## Architecture

```
pf-review-platform/
├── backend/          Django + DRF API, PostgreSQL, JWT auth
├── frontend/         React + TypeScript + Vite
├── docker-compose.yml
```

Trust rules enforced server-side (not just UI conventions):
- New reviews always start at `status=pending`, regardless of what the client sends.
- `is_verified` / `proof_verified` are computed from `ReviewVerification.decision`, never accepted as API input.
- Proof files are never served from a public URL — only through an authenticated, ownership-checked download endpoint.
- Service rating stats are recalculated server-side from public reviews only (pending/rejected reviews never move the numbers).

## Prerequisites

- Docker + Docker Compose (recommended), **or**
- Python 3.12, Node 20, PostgreSQL 16 for running services individually

## Quick start (Docker Compose)

```bash
cd pf-review-platform
cp backend/.env.example backend/.env
docker compose up --build
```

This starts:
- `db` — PostgreSQL 16, with a persistent volume
- `backend` — migrates, collects static files, then serves via Gunicorn on `http://localhost:8000`
- `frontend` — built React app served by nginx on `http://localhost:5173`

Create a moderator account (proof verification requires this):

```bash
docker compose exec backend python manage.py shell -c "
from accounts.models import User, UserProfile
u = User.objects.create_user(username='moderator', email='mod@example.com', password='ChangeMe123!', is_moderator=True)
UserProfile.objects.create(user=u, display_name='Moderator')
"
```

Optionally seed service categories/services (creates **zero** reviews — real reviews only ever come from the actual submission flow):

```bash
docker compose exec backend python manage.py shell < scripts/seed_dev.py
```

Visit `http://localhost:5173`.

## Windows setup (no Docker)

Requires: [Python 3.12](https://www.python.org/downloads/) (check "Add python.exe to PATH" during install) and [Node.js 20 LTS](https://nodejs.org/). Run these in **PowerShell** (or Command Prompt — same commands work, just use `venv\Scripts\activate.bat` instead of the `.ps1` script noted below).

**1. Extract the ZIP**, then open a terminal in the extracted `pf-review-platform` folder.

**2. Backend:**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

set DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py migrate
python manage.py shell < scripts\seed_dev.py
python manage.py runserver 0.0.0.0:8000
```
> In PowerShell, use `$env:DJANGO_SETTINGS_MODULE = "config.settings.dev"` instead of `set ...` if `set` doesn't persist for the session.

Leave this terminal running. Dev settings use SQLite automatically — no PostgreSQL install needed to try it out locally.

**3. Frontend** (open a **second** terminal, back in the extracted root folder):
```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

**4. Open** `http://localhost:5173` in your browser.

**5. Create a moderator account** (needed to verify reviews) — in the backend terminal, stop the server with `Ctrl+C`, then:
```powershell
python manage.py shell -c "from accounts.models import User, UserProfile; u = User.objects.create_user(username='moderator', email='mod@example.com', password='ChangeMe123!', is_moderator=True); UserProfile.objects.create(user=u, display_name='Moderator')"
python manage.py runserver 0.0.0.0:8000
```

## Running without Docker (local development)

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py migrate
python manage.py shell < scripts/seed_dev.py   # optional: services only, no fake reviews
python manage.py runserver 0.0.0.0:8000
```
Dev settings use SQLite automatically — no Postgres setup required for local iteration.

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:8000/api
npm run dev
```
Visit `http://localhost:5173`.

## Running tests

```bash
cd backend
export DJANGO_SETTINGS_MODULE=config.settings.dev
python manage.py test
```

To run the same suite against a real PostgreSQL instance (recommended before any release):
```bash
export DJANGO_SETTINGS_MODULE=config.settings.test
export DJANGO_SECRET_KEY="some-long-random-value"
export DATABASE_URL="postgres://pf_user:pf_password@localhost:5432/pf_reviews"
export DB_SSL_REQUIRE=false
export USE_S3_PROOF_STORAGE=false
python manage.py test
```

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.dev` locally, `config.settings.production` in deployment |
| `DJANGO_SECRET_KEY` | Long random string — required in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames the API will answer for |
| `DJANGO_SECURE_SSL_REDIRECT` | `true` once served directly over HTTPS; `false` behind a TLS-terminating proxy/load balancer or for local docker-compose |
| `DATABASE_URL` | Postgres connection string |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origin(s) allowed to call the API |
| `USE_S3_PROOF_STORAGE` | `true` to store proof files in a private S3 bucket; `false` to use the local `media_private` volume |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_PRIVATE_BUCKET_NAME` / `AWS_S3_REGION_NAME` | Required only when `USE_S3_PROOF_STORAGE=true` |

## Going to S3 for proof storage

Local disk storage (the default) works for a single-server deployment but
doesn't scale across multiple app instances and isn't as durable. For real
production:

1. Create a **private** S3 bucket (block all public access).
2. Create an IAM user/role scoped to that bucket only (`s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`).
3. Set `USE_S3_PROOF_STORAGE=true` and fill in the `AWS_*` variables in `backend/.env`.
4. Proof files will then be stored with `AWS_QUERYSTRING_AUTH=True` and a 5-minute signed URL expiry (`AWS_QUERYSTRING_EXPIRE=300` in `config/settings/production.py`) — the bucket itself is never publicly readable.

## Deployment checklist

- [ ] Set a strong, unique `DJANGO_SECRET_KEY`
- [ ] Set `DJANGO_ALLOWED_HOSTS` to your real domain(s)
- [ ] Set `DJANGO_SECURE_SSL_REDIRECT=true` if this app terminates its own TLS, or `false` if a load balancer in front does
- [ ] Point `DATABASE_URL` at a managed PostgreSQL instance with backups enabled
- [ ] Set `USE_S3_PROOF_STORAGE=true` with a private bucket for any multi-instance deployment
- [ ] Set `CORS_ALLOWED_ORIGINS` to the exact frontend origin(s) — never `*` in production
- [ ] Run `python manage.py check --deploy` and resolve any warnings
- [ ] Create at least one moderator account before launch — nothing can be verified without one
- [ ] Do **not** run the dev seed script against production — it's for local/demo services only, and even then creates zero reviews

## What "seed data" does and doesn't include

`backend/scripts/seed_dev.py` creates service categories and services with
**zero reviews**. Real reviews, ratings, and verification counts only ever
come from actual users submitting through the real API — the platform
never ships with fabricated reviews, ratings, or verification badges.
