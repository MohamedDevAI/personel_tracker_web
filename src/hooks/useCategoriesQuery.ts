import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { expenseApi } from '../services/expenseApi';
import type { Category } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useCategoriesQuery(options?: Partial<UseQueryOptions<Category[], Error>>) {
  return useQuery<Category[], Error>({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: () => expenseApi.getCategories(),
    ...options,
  });
}
