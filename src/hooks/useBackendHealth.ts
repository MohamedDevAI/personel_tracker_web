/**
 * Hook for checking Spring Boot + MongoDB Atlas backend connectivity.
 */

import { useQuery } from '@tanstack/react-query';
import { checkBackendHealth } from '../services/api';
import { QUERY_KEYS } from './queryKeys';
import { BackendHealth } from '../interface';

export function useBackendHealth() {
  const { data: backendStatus = { connected: false, mode: 'remote' as const } } =
    useQuery<BackendHealth>({
      queryKey: QUERY_KEYS.BACKEND_HEALTH,
      queryFn: checkBackendHealth,
      staleTime: 30_000,
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
      retry: 2,
    });

  return backendStatus;
}
