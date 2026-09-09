// Core TypeScript Interfaces and Types for Personal Tracker

export type TransactionType = 'CREDIT' | 'DEBIT' | 'Credit' | 'Debit';

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  type: TransactionType;
  createdAt?: string;
}

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
}

export interface DashboardSummary {
  totalCredit: number;
  totalDebit: number;
  balance: number;
  expensesByCategory?: Record<string, number>;
}

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

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  targetFrequency: string;
  completedToday: boolean;
  history: number[];
}

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

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  completed: boolean;
  dueDate?: string;
}

export interface BackendHealth {
  connected: boolean;
  mode: 'local' | 'remote';
  status?: string;
  service?: string;
  database?: string;
  timestamp?: number;
}

// Borrow & Repay Types (INR)
export type BorrowRepayType = 'Borrow' | 'Repaid';

export interface BorrowRepayRecord {
  id: string;
  creditorName: string;
  date: string;
  type: BorrowRepayType;
  amount: number; // Stored as positive number, displayed with sign based on type
  currency?: string; // 'INR'
  notes?: string;
  createdAt?: string;
}

export interface CreditorSummary {
  creditorName: string;
  totalBorrowed: number;
  totalRepaid: number;
  netBalance: number; // positive = still owe creditor, 0 = settled
  lastActivityDate: string;
  status: 'Outstanding' | 'Settled' | 'Overpaid';
}

// Planned Repayment Types (INR)
export type PlannedRepaymentStatus = 'Scheduled' | 'Paid' | 'Pending';

export interface PlannedRepayment {
  id: string;
  creditorName: string;
  targetDate: string;
  targetMonth?: string;
  plannedAmount: number; // in INR
  status: PlannedRepaymentStatus;
  notes?: string;
  createdAt?: string;
}

// Planned Expenses Types (in SAR)
export type PlannedExpenseStatus = 'Planned' | 'Fulfilled' | 'Pending' | 'Overdue';

export interface PlannedExpense {
  id: string;
  title: string;
  category: string;
  month: string; // e.g. "Mar"
  year: number;  // e.g. 2026
  plannedAmount: number; // in SAR
  currency?: string; // 'SAR'
  dueDate?: string;
  status: PlannedExpenseStatus;
  notes?: string;
  createdAt?: string;
}
