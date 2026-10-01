// ─── Planned Expenses (Monthly SAR Budget) Interfaces ────────────────────────

export type PlannedExpenseStatus = 'Planned' | 'Fulfilled' | 'Pending' | 'Overdue' | 'Partial';

export interface PlannedExpense {
  id: string;
  title: string;
  category?: string;
  /** Month abbreviation (e.g. "Jul") */
  month: string;
  /** Full year (e.g. 2026) */
  year: number;
  /** Planned amount in SAR */
  plannedAmount: number;
  /** Amount paid so far in SAR */
  paidAmount?: number;
  /** Whether fully paid */
  isFulfilled?: boolean;
  currency?: string;
  dueDate?: string;
  status: PlannedExpenseStatus;
  notes?: string;
  createdAt?: string;
}
