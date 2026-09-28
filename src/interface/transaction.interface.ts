// ─── Transaction & Expense Ledger Interfaces ──────────────────────────────────

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
  currency?: string;
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
