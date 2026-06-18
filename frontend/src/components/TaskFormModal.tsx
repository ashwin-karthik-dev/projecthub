import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal, Select, Textarea } from './ui';
import { ErrorBanner } from '../pages/LoginPage';
import {
  useCreateTask,
  useUpdateTask,
  type TaskInput,
} from '../hooks/useTasks';
import { getErrorMessage } from '../lib/api';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../types';

const schema = z.object({
  name: z.string().min(1, 'Task name is required').max(150),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

export default function TaskFormModal({
  open,
  onClose,
  projectId,
  task,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task | null;
}) {
  const editing = Boolean(task);
  const create = useCreateTask();
  const update = useUpdateTask();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: task?.name ?? '',
      description: task?.description ?? '',
      priority: (task?.priority ?? 'MEDIUM') as TaskPriority,
      status: (task?.status ?? 'PENDING') as TaskStatus,
      dueDate: toDateInput(task?.dueDate ?? null),
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError('');
    const base: TaskInput = {
      name: values.name,
      description: values.description || undefined,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    };
    try {
      if (editing && task) {
        await update.mutateAsync({ id: task.id, input: base });
      } else {
        await create.mutateAsync({ ...base, projectId });
      }
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <ErrorBanner message={serverError} />}
        <Input label="Task name" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Description"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Priority" {...register('priority')}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select label="Status" {...register('status')}>
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Due date" type="date" {...register('dueDate')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
