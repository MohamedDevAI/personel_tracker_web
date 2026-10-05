import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { plannedRepayCreditApi } from '../services/plannedRepayCreditApi';
import { QUERY_KEYS } from './queryKeys';
import { PlannedRepayCreditItem, PlannedRepayCreditMatrix } from '../interface';

export function usePlannedRepayCreditMatrixQuery(
  options?: Partial<UseQueryOptions<PlannedRepayCreditMatrix, Error>>
) {
  return useQuery<PlannedRepayCreditMatrix, Error>({
    queryKey: QUERY_KEYS.PLANNED_REPAY_CREDIT_MATRIX,
    queryFn: plannedRepayCreditApi.getMatrix,
    staleTime: 1000 * 30,
    ...options,
  });
}

export function usePlannedRepayCreditItemsQuery(
  options?: Partial<UseQueryOptions<PlannedRepayCreditItem[], Error>>
) {
  return useQuery<PlannedRepayCreditItem[], Error>({
    queryKey: QUERY_KEYS.PLANNED_REPAY_CREDIT_ITEMS,
    queryFn: plannedRepayCreditApi.getAll,
    ...options,
  });
}
