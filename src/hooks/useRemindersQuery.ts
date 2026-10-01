import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { notesRemindersService } from '../services/notesRemindersService';
import { QUERY_KEYS } from './queryKeys';
import { ReminderItem } from '../interface';

export function useRemindersQuery(options?: Partial<UseQueryOptions<ReminderItem[], Error>>) {
  return useQuery<ReminderItem[], Error>({
    queryKey: QUERY_KEYS.REMINDERS,
    queryFn: () => notesRemindersService.getReminders(),
    ...options,
  });
}
