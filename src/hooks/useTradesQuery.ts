import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { tradingService } from '../services/tradingService';
import type { Trade } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useTradesQuery(options?: Partial<UseQueryOptions<Trade[], Error>>) {
  return useQuery<Trade[], Error>({
    queryKey: QUERY_KEYS.TRADES,
    queryFn: tradingService.getTrades,
    ...options,
  });
}
