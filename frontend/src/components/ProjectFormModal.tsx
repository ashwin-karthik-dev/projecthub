import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal, Select, Textarea } from './ui';
import { ErrorBanner } from '../pages/LoginPage';
import {
  useCreateProject,
  useUpdateProject,
  type ProjectInput,
} from '../hooks/useProjects';
import { getErrorMessage } from '../lib/api';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../types';

const schema = z
  .object({
    name: z.string().min(1, 'Project name is required').max(150),
    description: z.string().max(2000).optional(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (v) => !v.startDate || !v.endDate || v.startDate <= v.endDate,
    { message: 'Start date must be before end date', path: ['endDate'] },
  );
type FormValues = z.infer<typeof schema>;

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

export default function ProjectFormModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
}) {
  const editing = Boolean(project);
  const create = useCreateProject();
  const update = useUpdateProject();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: (project?.status ?? 'NOT_STARTED') as ProjectStatus,
      startDate: toDateInput(project?.startDate ?? null),
      endDate: toDateInput(project?.endDate ?? null),
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError('');
    const input: ProjectInput = {
      name: values.name,
      description: values.description || undefined,
      status: values.status,
      startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
    };
    try {
      if (editing && project) {
        await update.mutateAsync({ id: project.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit project' : 'New project'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <ErrorBanner message={serverError} />}
        <Input label="Project name" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Description"
          error={errors.description?.message}
          {...register('description')}
        />
        <Select label="Status" error={errors.status?.message} {...register('status')}>
          {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" {...register('startDate')} />
          <Input
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
