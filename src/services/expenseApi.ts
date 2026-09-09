import axios from 'axios';
import { Category, Transaction, DashboardSummary, TransactionType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// Remove legacy mock storage if previously seeded in user browser
try {
  localStorage.removeItem('pt_db_transactions');
  localStorage.removeItem('pt_db_categories');
} catch (e) {}

export const normalizeTransaction = (item: any): Transaction => {
  const id = item._id || item.id || (typeof item === 'object' && item !== null && item._id ? String(item._id) : String(Date.now()));
  const dateVal = item.date || item.transactionDate || new Date().toISOString();
  
  // Parse date string
  let dateObj = new Date(dateVal);
  if (isNaN(dateObj.getTime()) && typeof dateVal === 'string') {
    dateObj = new Date();
  }
  
  const monthAbbr = item.month || (!isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Mar');
  const amount = Number(item.amount !== undefined ? item.amount : (item.amountSar !== undefined ? item.amountSar : 0));
  
  const rawType = String(item.type || 'Debit').toUpperCase();
  const isCredit = rawType === 'CREDIT' || rawType === 'INCOME';
  const type: TransactionType = isCredit ? 'Credit' : 'Debit';
  
  const category = item.category || item.categoryName || 'General';
  const description = item.description || item.note || item.title || 'Transaction';
  const paymentMethod = item.paymentMethod || 'Account';

  // Format date display (e.g. 2026-03-01)
  let dateString = typeof dateVal === 'string' ? dateVal : dateObj.toISOString();
  if (dateString.includes('T')) {
    dateString = dateString.split('T')[0];
  }

  return {
    _id: typeof id === 'object' ? String(id) : id,
    id: typeof id === 'object' ? String(id) : id,
    date: dateVal,
    transactionDate: dateString,
    month: monthAbbr,
    category,
    categoryId: item.categoryId || id,
    categoryName: category,
    description,
    note: description,
    paymentMethod,
    amount,
    amountSar: amount,
    type,
    createdAt: item.createdAt || dateVal
  };
};

export const expenseApi = {
  // Categories from MongoDB Collection
  getCategories: async (type?: TransactionType): Promise<Category[]> => {
    try {
      const url = type ? `${API_BASE}/categories?type=${type}` : `${API_BASE}/categories`;
      const { data } = await axios.get<Category[]>(url, { timeout: 6000 });
      if (Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Unable to load categories from MongoDB:', e);
    }
    return [];
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const { data } = await axios.post<Category>(`${API_BASE}/categories`, category, { timeout: 4000 });
    return data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/categories/${id}`, { timeout: 4000 });
  },

  // Transactions from MongoDB Collection
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data } = await axios.get<any[]>(`${API_BASE}/transactions`, { timeout: 8000 });
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
    
    // Format date as ISO-8601 string: 2026-03-01T00:00:00.000Z for Spring Boot / MongoDB Jackson deserialization
    let isoDateStr: string;
    let dateOnlyStr: string;
    
    if (typeof rawDate === 'string' && rawDate.includes('T')) {
      isoDateStr = rawDate;
      dateOnlyStr = rawDate.split('T')[0];
    } else {
      dateOnlyStr = String(rawDate);
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        isoDateStr = parsed.toISOString();
      } else {
        isoDateStr = `${rawDate}T00:00:00.000Z`;
      }
    }

    const dateObj = new Date(isoDateStr);
    const month = transaction.month || (!isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Mar');
    
    const isCredit = String(transaction.type).toUpperCase() === 'CREDIT';
    const amountVal = Number(transaction.amount !== undefined ? transaction.amount : (transaction.amountSar || 0));

    const payload = {
      ...transaction,
      date: isoDateStr,
      transactionDate: dateOnlyStr,
      month,
      amount: amountVal,
      amountSar: amountVal,
      description: transaction.description || transaction.note || 'Transaction',
      note: transaction.description || transaction.note || 'Transaction',
      paymentMethod: transaction.paymentMethod || 'Account',
      type: isCredit ? 'Credit' : 'Debit'
    };

    const { data } = await axios.post<any>(`${API_BASE}/transactions`, payload, { timeout: 6000 });
    return normalizeTransaction(data);
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const updatePayload: any = { ...transaction };
    if (updatePayload.date) {
      const rawDate = updatePayload.date;
      if (typeof rawDate === 'string' && !rawDate.includes('T')) {
        const parsed = new Date(rawDate);
        updatePayload.date = !isNaN(parsed.getTime()) ? parsed.toISOString() : `${rawDate}T00:00:00.000Z`;
      }
    }
    const { data } = await axios.put<any>(`${API_BASE}/transactions/${id}`, updatePayload, { timeout: 6000 });
    return normalizeTransaction(data);
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/transactions/${id}`, { timeout: 6000 });
  },

  // Dashboard Summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      const { data } = await axios.get<DashboardSummary>(`${API_BASE}/expense-dashboard/summary`, { timeout: 4000 });
      if (data && (data.totalCredit > 0 || data.totalDebit > 0)) {
        return data;
      }
    } catch (e) {}

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
      expensesByCategory
    };
  }
};
