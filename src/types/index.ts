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
