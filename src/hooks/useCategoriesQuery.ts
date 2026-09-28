import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { expenseApi } from '../services/expenseApi';
import { QUERY_KEYS } from './queryKeys';
import { Category } from '../interface';

export function useCategoriesQuery(options?: Partial<UseQueryOptions<Category[], Error>>) {
  return useQuery<Category[], Error>({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: () => expenseApi.getCategories(),
    ...options,
  });
}
