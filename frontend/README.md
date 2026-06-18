# ProjectHub — Frontend (React + Vite)

Single-page app for the Project Management System. See the
[root README](../README.md) for the full overview.

## Setup

```bash
cp .env.example .env        # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev                 # http://localhost:5173
```

The backend must be running for the app to work.

## Structure

```
src/
├── pages/        Login, Register, Dashboard, Projects, ProjectDetail
├── components/   Layout, ProtectedRoute, form modals, ConfirmDialog, ui.tsx
├── hooks/        useProjects, useTasks, useDashboard, useDebounce (TanStack Query)
├── context/      AuthContext (session + login/register/logout)
├── lib/          axios instance with JWT interceptor + error helpers
├── types/        shared TypeScript types & enum labels
├── App.tsx       routes
└── main.tsx      providers (Router, QueryClient, Auth)
```

## Scripts

| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
