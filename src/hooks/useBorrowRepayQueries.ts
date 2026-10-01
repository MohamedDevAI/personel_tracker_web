import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { borrowRepayApi } from '../services/borrowRepayApi';
import { QUERY_KEYS } from './queryKeys';
import { BorrowRepayRecord, PlannedRepayment } from '../interface';

export function useBorrowRepayRecordsQuery(
  options?: Partial<UseQueryOptions<BorrowRepayRecord[], Error>>
) {
  return useQuery<BorrowRepayRecord[], Error>({
    queryKey: QUERY_KEYS.BORROW_REPAY_RECORDS,
    queryFn: borrowRepayApi.getRecords,
    ...options,
  });
}

export function usePlannedRepaymentsQuery(
  options?: Partial<UseQueryOptions<PlannedRepayment[], Error>>
) {
  return useQuery<PlannedRepayment[], Error>({
    queryKey: QUERY_KEYS.PLANNED_REPAYMENTS,
    queryFn: borrowRepayApi.getPlannedRepayments,
    ...options,
  });
}
