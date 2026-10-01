// ─── Dashboard Core Expense Interfaces ────────────────────────────────────────

export type ExpenseType = 'INCOME' | 'EXPENSE';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: ExpenseType;
  category: string;
  date: string;
  notes?: string;
}
