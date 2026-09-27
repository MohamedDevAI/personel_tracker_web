import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { notesRemindersService } from '../services/notesRemindersService';
import type { ReminderItem } from '../types/notesReminders';
import { QUERY_KEYS } from './queryKeys';

export function useRemindersQuery(options?: Partial<UseQueryOptions<ReminderItem[], Error>>) {
  return useQuery<ReminderItem[], Error>({
    queryKey: QUERY_KEYS.REMINDERS,
    queryFn: () => notesRemindersService.getReminders(),
    ...options,
  });
}
