# Environment Variable Documentation

All secrets and service URLs are configured via `.env` files. **Never commit
real `.env` files** — they are gitignored. Copy from `.env.example` in each
package.

---

## Backend (`backend/.env`)

Create from the template:

```bash
cd backend
cp .env.example .env
```

### `DATABASE_URL` (required)

MySQL connection string used by Prisma.

**Format:**

```
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

**Examples:**

| Scenario | Example |
| -------- | ------- |
| Docker Compose (MySQL on host 3307) | `mysql://root:password@localhost:3307/pms` |
| Local MySQL (default port 3306) | `mysql://root:password@localhost:3306/pms` |
| Docker network (backend container) | `mysql://root:password@db:3306/pms` |

| Property | Value in this project |
| -------- | --------------------- |
| User | `root` (Docker default) |
| Password | `password` (Docker default — change in production) |
| Database name | `pms` |

**Special characters in password:** URL-encode them in the connection string
(e.g. `@` → `%40`, `#` → `%23`).

---

### `JWT_SECRET` (required)

Secret key for signing JWT access tokens. Use a long random value in production:

```bash
openssl rand -hex 32
```

If missing or weak, tokens are insecure.

---

### `JWT_EXPIRES_IN` (optional)

Token lifetime passed to `jsonwebtoken`. Default in code: `1d`.

Examples: `1h`, `7d`, `3600` (seconds).

---

### `PORT` (optional)

HTTP port for the NestJS API. Default: `3000`.

---

### `CORS_ORIGIN` (optional)

Comma-separated list of allowed browser origins for cross-origin requests from
the React dev server or deployed frontend.

**Default:** `http://localhost:5173`

**Multiple origins** (common when Vite uses another port):

```env
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
```

**Production example:**

```env
CORS_ORIGIN="https://your-app.vercel.app"
```

Rules:

- Include the full origin: scheme + host + port (no trailing path).
- Restart the backend after changes.

---

### `GLOBAL_RATE_LIMIT` (optional)

Maximum requests per minute per IP for the global throttler. Default: `120`.

The login endpoint has an additional hard cap of **5 requests/minute** in code
to reduce brute-force attempts.

---

### Backend `.env` reference table

| Variable | Required | Default | Description |
| -------- | :------: | ------- | ----------- |
| `DATABASE_URL` | Yes | — | Prisma MySQL connection URL |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `1d` | Access token expiry |
| `PORT` | No | `3000` | API listen port |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin(s) |
| `GLOBAL_RATE_LIMIT` | No | `120` | Global rate limit (req/min/IP) |

### Example `backend/.env` (local development)

```env
DATABASE_URL="mysql://root:password@localhost:3306/pms"
JWT_SECRET="dev-only-change-me-use-openssl-rand-hex-32-in-prod"
JWT_EXPIRES_IN="1d"
PORT=3000
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
GLOBAL_RATE_LIMIT=120
```

---

## Frontend (`frontend/.env`)

Create from the template:

```bash
cd frontend
cp .env.example .env
```

### `VITE_API_URL`

Base URL of the backend API **including** the `/api` prefix.

| Environment | Value |
| ----------- | ----- |
| Local dev | `http://localhost:3000/api` |
| Production | `https://your-api.onrender.com/api` |

**Notes:**

- Only variables prefixed with `VITE_` are exposed to the browser.
- Rebuild or restart `npm run dev` after changing this value.
- Must match where the NestJS API is actually running.

### Frontend reference table

| Variable | Required | Default | Description |
| -------- | :------: | ------- | ----------- |
| `VITE_API_URL` | No* | `http://localhost:3000/api` | Backend API base URL |

\*Not required if the default matches your setup; the app falls back to
`http://localhost:3000/api` in code when unset.

### Example `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Docker Compose (inline environment)

`docker-compose.yml` sets these for containers (not your local `.env`):

| Service | Key variables |
| ------- | ------------- |
| `db` | `MYSQL_ROOT_PASSWORD=password`, `MYSQL_DATABASE=pms` |
| `backend` | `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, etc. |
| `frontend` | Built with `VITE_API_URL=http://localhost:3000/api` |

To change Docker defaults, edit `docker-compose.yml` and rebuild:

```bash
docker compose up --build
```

---

## Production deployment

| Platform | Variables to set |
| -------- | ---------------- |
| **Render** (backend) | `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, optional `PORT` |
| **Vercel** (frontend) | `VITE_API_URL` |

See `backend/render.yaml` and `frontend/vercel.json` for deploy hints.

**Checklist:**

1. Strong `JWT_SECRET` and database password.
2. `CORS_ORIGIN` = your frontend URL only.
3. `VITE_API_URL` = your backend URL + `/api`.
4. Run `npx prisma migrate deploy` on the production database before first deploy.

---

## Security notes

- Do not commit `.env` files or database credentials.
- Do not use Docker demo passwords (`password`) in production.
- Rotate `JWT_SECRET` if leaked (all existing tokens become invalid).
