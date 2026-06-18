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
├── frontend/           React single-page app
├── docs/
│   ├── API.md          REST API reference
│   └── ER_DIAGRAM.md   Database schema / ER diagram (Mermaid)
├── docker-compose.yml  One-command local stack (db + api + web)
└── README.md
```

## Features

**Functional**
- User registration, login, logout (JWT, stays signed in until logout/expiry)
- Projects: full CRUD, owner-scoped listing, status workflow
- Tasks: full CRUD under a project, "mark complete", priority & status
- Dashboard: totals for projects, tasks, completed, pending, projects in progress
- Search projects/tasks by name; filter projects by status; filter tasks by
  status and priority
- Pagination & sorting on list endpoints

**Engineering / Security**
- Passwords hashed with bcrypt; never stored or returned in responses
- JWT authentication middleware + protected routes
- Strict ownership checks — users can never read or modify other users' data
- Request validation on every endpoint (`class-validator`)
- SQL-injection-safe (Prisma parameterized queries)
- Rate limiting on login; `helmet` security headers; configurable CORS
- Centralised error handling, request logging, Swagger docs
- **Role-Based Access Control** (ADMIN/MEMBER) with guarded `/admin` routes
- **Audit logs** recording every create/update/delete with an actor and metadata

### Bonus features (all implemented)

| Bonus | Status | Notes |
| ----- | :----: | ----- |
| Docker Support | ✅ | Per-app Dockerfiles + `docker-compose` (db + api + web) |
| Unit Tests | ✅ | Jest service tests (`backend/src/**/*.spec.ts`) |
| Integration Tests | ✅ | Supertest e2e suite (`backend/test/app.e2e-spec.ts`) |
| Pagination | ✅ | `page`/`limit` on list endpoints + UI controls |
| Sorting | ✅ | `sortBy`/`sortOrder` on list endpoints |
| Audit Logs | ✅ | `audit_logs` table + `/api/audit-logs` |
| Role-Based Access Control | ✅ | `RolesGuard` + `@Roles`, admin-only `/api/admin/*` |
| CI/CD Pipeline | ✅ | GitHub Actions: lint + unit + e2e + build ([.github/workflows/ci.yml](.github/workflows/ci.yml)) |
| Application Deployment | ⚙️ | Deploy configs ready (Vercel + Render); see [Deployment](#deployment) |

---

## Quick Start

### Option A — Docker (recommended, one command)

Requires Docker Desktop.

```bash
docker compose up --build
```

This starts MySQL, runs migrations automatically, and serves:

- Frontend → http://localhost:5173
- API + Swagger docs → http://localhost:3000/api/docs

To also load demo data, in another terminal:

```bash
docker compose exec backend npx prisma db seed
```

### Option B — Run locally without Docker

**Prerequisites:** Node 20+, a running MySQL 8 instance.

**1. Backend**

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL / JWT_SECRET
npm install
npx prisma migrate dev        # creates tables
npm run db:seed               # optional demo data
npm run start:dev             # http://localhost:3000/api
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev                   # http://localhost:5173
```

### Demo credentials (after seeding)

```
Member:  demo@example.com   /  Demo@1234
Admin:   admin@example.com  /  Admin@1234   (can access /api/admin/*)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| -------- | :------: | ------- | ----------- |
| `DATABASE_URL` | ✅ | — | MySQL connection string `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | ✅ | — | Secret used to sign JWTs (use a long random value) |
| `JWT_EXPIRES_IN` |  | `1d` | Token lifetime |
| `PORT` |  | `3000` | API port |
| `CORS_ORIGIN` |  | `http://localhost:5173` | Comma-separated allowed origins |
| `GLOBAL_RATE_LIMIT` |  | `120` | Requests/min per IP (login is additionally capped at 5/min) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL of the backend API |

> **Port note:** `docker-compose` and `.env.example` map MySQL to host port
> **3307** to avoid clashing with a locally-installed MySQL on 3306. Change it
> if you prefer 3306.

---

## Database Setup

The schema is defined in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
and managed with Prisma migrations.

```bash
cd backend
npx prisma migrate dev      # apply migrations in development
npx prisma migrate deploy   # apply migrations in production
npx prisma studio           # browse data in a GUI
npm run db:seed             # insert demo user + sample projects/tasks
```

See [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) for the schema diagram and design notes.

---

## API Documentation

- **Interactive:** run the backend and open http://localhost:3000/api/docs (Swagger UI)
- **Reference:** [`docs/API.md`](docs/API.md)

Minimum endpoints implemented (plus extras like `/auth/me`,
`/tasks/:id/complete`, `/dashboard/stats`, `/audit-logs`, `/admin/users`,
`/admin/stats`, `/health`):

```
POST   /api/auth/register      GET    /api/projects
POST   /api/auth/login         GET    /api/projects/:id
POST   /api/auth/logout        POST   /api/projects
                               PUT    /api/projects/:id
GET    /api/tasks              DELETE /api/projects/:id
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

---

## Testing

```bash
cd backend
npm test            # unit tests (services, authorization, validation)
npm run test:e2e    # integration tests (HTTP + DB: auth, ownership, RBAC, audit)
```

Both suites also run automatically in CI on every push/PR via
[GitHub Actions](.github/workflows/ci.yml) (with a MySQL service container).

---

## Deployment

The app is deployment-ready for a split frontend/backend setup:

- **Frontend → Vercel.** Import the `frontend/` directory; Vercel auto-detects
  Vite. Set `VITE_API_URL` to your deployed API URL. SPA routing is handled by
  [`frontend/vercel.json`](frontend/vercel.json).
- **Backend → Render.** Use [`backend/render.yaml`](backend/render.yaml) (Blueprint),
  or a Node web service with build `npm ci && npx prisma generate && npm run build`
  and start `npx prisma migrate deploy && node dist/main`. Set `DATABASE_URL`,
  `JWT_SECRET`, and `CORS_ORIGIN` (your Vercel URL).
- **Database → managed MySQL.** e.g. Aiven or Railway free MySQL. (Neon is
  Postgres-only, so it is not used here since this project targets MySQL.)

After deploy, point the frontend's `VITE_API_URL` at the backend and the
backend's `CORS_ORIGIN` at the frontend.

---

## Design Decisions

- **NestJS + Prisma** for a modular, strongly-typed backend with DI, guards, and
  parameterized queries out of the box.
- **404 over 403** for cross-user access so the API never reveals that another
  user's resource exists.
- **Denormalised `owner_id` on tasks** for fast, join-free authorization and
  dashboard aggregation, while project ownership is still verified on task
  creation.
- **TanStack Query** on the frontend for caching, loading/error states, and
  automatic refetching after mutations.
