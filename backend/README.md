# ProjectHub — Backend (NestJS API)

REST API for the Project Management System. See the [root README](../README.md)
for the full project overview, and [`docs/API.md`](../docs/API.md) for endpoint
details.

## Setup

```bash
cp .env.example .env        # configure DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev      # create tables
npm run db:seed             # optional demo data
npm run start:dev           # http://localhost:3000/api
```

Swagger docs: http://localhost:3000/api/docs

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
