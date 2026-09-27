import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { expenseApi } from '../services/expenseApi';
import type { Transaction } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useTransactionsQuery(
  options?: Partial<UseQueryOptions<Transaction[], Error>>
) {
  return useQuery<Transaction[], Error>({
    queryKey: QUERY_KEYS.TRANSACTIONS(),
    queryFn: expenseApi.getTransactions,
    ...options,
  });
}
