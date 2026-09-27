import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { expenseApi } from '../services/expenseApi';
import type { DashboardSummary } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useDashboardSummaryQuery(options?: Partial<UseQueryOptions<DashboardSummary, Error>>) {
  return useQuery<DashboardSummary, Error>({
    queryKey: QUERY_KEYS.DASHBOARD_SUMMARY(),
    queryFn: expenseApi.getDashboardSummary,
    ...options,
  });
}
