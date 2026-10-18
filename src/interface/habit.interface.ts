// ─── Habit Tracker Interfaces ──────────────────────────────────────────────────

export type HabitTimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  targetFrequency: string;
  completedToday: boolean;
  history: number[];
  // Atomic Habits enhancements
  identity?: string;          // e.g. "Disciplined Builder", "Healthy Athlete"
  habitStack?: string;        // e.g. "After I pour morning coffee, I will..."
  twoMinuteRule?: string;     // e.g. "Read 1 page" (Gateway habit)
  timeOfDay?: HabitTimeOfDay; // 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME'
  completedDates?: string[];  // ['2026-10-18', ...]
  missedYesterday?: boolean;  // True if habit was skipped yesterday ("Never Miss Twice")
  isCompletedOnSelectedDate?: boolean; // Evaluated for current selected date view
}

