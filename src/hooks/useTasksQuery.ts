import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from './queryKeys';
import { TaskItem } from '../interface';

export function useTasksQuery(options?: Partial<UseQueryOptions<TaskItem[], Error>>) {
  return useQuery<TaskItem[], Error>({
    queryKey: QUERY_KEYS.TASKS,
    queryFn: api.getTasks,
    ...options,
  });
}
