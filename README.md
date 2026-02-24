# GAIA: Web Framework for LLM CO₂ Tracking

GAIA is a multi-service project for measuring, visualizing, and optimizing the environmental impact of LLM usage.
It combines:

- a **Next.js web app** for user-facing analytics,
- a **Flask CO₂ calculation API** for token-level impact estimates,
- a **Flask cloud optimization API** for carbon-aware workload planning,
- and a **browser extension** for capturing usage signals.

---

## Table of Contents

1. [What this repository contains](#what-this-repository-contains)
2. [System architecture](#system-architecture)
3. [Tech stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick start (full local setup)](#quick-start-full-local-setup)
6. [Environment variables](#environment-variables)
7. [Running each component](#running-each-component)
8. [API overview](#api-overview)
9. [Database notes](#database-notes)
10. [Development workflow](#development-workflow)
11. [Troubleshooting](#troubleshooting)
12. [Future improvements](#future-improvements)

---

## What this repository contains

```text
GAIA_Web-Framework-for-LLM-CO2-tracking/
├─ web-framework/                 # Next.js app (dashboard, auth, API routes, worker)
├─ flask/
│  ├─ app.py                      # Core LLM impact calculator API
│  ├─ genai_co2_calculate.py      # Supporting estimation logic
│  ├─ suggestion/                 # Carbon-aware cloud recommendation API
│  └─ extension_backend/          # Backend for extension auth/metrics
└─ browser_extension/
   └─ gaia-extension/             # Chrome extension (Vite + React + TS)
```

This structure allows you to run a complete local prototype, with the web app calling Flask APIs and storing analytics in PostgreSQL.

---

## System architecture

1. **Web client (Next.js)**
   - Handles UI, authentication, dashboard rendering, and app-level API routes.
   - Talks to PostgreSQL for persistence.
   - Calls Flask services for compute-heavy carbon estimations.

2. **CO₂ Calculation Service (`flask/app.py`)**
   - Exposes model metadata and impact endpoints.
   - Estimates energy, CO₂, and water usage from model + token inputs.
   - Uses Electricity Maps when configured; otherwise falls back to static regional estimates.

3. **Cloud Optimization Service (`flask/suggestion/`)**
   - Provides region-aware optimization for cloud workloads.
   - Supports recommendation, comparison, scheduling, and region listing endpoints.

4. **Extension Backend (`flask/extension_backend/`)**
   - Manages extension auth and metric ingestion endpoints.

5. **Browser Extension (`browser_extension/gaia-extension/`)**
   - Captures relevant prompts/metadata in-browser (depending on configured behavior).
   - Can forward usage metrics for tracking.

---

## Tech stack

### Frontend (`web-framework`)
- Next.js (App Router)
- React + TypeScript
- NextAuth
- PostgreSQL (`pg`)

### Python services (`flask`)
- Flask + Flask-CORS
- Requests
- dotenv (in subservices)

### Browser extension (`browser_extension/gaia-extension`)
- Vite
- React + TypeScript
- Chrome extension APIs

---

## Prerequisites

Install these before starting:

- **Node.js** 20+
- **npm** 9+
- **Python** 3.10+
- **pip**
- **PostgreSQL** (local or managed, e.g. Neon)

Optional but recommended:

- **Electricity Maps API key** for live carbon intensity
- **OAuth credentials** (Google/GitHub) if using social login in NextAuth

---

## Quick start (full local setup)

> The commands below assume you are in the repo root.

### 1) Start the CO₂ calculation API (port 5001)

```bash
cd flask
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export FLASK_ENV=development
export PORT=5001
python app.py
```

### 2) Start the optimization API (port 5000)

Open a second terminal:

```bash
cd flask/suggestion
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp -n .env.example .env      # if available
python app.py
```

### 3) Start the Next.js app (port 3000)

Open a third terminal:

```bash
cd web-framework
npm install
cp -n .env.example .env.local   # if available
npm run dev
```

### 4) (Optional) Start extension frontend build/watch

Open a fourth terminal:

```bash
cd browser_extension/gaia-extension
npm install
npm run dev
```

Then load the extension in Chrome via:

- `chrome://extensions`
- Enable **Developer mode**
- **Load unpacked** and select the extension directory (or built output)

---

## Environment variables

You can adapt this baseline for local development.

### `web-framework/.env.local`

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gaia

# Auth
JWT_SECRET=replace_with_a_strong_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_nextauth_secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Service URLs
FLASK_SERVICE_URL=http://localhost:5001
FLASK_API_URL=http://localhost:5000

# Worker tuning (optional)
CO2_WORKER_POLL_MS=5000
CO2_WORKER_BATCH_SIZE=10
CO2_WORKER_MAX_RETRY=3
```

### `flask/.env` (optional)

```bash
ELECTRICITY_MAPS_API_KEY=your_electricity_maps_key
FRONTEND_URL=http://localhost:3000
PORT=5001
FLASK_ENV=development
```

### `flask/suggestion/.env`

```bash
EL_MAPS_API_KEY=your_electricity_maps_key
FLASK_ENV=development
```

### `flask/extension_backend/.env`

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/gaia
JWT_SECRET=replace_with_strong_secret
```

---

## Running each component

### A) Next.js web app

```bash
cd web-framework
npm run dev
npm run build
npm run start
npm run lint
```

### B) Core CO₂ Flask API

```bash
cd flask
python app.py
```

Default endpoints:

- `GET /health`
- `GET /models`
- `POST /calculate`
- `POST /batch-calculate`

### C) Carbon-aware optimization API

```bash
cd flask/suggestion
python app.py
```

Default endpoints:

- `GET /health`
- `POST /api/v1/optimize`
- `GET /api/v1/regions`
- `GET /api/v1/regions/<region>`
- `POST /api/v1/calculate`
- `POST /api/v1/compare`
- `POST /api/v1/schedule`

### D) Extension backend API

```bash
cd flask/extension_backend
python app.py
```

Sample endpoints:

- `POST /api/auth/exbackend`
- `POST /api/auth/register`
- `GET /api/auth/verify`
- `POST /api/extension/metrics`
- `GET /api/metrics/user`
- `GET /api/metrics/summary`

---

## API overview

### 1) Token impact calculation (core)

```bash
curl -X POST http://localhost:5001/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "gpt-4o-mini",
    "input_tokens": 1200,
    "output_tokens": 300,
    "cached": false,
    "cloud_provider": "gcp",
    "cloud_region": "asia-south1"
  }'
```

### 2) Optimization recommendation

```bash
curl -X POST http://localhost:5000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "workload": "training",
    "priority": "carbon",
    "duration_hours": 12
  }'
```

---

## Database notes

- The web framework and extension backend both expect a PostgreSQL connection string.
- If you use managed Postgres (Neon/Supabase/RDS), ensure SSL options match your provider.
- Keep migration/schema SQL in a dedicated folder if you expand this project (e.g. `db/migrations`).

---

## Development workflow

1. Create a feature branch.
2. Run services locally and confirm API connectivity.
3. Validate lint/build for affected modules.
4. Commit with focused messages.
5. Open PR with scope, testing notes, and deployment impact.

Suggested commit format:

```text
feat(readme): add comprehensive project documentation
```

---

## Troubleshooting

### Port conflicts
- Change ports via env vars (`PORT`, `FLASK_SERVICE_URL`, `FLASK_API_URL`) and keep all references aligned.

### CORS issues
- Confirm frontend URL is included in Flask CORS configuration.
- Verify protocol/port are exact (`http://localhost:3000` vs `https://...`).

### Auth failures
- Ensure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `JWT_SECRET` are set.
- Check callback URLs for OAuth providers.

### Empty optimization data
- Add valid Electricity Maps API key (`EL_MAPS_API_KEY` / `ELECTRICITY_MAPS_API_KEY`).
- Without API keys, services use fallback estimates.

---

## Future improvements

- Add Docker Compose to orchestrate all services.
- Add a root-level Makefile for one-command local startup.
- Add integration tests across web app ↔ Flask APIs.
- Add OpenAPI specs for both Flask services.
- Add migration tooling and schema versioning.

---

## License

No explicit license file is currently included in this repository.
If you plan to open-source or distribute the project, add a `LICENSE` file (e.g. MIT/Apache-2.0).
