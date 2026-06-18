# API Documentation

Base URL: `http://localhost:3000/api` (all routes are prefixed with `/api`).

Interactive Swagger/OpenAPI docs are served live at **`/api/docs`** when the
backend is running.

## Authentication

The API uses **JWT bearer tokens**. Register or log in to receive an
`accessToken`, then send it on every protected request:

```
Authorization: Bearer <accessToken>
```

Tokens expire after `JWT_EXPIRES_IN` (default `1d`). All endpoints except
`/auth/register`, `/auth/login`, and `/health` require authentication.

### Standard error shape

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["Email address is required"],
  "path": "/api/auth/register",
  "timestamp": "2026-06-18T14:00:00.000Z"
}
```

---

## Auth

### `POST /auth/register`

```json
// request
{ "fullName": "Ada Lovelace", "email": "ada@example.com", "password": "StrongP@ss1" }
// 201 response
{ "user": { "id": "...", "fullName": "Ada Lovelace", "email": "ada@example.com", "role": "MEMBER", "createdAt": "..." }, "accessToken": "ey..." }
```

### `POST /auth/login`

Rate limited to **5 requests/minute per IP**.

```json
// request
{ "email": "ada@example.com", "password": "StrongP@ss1" }
// 200 response  -> same shape as register
```

### `POST /auth/logout`  _(auth required)_

JWT is stateless, so logout is handled client-side by discarding the token.
Returns `{ "message": "Logged out successfully" }`.

### `GET /auth/me`  _(auth required)_

Returns the current user `{ id, fullName, email, createdAt }`.

---

## Projects  _(all auth required, scoped to the current user)_

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/projects` | List own projects (paginated) |
| GET    | `/projects/:id` | Get one project |
| POST   | `/projects` | Create a project |
| PUT    | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project (and its tasks) |

**Query params for `GET /projects`:**

| Param | Type | Notes |
| ----- | ---- | ----- |
| `search` | string | matches project name (contains) |
| `status` | enum | `NOT_STARTED \| IN_PROGRESS \| COMPLETED` |
| `sortBy` | enum | `name \| createdAt \| startDate \| endDate \| status` (default `createdAt`) |
| `sortOrder` | enum | `asc \| desc` (default `desc`) |
| `page` | int | default `1` |
| `limit` | int | default `10`, max `100` |

**Create/Update body:**

```json
{
  "name": "Website Redesign",
  "description": "Revamp the marketing site",
  "status": "IN_PROGRESS",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-03-01T00:00:00.000Z"
}
```

**Paginated list response:**

```json
{
  "data": [ { "id": "...", "name": "...", "status": "IN_PROGRESS", "_count": { "tasks": 3 } } ],
  "meta": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }
}
```

---

## Tasks  _(all auth required, scoped to the current user)_

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/tasks` | List own tasks (filter/paginate) |
| GET    | `/tasks/:id` | Get one task |
| POST   | `/tasks` | Create a task under a project |
| PUT    | `/tasks/:id` | Update a task |
| PATCH  | `/tasks/:id/complete` | Mark a task completed |
| DELETE | `/tasks/:id` | Delete a task |

**Query params for `GET /tasks`:**

| Param | Type | Notes |
| ----- | ---- | ----- |
| `projectId` | uuid | filter to one project |
| `search` | string | matches task name |
| `status` | enum | `PENDING \| IN_PROGRESS \| COMPLETED` |
| `priority` | enum | `LOW \| MEDIUM \| HIGH` |
| `sortBy` | enum | `name \| createdAt \| dueDate \| priority \| status` |
| `sortOrder` | enum | `asc \| desc` |
| `page` / `limit` | int | pagination |

**Create body** (`projectId` required on create, immutable on update):

```json
{
  "name": "Design homepage",
  "description": "Use the new brand palette",
  "projectId": "<project-uuid>",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-02-15T00:00:00.000Z"
}
```

---

## Dashboard  _(auth required)_

### `GET /dashboard/stats`

Aggregates scoped to the authenticated user.

```json
{
  "totalProjects": 2,
  "totalTasks": 5,
  "completedTasks": 1,
  "pendingTasks": 3,
  "projectsInProgress": 1
}
```

---

## Audit Logs  _(auth required)_

### `GET /audit-logs`

Returns an append-only trail of create/update/delete actions. Members see only
their own actions; **admins** see everyone's and may filter by `userId`.

**Query params:** `entity` (`PROJECT | TASK`), `action` (`CREATE | UPDATE | DELETE`),
`userId` (admins only), `page`, `limit`.

```json
{
  "data": [
    { "id": "...", "action": "CREATE", "entity": "PROJECT", "entityId": "...", "metadata": { "name": "Website Redesign" }, "userId": "...", "createdAt": "..." }
  ],
  "meta": { "total": 4, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

## Admin  _(auth required + `ADMIN` role)_

Protected by `JwtAuthGuard` **and** `RolesGuard`. A non-admin receives `403`.

### `GET /admin/users`

Lists all users with their project/task counts.

### `GET /admin/stats`

Platform-wide totals: `{ "totalUsers": n, "totalProjects": n, "totalTasks": n }`.

---

## Health

### `GET /health`

```json
{ "status": "ok", "timestamp": "2026-06-18T14:00:00.000Z" }
```

## Security highlights

- Passwords hashed with **bcrypt** (cost 12); never stored or returned.
- **JWT** auth via Passport; protected routes guarded globally per controller.
- **Ownership enforced** on every project/task — accessing another user's
  resource returns `404` (existence is not disclosed).
- **Input validation** with `class-validator` (`whitelist` + `forbidNonWhitelisted`).
- **SQL injection** prevented by Prisma's parameterized queries.
- **helmet** security headers, configurable **CORS**, and **rate limiting**.
- **Role-Based Access Control** — `ADMIN` vs `MEMBER`; `/admin/*` routes guarded.
- **Audit logging** — create/update/delete actions are recorded per user.
