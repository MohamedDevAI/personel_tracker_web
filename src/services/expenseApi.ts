/**
 * Expense/Transaction API service.
 * Handles CRUD operations for categories and transactions via Spring Boot + MongoDB Atlas.
 */

import apiClient from './apiClient';
import { MONTH_NAMES } from '../utils/dateHelpers';
import type { Category, Transaction, TransactionType, DashboardSummary } from '../types';

export { MONTH_NAMES };

// ─── Transaction Normalizer ───────────────────────────────────────────────────

/**
 * Normalize a raw API response object into a consistent Transaction shape.
 * The backend returns some fields in multiple forms (_id/id, date/transactionDate, etc.).
 * This function ensures canonical fields are always populated.
 */
export const normalizeTransaction = (item: any): Transaction => {
  const id = item._id || item.id || String(Date.now());
  const idStr = typeof id === 'object' ? String(id) : id;
  const dateVal = item.date || item.transactionDate || new Date().toISOString();

  // Parse date
  let dateObj = new Date(dateVal);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const monthAbbr = item.month || (
    !isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Mar'
  );

  const amount = Number(
    item.amount !== undefined ? item.amount : (item.amountSar ?? 0)
  );

  // Normalize type to title-case
  const rawType = String(item.type || 'Debit').toUpperCase();
  const isCredit = rawType === 'CREDIT' || rawType === 'INCOME';
  const type: TransactionType = isCredit ? 'Credit' : 'Debit';

  const category = item.category || item.categoryName || 'General';
  const description = item.description || item.note || item.title || 'Transaction';
  const paymentMethod = item.paymentMethod || 'Account';

  // Format date display
  let dateString = typeof dateVal === 'string' ? dateVal : dateObj.toISOString();
  if (dateString.includes('T')) {
    dateString = dateString.split('T')[0];
  }

  // Extract planned expense ID from note tags like [PE-xxx]
  const noteText = item.note || description;
  const peMatch =
    (typeof noteText === 'string' ? noteText.match(/\[PE-([^\]]+)\]/) : null) ||
    (typeof description === 'string' ? description.match(/\[PE-([^\]]+)\]/) : null);
  const plannedExpenseId = item.plannedExpenseId || (peMatch ? peMatch[1] : undefined);

  return {
    _id: idStr,
    id: idStr,
    date: dateVal,
    transactionDate: dateString,
    month: monthAbbr,
    category,
    categoryId: item.categoryId || idStr,
    categoryName: category,
    description,
    note: noteText,
    paymentMethod,
    amount,
    amountSar: amount,
    type,
    createdAt: item.createdAt || dateVal,
    plannedExpenseId,
  };
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const expenseApi = {
  // ── Categories ────────────────────────────────────────────────────────────

  getCategories: async (type?: TransactionType): Promise<Category[]> => {
    try {
      const url = type ? `/categories?type=${type}` : '/categories';
      const { data } = await apiClient.get<Category[]>(url);
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('Unable to load categories from MongoDB:', e);
    }
    return [];
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const { data } = await apiClient.post<Category>('/categories', category);
    return data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  // ── Transactions ──────────────────────────────────────────────────────────

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data } = await apiClient.get<any[]>('/transactions', { timeout: 8000 });
      if (Array.isArray(data)) {
        return data.map(normalizeTransaction);
      }
    } catch (e) {
      console.warn('Unable to load transactions from MongoDB:', e);
    }
    return [];
  },

  createTransaction: async (transaction: Omit<Transaction, 'id' | '_id'>): Promise<Transaction> => {
    const rawDate = transaction.date || transaction.transactionDate || new Date().toISOString();

    // Format date as ISO-8601 for Spring Boot / MongoDB Jackson deserialization
    let isoDateStr: string;
    let dateOnlyStr: string;

    if (typeof rawDate === 'string' && rawDate.includes('T')) {
      isoDateStr = rawDate;
      dateOnlyStr = rawDate.split('T')[0];
    } else {
      dateOnlyStr = String(rawDate);
      const parsed = new Date(rawDate);
      isoDateStr = !isNaN(parsed.getTime())
        ? parsed.toISOString()
        : `${rawDate}T00:00:00.000Z`;
    }

    const dateObj = new Date(isoDateStr);
    const month = transaction.month || (
      !isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Mar'
    );

    const isCredit = String(transaction.type).toUpperCase() === 'CREDIT';
    const amountVal = Number(
      transaction.amount !== undefined ? transaction.amount : (transaction.amountSar || 0)
    );

    const payload = {
      ...transaction,
      date: isoDateStr,
      transactionDate: dateOnlyStr,
      month,
      amount: amountVal,
      amountSar: amountVal,
      description: transaction.description || transaction.note || 'Transaction',
      note: transaction.note || transaction.description || 'Transaction',
      paymentMethod: transaction.paymentMethod || 'Account',
      type: isCredit ? 'Credit' : 'Debit',
      plannedExpenseId: transaction.plannedExpenseId,
    };

    const { data } = await apiClient.post<any>('/transactions', payload);
    return normalizeTransaction(data);
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const updatePayload: any = { ...transaction };

    if (updatePayload.date) {
      const rawDate = updatePayload.date;
      if (typeof rawDate === 'string' && !rawDate.includes('T')) {
        const parsed = new Date(rawDate);
        updatePayload.date = !isNaN(parsed.getTime())
          ? parsed.toISOString()
          : `${rawDate}T00:00:00.000Z`;
      }
    }

    const { data } = await apiClient.put<any>(`/transactions/${id}`, updatePayload);
    return normalizeTransaction(data);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  // ── Dashboard Summary ─────────────────────────────────────────────────────

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      const { data } = await apiClient.get<DashboardSummary>('/expense-dashboard/summary', {
        timeout: 4000,
      });
      if (data && (data.totalCredit > 0 || data.totalDebit > 0)) {
        return data;
      }
    } catch { /* compute from transactions */ }

    // Fallback: compute from live transaction data
    const txs = await expenseApi.getTransactions();
    let totalCredit = 0;
    let totalDebit = 0;
    const expensesByCategory: Record<string, number> = {};

    for (const tx of txs) {
      const amt = Math.abs(Number(tx.amount || tx.amountSar || 0));
      const isCredit = String(tx.type).toUpperCase() === 'CREDIT';
      if (isCredit) {
        totalCredit += amt;
      } else {
        totalDebit += amt;
        const cat = tx.category || tx.categoryName || 'Other';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
      }
    }

    return {
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit,
      expensesByCategory,
    };
  },
};
