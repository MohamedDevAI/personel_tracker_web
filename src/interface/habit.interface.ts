// ─── Habit Tracker Interfaces ──────────────────────────────────────────────────

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  targetFrequency: string;
  completedToday: boolean;
  history: number[];
}
