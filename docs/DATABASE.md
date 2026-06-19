# Database Setup Instructions

ProjectHub uses **MySQL 8** with **Prisma** for schema management and queries.
The authoritative schema is
[`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma).

---

## Overview

| Item | Location |
| ---- | -------- |
| Schema definition | `backend/prisma/schema.prisma` |
| SQL migrations | `backend/prisma/migrations/` |
| Seed script | `backend/prisma/seed.ts` |
| ER diagram | [ER_DIAGRAM.md](ER_DIAGRAM.md) |

**Tables:** `users`, `projects`, `tasks`, `audit_logs`

---

## Choose your MySQL setup

### A — Docker only (easiest)

Use the full stack or DB-only from `docker-compose.yml`:

```bash
docker compose up --build
```

MySQL is exposed on host port **3307** → container **3306**:

```env
DATABASE_URL="mysql://root:password@localhost:3307/pms"
```

The `pms` database is created automatically via `MYSQL_DATABASE=pms`.

### B — Local MySQL install

Install MySQL 8+ (or 9.x) and ensure the server is running.

**Windows:** MySQL Installer or `MySQL96` / `MySQL80` Windows service.

**macOS:** `brew install mysql` → `brew services start mysql`

**Linux:** `sudo apt install mysql-server`

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS pms;
```

Connection string (typical):

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/pms"
```

### C — Docker MySQL only (API runs locally)

Run just the database container:

```bash
docker compose up db
```

Use `DATABASE_URL` with port **3307** as in option A.

---

## Apply schema (migrations)

From `backend/` with `DATABASE_URL` set in `.env`:

### Development (creates migration history locally)

```bash
cd backend
npx prisma migrate dev
```

Creates tables and applies all migrations in `prisma/migrations/`.

### Production / CI

```bash
npx prisma migrate deploy
```

Does not create new migrations — only applies existing ones.

### Generate Prisma Client (after schema changes)

```bash
npx prisma generate
```

`npm install` and Docker build run this automatically.

---

## Seed demo data

Inserts demo users, sample projects, and tasks:

```bash
cd backend
npm run db:seed
```

| User | Email | Password | Role |
| ---- | ----- | -------- | ---- |
| Demo | `demo@example.com` | `Demo@1234` | MEMBER |
| Admin | `admin@example.com` | `Admin@1234` | ADMIN |

Re-running the seed is safe: it upserts users (resets passwords) and rebuilds
demo projects/tasks for the demo user.

**Docker:**

```bash
docker compose exec backend npx prisma db seed
```

---

## Browse data (Prisma Studio)

GUI to inspect and edit rows:

```bash
cd backend
npm run prisma:studio
```

Opens http://localhost:5555 by default.

---

## Common Prisma commands

| Command | Purpose |
| ------- | ------- |
| `npx prisma migrate dev` | Apply migrations in dev |
| `npx prisma migrate deploy` | Apply migrations in prod/CI |
| `npx prisma migrate status` | Show migration state |
| `npx prisma db seed` | Run seed script |
| `npx prisma studio` | Open data browser |
| `npx prisma validate` | Validate schema file |

---

## Port reference

| Setup | MySQL host port | `DATABASE_URL` port |
| ----- | --------------- | ------------------- |
| Docker Compose (`docker-compose.yml`) | **3307** | `3307` |
| Local MySQL default | **3306** | `3306` |
| Inside Docker network (`db` service) | 3306 (internal) | `3306` with host `db` |

Using the wrong port is the most common connection failure when switching
between Docker and local MySQL.

---

## Troubleshooting

### `P1001: Can't reach database server`

- MySQL is not running.
- Wrong host or port in `DATABASE_URL`.
- Firewall blocking the port.

**Check MySQL is listening:**

```bash
# Windows PowerShell
Test-NetConnection localhost -Port 3306
```

### `P1000: Authentication failed`

- Wrong username or password in `DATABASE_URL`.
- User does not have access to the `pms` database.

**Grant access (as root):**

```sql
CREATE USER IF NOT EXISTS 'pms'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON pms.* TO 'pms'@'localhost';
FLUSH PRIVILEGES;
```

Then use:

```env
DATABASE_URL="mysql://pms:your_password@localhost:3306/pms"
```

### `P3009` / migration failed

Reset dev database (⚠️ deletes all data):

```bash
npx prisma migrate reset
```

This drops the database, reapplies migrations, and runs the seed.

### Lost MySQL root password (Windows)

If you cannot log in as `root`, use an init-file reset. This repo includes:

- `mysql_reset.sql` — sets `root@localhost` password to `password`
- `fix_mysql.bat` — Windows script to stop service, reset, and create `pms`

Run `fix_mysql.bat` as Administrator, then update `DATABASE_URL` to match.

### Tables exist but login fails

Run the seed to ensure demo users exist with known passwords:

```bash
npm run db:seed
```

---

## Schema changes (for contributors)

1. Edit `backend/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name describe_your_change`.
3. Commit the new folder under `prisma/migrations/`.
4. Update [ER_DIAGRAM.md](ER_DIAGRAM.md) if the model changed.

---

## CI / testing database

GitHub Actions uses a MySQL 8 service container:

```env
DATABASE_URL=mysql://root:password@127.0.0.1:3306/pms_test
```

See `.github/workflows/ci.yml`.
