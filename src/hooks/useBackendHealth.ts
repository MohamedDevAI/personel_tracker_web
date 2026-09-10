/**
 * Hook for checking Spring Boot + MongoDB Atlas backend connectivity.
 */

import { useQuery } from '@tanstack/react-query';
import { checkBackendHealth } from '../services/api';
import type { BackendHealth } from '../types';

export function useBackendHealth() {
  const { data: backendStatus = { connected: false, mode: 'local' as const } } =
    useQuery<BackendHealth>({
      queryKey: ['backendHealth'],
      queryFn: checkBackendHealth,
      staleTime: 30_000, // Re-check every 30 seconds
      refetchOnWindowFocus: false,
    });

  return backendStatus;
}
