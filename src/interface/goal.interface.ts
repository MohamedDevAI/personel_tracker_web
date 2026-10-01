// ─── Goal Tracker Interfaces ───────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate?: string;
  progress: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status?: string;
}
