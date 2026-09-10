// ─── Core TypeScript Interfaces and Types for Personal Tracker ────────────────

/**
 * Transaction type — normalized to title-case for consistency.
 * Backend may return CREDIT/DEBIT; normalizeTransaction() handles conversion.
 */
export type TransactionType = 'Credit' | 'Debit';

/** Raw transaction type values the backend may return before normalization */
export type RawTransactionType = 'Credit' | 'Debit' | 'CREDIT' | 'DEBIT' | 'INCOME' | 'EXPENSE';

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  type: TransactionType;
  createdAt?: string;
}

/**
 * A financial transaction from the MongoDB-backed ledger.
 *
 * Note: the backend returns some duplicate fields (_id/id, date/transactionDate,
 * amount/amountSar, description/note, category/categoryName). We keep all fields
 * here for API compatibility, but normalizeTransaction() in expenseApi.ts ensures
 * the canonical fields are always populated.
 */
export interface Transaction {
  _id?: string;
  id?: string;
  date?: string;
  transactionDate?: string;
  month?: string;
  category: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  note?: string;
  paymentMethod?: string;
  amount: number;
  amountSar?: number;
  type: TransactionType;
  createdAt?: string;
  plannedExpenseId?: string;
}

export interface DashboardSummary {
  totalCredit: number;
  totalDebit: number;
  balance: number;
  expensesByCategory?: Record<string, number>;
}

// ─── Dashboard Mock Data Types ────────────────────────────────────────────────

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

// ─── Habits ───────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  targetFrequency: string;
  completedToday: boolean;
  history: number[];
}

// ─── Goals ────────────────────────────────────────────────────────────────────

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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  completed: boolean;
  dueDate?: string;
}

// ─── Backend Health ───────────────────────────────────────────────────────────

export interface BackendHealth {
  connected: boolean;
  mode: 'local' | 'remote';
  status?: string;
  service?: string;
  database?: string;
  timestamp?: number;
}

// ─── Borrow & Repay (INR) ─────────────────────────────────────────────────────

export type BorrowRepayType = 'Borrow' | 'Repaid';

export interface BorrowRepayRecord {
  id: string;
  creditorName: string;
  date: string;
  type: BorrowRepayType;
  /** Stored as positive number; displayed with sign based on type */
  amount: number;
  currency?: string;
  notes?: string;
  createdAt?: string;
}

export interface CreditorSummary {
  creditorName: string;
  totalBorrowed: number;
  totalRepaid: number;
  /** Positive = still owe creditor, 0 = settled */
  netBalance: number;
  lastActivityDate: string;
  status: 'Outstanding' | 'Settled' | 'Overpaid';
}

// ─── Planned Repayments (INR) ─────────────────────────────────────────────────

export type PlannedRepaymentStatus = 'Scheduled' | 'Paid' | 'Pending';

export interface PlannedRepayment {
  id: string;
  creditorName: string;
  targetDate: string;
  targetMonth?: string;
  plannedAmount: number;
  status: PlannedRepaymentStatus;
  notes?: string;
  createdAt?: string;
}

// ─── Planned Expenses (SAR) ───────────────────────────────────────────────────

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
