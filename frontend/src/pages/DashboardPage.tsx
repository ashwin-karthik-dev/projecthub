import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { LoadingScreen } from '../components/ui';
import { ErrorBanner } from './LoginPage';
import { getErrorMessage } from '../lib/api';

const cards: {
  key: keyof import('../types').DashboardStats;
  label: string;
  accent: string;
}[] = [
  { key: 'totalProjects', label: 'Total Projects', accent: 'text-brand-600' },
  { key: 'projectsInProgress', label: 'Projects In Progress', accent: 'text-blue-600' },
  { key: 'totalTasks', label: 'Total Tasks', accent: 'text-slate-700' },
  { key: 'completedTasks', label: 'Completed Tasks', accent: 'text-green-600' },
  { key: 'pendingTasks', label: 'Pending Tasks', accent: 'text-amber-600' },
];

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

  if (isLoading) return <LoadingScreen label="Loading dashboard…" />;
  if (isError) return <ErrorBanner message={getErrorMessage(error)} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Your projects and tasks at a glance</p>
        </div>
        <Link
          to="/projects"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          View projects
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${c.accent}`}>
              {data?.[c.key] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
