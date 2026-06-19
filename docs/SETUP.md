# Project Setup Instructions

This guide walks a new developer through running ProjectHub locally from a
fresh clone. For environment variables see [ENVIRONMENT.md](ENVIRONMENT.md).
For MySQL and migrations see [DATABASE.md](DATABASE.md). For REST endpoints see
[API.md](API.md).

---

## Prerequisites

| Tool | Version | Notes |
| ---- | ------- | ----- |
| **Node.js** | 20+ | Required for backend and frontend |
| **npm** | 9+ | Ships with Node |
| **MySQL** | 8+ | Only if you run without Docker |
| **Docker Desktop** | latest | Only for the one-command Docker option |

Verify Node:

```bash
node -v    # v20.x or higher
npm -v
```

---

## Repository layout

```
.
├── backend/          NestJS API + Prisma
├── frontend/         React + Vite SPA
├── docs/             Documentation (this folder)
├── docker-compose.yml
└── README.md
```

---

## Option A — Docker (recommended)

Best when you do not have MySQL installed locally. Everything runs in
containers.

### 1. Start the stack

From the repository root:

```bash
docker compose up --build
```

This will:

- Start MySQL 8 on host port **3307** (mapped from container 3306)
- Build and start the NestJS API on port **3000**
- Build and serve the React app via nginx on port **5173**
- Run `prisma migrate deploy` before the API starts

### 2. Open the app

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger (interactive API docs) | http://localhost:3000/api/docs |
| Health check | http://localhost:3000/api/health |

### 3. Load demo data (optional)

In a second terminal:

```bash
docker compose exec backend npx prisma db seed
```

### 4. Stop

```bash
docker compose down
```

To also remove the database volume:

```bash
docker compose down -v
```

---

## Option B — Local development (two terminals)

Best for day-to-day coding with hot reload. Requires a running MySQL instance.

### Step 1 — MySQL

Create the database and ensure MySQL is reachable. See [DATABASE.md](DATABASE.md)
for full instructions (local install vs Docker-only DB).

Quick check:

```bash
# Example: local MySQL on default port 3306
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pms;"
```

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

- Set `DATABASE_URL` to match your MySQL host/port (see [ENVIRONMENT.md](ENVIRONMENT.md))
- Set a strong `JWT_SECRET` for local dev

```bash
npm install
npx prisma migrate dev    # creates tables
npm run db:seed           # demo user + sample projects/tasks
npm run start:dev         # API at http://localhost:3000/api
```

Confirm the API is up:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"..."}
```

### Step 3 — Frontend (second terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite prints the local URL (usually http://localhost:5173). If 5173 is in use,
Vite picks the next free port (e.g. **5174**).

If the frontend port is not 5173, add it to `CORS_ORIGIN` in `backend/.env`:

```env
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
```

Restart the backend after changing CORS.

### Step 4 — Log in

After seeding, use the demo accounts:

| Role | Email | Password |
| ---- | ----- | -------- |
| Member | `demo@example.com` | `Demo@1234` |
| Admin | `admin@example.com` | `Admin@1234` |

Type the password manually if browser autofill fails. Passwords are case-sensitive.

---

## Demo credentials

| Role | Email | Password | Access |
| ---- | ----- | -------- | ------ |
| Member | `demo@example.com` | `Demo@1234` | Projects, tasks, dashboard |
| Admin | `admin@example.com` | `Admin@1234` | Same + `/api/admin/*` |

Re-seed anytime to reset passwords and sample data:

```bash
cd backend && npm run db:seed
```

---

## Running tests

```bash
cd backend
npm test              # unit tests
npm run test:e2e      # integration tests (needs DATABASE_URL)
```

CI runs the same suites on every push via GitHub Actions.

---

## Troubleshooting

### `Invalid email or password` on login

- Backend and frontend **are connected** — this is an auth failure, not MySQL.
- Re-run `npm run db:seed` in `backend/`.
- Type `Demo@1234` manually (capital **D**, `@`, numbers).
- Check the backend log for `POST /api/auth/login -> 401`.

### `EADDRINUSE` on port 3000 or 5173

Another process is using the port. On Windows PowerShell:

```powershell
netstat -ano | findstr ":3000"
# Then end the PID or close the other terminal running the server.
```

### Frontend cannot reach API (network / CORS errors)

- Backend must be running at `http://localhost:3000`.
- `frontend/.env` → `VITE_API_URL=http://localhost:3000/api`
- `backend/.env` → `CORS_ORIGIN` must include the exact frontend origin
  (scheme + host + port), e.g. `http://localhost:5174`.

### Prisma / database connection errors

- Confirm MySQL is running and `DATABASE_URL` host/port/user/password match.
- Docker stack uses port **3307** on the host; local MySQL often uses **3306**.
- See [DATABASE.md](DATABASE.md).

### Docker: `docker compose` fails to start

- Ensure Docker Desktop is running.
- Port conflicts: stop local MySQL or change ports in `docker-compose.yml`.

---

## Next steps

- [Environment variables](ENVIRONMENT.md)
- [Database setup](DATABASE.md)
- [API reference](API.md)
- [ER diagram / schema](ER_DIAGRAM.md)
- Interactive docs: http://localhost:3000/api/docs (when backend is running)
