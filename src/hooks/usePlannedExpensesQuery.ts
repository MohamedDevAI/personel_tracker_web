import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { plannedExpenseApi } from '../services/plannedExpenseApi';
import { QUERY_KEYS } from './queryKeys';
import { PlannedExpense } from '../interface';

export function usePlannedExpensesQuery(
  month?: string,
  year?: number,
  options?: Partial<UseQueryOptions<PlannedExpense[], Error>>
) {
  return useQuery<PlannedExpense[], Error>({
    queryKey: QUERY_KEYS.PLANNED_EXPENSES(month, year),
    queryFn: () => plannedExpenseApi.fetchFromDb(month, year),
    ...options,
  });
}
