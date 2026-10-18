// ─── Habit Tracker Interfaces ──────────────────────────────────────────────────

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  targetFrequency: string;
  completedToday: boolean;
  history: number[];
  // Atomic Habits attributes
  identity?: string;          // e.g. "Master Software Engineer", "Fluent English Communicator"
  habitStack?: string;        // e.g. "After I pour morning coffee, I will..."
  twoMinuteRule?: string;     // e.g. "Read 1 page" (Gateway habit)
  missedYesterday?: boolean;  // True if habit was skipped yesterday ("Never Miss Twice")
}

