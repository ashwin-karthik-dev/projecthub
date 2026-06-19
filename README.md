# ProjectHub — Project Management System

A full-stack web application for managing projects and tasks with per-user
authentication, ownership-based authorization, search/filtering, and a
statistics dashboard.

> Built for the Full Stack Developer assessment. Emphasis on clean architecture,
> security, and being easy for another developer to run.

## Tech Stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| **Frontend** | React + Vite + TypeScript, Tailwind CSS, TanStack Query, React Router, React Hook Form + Zod |
| **Backend**  | NestJS (TypeScript), Prisma ORM, Passport JWT       |
| **Database** | MySQL 8                                              |
| **Auth**     | JWT (bcrypt-hashed passwords)                        |
| **Docs**     | Swagger / OpenAPI at `/api/docs`                     |
| **Infra**    | Docker + docker-compose                              |

## Repository Layout

```
.
├── backend/            NestJS REST API (auth, projects, tasks, dashboard)
├── frontend/         React single-page app
├── docs/             Developer documentation (see below)
├── docker-compose.yml
└── README.md
```

## Documentation

| Document | Description |
| -------- | ----------- |
| **[docs/SETUP.md](docs/SETUP.md)** | **Project setup** — prerequisites, Docker vs local, troubleshooting |
| **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)** | **Environment variables** — backend, frontend, Docker, production |
| **[docs/DATABASE.md](docs/DATABASE.md)** | **Database setup** — MySQL, migrations, seed, Prisma commands |
| **[docs/API.md](docs/API.md)** | **API reference** — endpoints, auth, query params, examples |
| [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md) | Database schema / ER diagram (Mermaid) |
| http://localhost:3000/api/docs | Interactive Swagger UI (when backend is running) |

---

## Quick Start

### Option A — Docker (one command)

Requires Docker Desktop.

```bash
docker compose up --build
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:5173 |
| API + Swagger | http://localhost:3000/api/docs |

Load demo data:

```bash
docker compose exec backend npx prisma db seed
```

### Option B — Local (two terminals)

**Prerequisites:** Node 20+, MySQL 8+

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env          # edit DATABASE_URL for your MySQL port
npm install
npx prisma migrate dev
npm run db:seed
npm run start:dev

# Terminal 2 — Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

Full step-by-step instructions, port notes, and troubleshooting:
**[docs/SETUP.md](docs/SETUP.md)**

### Demo credentials (after seeding)

| Role | Email | Password |
| ---- | ----- | -------- |
| Member | `demo@example.com` | `Demo@1234` |
| Admin | `admin@example.com` | `Admin@1234` |

---

## Features

**Functional**
- User registration, login, logout (JWT)
- Projects & tasks: full CRUD, search, filter, pagination, sorting
- Dashboard statistics
- Audit logs and RBAC (ADMIN / MEMBER)

**Engineering / Security**
- bcrypt passwords, JWT auth, ownership checks, input validation
- Prisma (SQL-injection safe), rate limiting, helmet, CORS
- Unit tests, e2e tests, GitHub Actions CI

See [docs/API.md](docs/API.md) for the full endpoint list.

---

## Testing

```bash
cd backend
npm test            # unit tests
npm run test:e2e    # integration tests
```

---

## Deployment

- **Frontend → Vercel** (`frontend/`, set `VITE_API_URL`)
- **Backend → Render** (`backend/render.yaml`, set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`)
- **Database → managed MySQL** (Aiven, Railway, etc.)

Details in [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md#production-deployment).

---

## Design Decisions

- **NestJS + Prisma** for modular, typed backend with guards and parameterized queries.
- **404 over 403** for cross-user access so resource existence is not disclosed.
- **Denormalised `owner_id` on tasks** for fast authorization and dashboard aggregation.
- **TanStack Query** on the frontend for caching and mutation refetching.
