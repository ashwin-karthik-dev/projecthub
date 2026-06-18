import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useProjects,
  useDeleteProject,
} from '../hooks/useProjects';
import { useDebounce } from '../hooks/useDebounce';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  LoadingScreen,
  Select,
} from '../components/ui';
import { ErrorBanner } from './LoginPage';
import ProjectFormModal from '../components/ProjectFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getErrorMessage } from '../lib/api';
import {
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from '../types';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const { data, isLoading, isError, error, isFetching } = useProjects({
    search: debouncedSearch,
    status,
    page,
    limit: 9,
  });
  const deleteProject = useDeleteProject();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(project: Project) {
    setEditing(project);
    setFormOpen(true);
  }
  async function confirmDelete() {
    if (!toDelete) return;
    await deleteProject.mutateAsync(toDelete.id);
    setToDelete(null);
  }

  const meta = data?.meta;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <Button onClick={openCreate}>+ New project</Button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search projects by name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProjectStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isLoading ? (
        <LoadingScreen label="Loading projects…" />
      ) : isError ? (
        <ErrorBanner message={getErrorMessage(error)} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first project to get started."
          action={<Button onClick={openCreate}>+ New project</Button>}
        />
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
              isFetching ? 'opacity-60' : ''
            }`}
          >
            {data?.data.map((project) => (
              <div
                key={project.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600"
                  >
                    {project.name}
                  </Link>
                  <Badge
                    value={project.status}
                    label={PROJECT_STATUS_LABELS[project.status]}
                  />
                </div>
                <p className="mb-4 line-clamp-2 flex-1 text-sm text-slate-500">
                  {project.description || 'No description'}
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-400">
                    {project._count?.tasks ?? 0} task
                    {(project._count?.tasks ?? 0) === 1 ? '' : 's'}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => openEdit(project)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => setToDelete(project)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editing}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete project"
        message={`Delete "${toDelete?.name}"? This also removes all its tasks. This cannot be undone.`}
        loading={deleteProject.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
