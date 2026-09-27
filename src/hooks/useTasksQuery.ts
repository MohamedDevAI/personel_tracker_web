import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import type { TaskItem } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useTasksQuery(options?: Partial<UseQueryOptions<TaskItem[], Error>>) {
  return useQuery<TaskItem[], Error>({
    queryKey: QUERY_KEYS.TASKS,
    queryFn: api.getTasks,
    ...options,
  });
}
