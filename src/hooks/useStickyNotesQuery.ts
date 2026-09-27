import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { notesRemindersService } from '../services/notesRemindersService';
import type { StickyNote } from '../types/notesReminders';
import { QUERY_KEYS } from './queryKeys';

export function useStickyNotesQuery(options?: Partial<UseQueryOptions<StickyNote[], Error>>) {
  return useQuery<StickyNote[], Error>({
    queryKey: QUERY_KEYS.STICKY_NOTES,
    queryFn: () => notesRemindersService.getNotes(),
    ...options,
  });
}
