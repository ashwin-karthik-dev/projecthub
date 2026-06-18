import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProject, useDeleteProject } from '../hooks/useProjects';
import {
  useTasks,
  useCompleteTask,
  useDeleteTask,
} from '../hooks/useTasks';
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
import TaskFormModal from '../components/TaskFormModal';
import ProjectFormModal from '../components/ProjectFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getErrorMessage } from '../lib/api';
import {
  PROJECT_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../types';

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : '—';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const debouncedSearch = useDebounce(search);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false);

  const projectQuery = useProject(id);
  const tasksQuery = useTasks({
    projectId: id,
    search: debouncedSearch,
    status,
    priority,
  });
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const deleteProject = useDeleteProject();

  if (projectQuery.isLoading) return <LoadingScreen label="Loading project…" />;
  if (projectQuery.isError)
    return <ErrorBanner message={getErrorMessage(projectQuery.error)} />;

  const project = projectQuery.data!;

  function openCreateTask() {
    setEditingTask(null);
    setTaskFormOpen(true);
  }
  function openEditTask(task: Task) {
    setEditingTask(task);
    setTaskFormOpen(true);
  }
  async function confirmDeleteProject() {
    await deleteProject.mutateAsync(project.id);
    navigate('/projects');
  }

  return (
    <div>
      <Link to="/projects" className="text-sm text-brand-600 hover:underline">
        ← Back to projects
      </Link>

      {/* Project header */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <Badge
                value={project.status}
                label={PROJECT_STATUS_LABELS[project.status]}
              />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              {project.description || 'No description'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setProjectFormOpen(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmProjectDelete(true)}>
              Delete
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
          <Meta label="Start date" value={formatDate(project.startDate)} />
          <Meta label="End date" value={formatDate(project.endDate)} />
          <Meta label="Created" value={formatDate(project.createdAt)} />
        </div>
      </div>

      {/* Tasks */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Tasks</h2>
        <Button onClick={openCreateTask}>+ New task</Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search tasks by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
          >
            <option value="">All statuses</option>
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-44">
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
          >
            <option value="">All priorities</option>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {tasksQuery.isLoading ? (
          <LoadingScreen label="Loading tasks…" />
        ) : tasksQuery.isError ? (
          <ErrorBanner message={getErrorMessage(tasksQuery.error)} />
        ) : tasksQuery.data && tasksQuery.data.data.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Add a task to start tracking work on this project."
            action={<Button onClick={openCreateTask}>+ New task</Button>}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasksQuery.data?.data.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{task.name}</p>
                      {task.description && (
                        <p className="text-xs text-slate-400">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        value={task.priority}
                        label={TASK_PRIORITY_LABELS[task.priority]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        value={task.status}
                        label={TASK_STATUS_LABELS[task.status]}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {task.status !== 'COMPLETED' && (
                          <Button
                            variant="ghost"
                            onClick={() => completeTask.mutate(task.id)}
                          >
                            Complete
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => openEditTask(task)}>
                          Edit
                        </Button>
                        <Button variant="ghost" onClick={() => setTaskToDelete(task)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {id && (
        <TaskFormModal
          open={taskFormOpen}
          onClose={() => setTaskFormOpen(false)}
          projectId={id}
          task={editingTask}
        />
      )}
      <ProjectFormModal
        open={projectFormOpen}
        onClose={() => setProjectFormOpen(false)}
        project={project}
      />
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task"
        message={`Delete "${taskToDelete?.name}"? This cannot be undone.`}
        loading={deleteTask.isPending}
        onConfirm={async () => {
          if (taskToDelete) await deleteTask.mutateAsync(taskToDelete.id);
          setTaskToDelete(null);
        }}
        onClose={() => setTaskToDelete(null)}
      />
      <ConfirmDialog
        open={confirmProjectDelete}
        title="Delete project"
        message={`Delete "${project.name}" and all its tasks? This cannot be undone.`}
        loading={deleteProject.isPending}
        onConfirm={confirmDeleteProject}
        onClose={() => setConfirmProjectDelete(false)}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-700">{value}</p>
    </div>
  );
}
