import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import { QUERY_KEYS } from './queryKeys';
import { Goal } from '../interface';

export function useGoalsQuery(options?: Partial<UseQueryOptions<Goal[], Error>>) {
  return useQuery<Goal[], Error>({
    queryKey: QUERY_KEYS.GOALS,
    queryFn: api.getGoals,
    ...options,
  });
}
