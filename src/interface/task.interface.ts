// ─── Task Management Interfaces ────────────────────────────────────────────────

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  completed: boolean;
  dueDate?: string;
}
