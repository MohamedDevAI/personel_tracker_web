import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { investmentApi } from '../services/investmentApi';
import type { InvestmentHolding } from '../types';
import { QUERY_KEYS } from './queryKeys';

export function useInvestmentHoldingsQuery(
  options?: Partial<UseQueryOptions<InvestmentHolding[], Error>>
) {
  return useQuery<InvestmentHolding[], Error>({
    queryKey: QUERY_KEYS.INVESTMENT_HOLDINGS,
    queryFn: investmentApi.getHoldings,
    ...options,
  });
}
