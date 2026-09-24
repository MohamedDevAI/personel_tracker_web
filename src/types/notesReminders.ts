export type NoteColor =
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'slate';

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  reminderId?: string;
}

export type ReminderPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ReminderItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string (e.g. 2026-09-24)
  dueTime?: string; // HH:mm format (e.g. 14:30)
  priority: ReminderPriority;
  isCompleted: boolean;
  completedAt?: string;
  noteId?: string;
  category?: string;
}
