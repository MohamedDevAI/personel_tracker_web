import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Habit } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useHabitsQuery(options?: Partial<UseQueryOptions<Habit[], Error>>) {
  return useQuery<Habit[], Error>({
    queryKey: QUERY_KEYS.HABITS,
    queryFn: api.getHabits,
    ...options,
  });
}
