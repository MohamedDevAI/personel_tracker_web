import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Expense } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useExpensesQuery(options?: Partial<UseQueryOptions<Expense[], Error>>) {
  return useQuery<Expense[], Error>({
    queryKey: QUERY_KEYS.EXPENSES,
    queryFn: api.getExpenses,
    ...options,
  });
}
