import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from './queryKeys';
import { Habit } from '../interface';

export function useHabitsQuery(options?: Partial<UseQueryOptions<Habit[], Error>>) {
  return useQuery<Habit[], Error>({
    queryKey: QUERY_KEYS.HABITS,
    queryFn: api.getHabits,
    ...options,
  });
}
