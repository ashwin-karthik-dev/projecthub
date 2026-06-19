# ProjectHub — Backend (NestJS API)

REST API for the Project Management System.

## Documentation

| Guide | Link |
| ----- | ---- |
| Full project setup | [docs/SETUP.md](../docs/SETUP.md) |
| Environment variables | [docs/ENVIRONMENT.md](../docs/ENVIRONMENT.md) |
| Database / Prisma | [docs/DATABASE.md](../docs/DATABASE.md) |
| API reference | [docs/API.md](../docs/API.md) |
| Interactive API docs | http://localhost:3000/api/docs |

## Quick setup

```bash
cp .env.example .env        # configure DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev      # create tables
npm run db:seed             # optional demo data
npm run start:dev           # http://localhost:3000/api
```

## Structure

```
src/
├── auth/        register/login/logout, JWT strategy & guard
├── projects/    project CRUD + search/filter
├── tasks/       task CRUD + complete + search/filter
├── dashboard/   per-user aggregate stats
├── prisma/      PrismaService (DB access)
├── common/      exception filter, logging interceptor, decorators, DTOs
├── app.module.ts
└── main.ts      bootstrap: helmet, CORS, validation, swagger, rate limiting
```

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run start:dev` | Dev server with watch |
| `npm run build` / `npm run start:prod` | Build / run compiled output |
| `npm test` | Unit tests |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:studio` | Prisma Studio GUI |
| `npm run db:seed` | Seed demo data |
