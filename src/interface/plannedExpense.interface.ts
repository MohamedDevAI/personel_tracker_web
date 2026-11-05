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
  /** Whether part of a recurring monthly sequence */
  isRecurring?: boolean;
  /** Unique ID connecting all months in this recurring series */
  recurringGroupId?: string;
  /** 1-based index of this recurring payment installment (e.g. 1) */
  installmentIndex?: number;
  /** Total number of installments in this series (e.g. 4) */
  totalInstallments?: number;
}
