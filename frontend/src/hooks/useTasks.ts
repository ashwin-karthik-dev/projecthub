import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  PaginatedResult,
  Task,
  TaskPriority,
  TaskStatus,
} from '../types';

export interface TaskFilters {
  projectId?: string;
  search?: string;
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  page?: number;
  limit?: number;
}

export interface TaskInput {
  name: string;
  description?: string;
  projectId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      };
      if (filters.projectId) params.projectId = filters.projectId;
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const { data } = await api.get<PaginatedResult<Task>>('/tasks', { params });
      return data;
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  qc.invalidateQueries({ queryKey: ['projects'] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaskInput) => {
      const { data } = await api.post<Task>('/tasks', input);
      return data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TaskInput }) => {
      const { data } = await api.put<Task>(`/tasks/${id}`, input);
      return data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Task>(`/tasks/${id}/complete`);
      return data;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
      return id;
    },
    onSuccess: () => invalidate(qc),
  });
}
