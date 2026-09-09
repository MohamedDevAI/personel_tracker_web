import axios from 'axios';
import { Category, Transaction, DashboardSummary, TransactionType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

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

const INITIAL_SEED_TRANSACTIONS: Transaction[] = [
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d58',
    date: '2026-03-01T00:00:00.000+00:00',
    month: 'Mar',
    category: 'Salary',
    description: 'Salary',
    paymentMethod: 'Account',
    amount: 5000,
    type: 'Credit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d59',
    date: '2026-03-05T10:30:00.000+00:00',
    month: 'Mar',
    category: 'Groceries',
    description: 'Organic Market & Whole Foods',
    paymentMethod: 'Card',
    amount: 420.50,
    type: 'Debit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d60',
    date: '2026-03-10T14:15:00.000+00:00',
    month: 'Mar',
    category: 'Housing',
    description: 'Monthly Apartment Lease & Utilities',
    paymentMethod: 'Account',
    amount: 1800.00,
    type: 'Debit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d61',
    date: '2026-03-18T09:00:00.000+00:00',
    month: 'Mar',
    category: 'Software',
    description: 'Cloud Infrastructure & JetBrains Suite',
    paymentMethod: 'Card',
    amount: 95.00,
    type: 'Debit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d62',
    date: '2026-02-01T00:00:00.000+00:00',
    month: 'Feb',
    category: 'Consulting',
    description: 'Architecture Advisory Retainer',
    paymentMethod: 'Account',
    amount: 4500,
    type: 'Credit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d63',
    date: '2026-02-14T18:00:00.000+00:00',
    month: 'Feb',
    category: 'Dining',
    description: 'Fine Dining & Hospitality',
    paymentMethod: 'Card',
    amount: 310.00,
    type: 'Debit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d64',
    date: '2026-01-01T00:00:00.000+00:00',
    month: 'Jan',
    category: 'Salary',
    description: 'New Year Milestone Bonus',
    paymentMethod: 'Account',
    amount: 3000,
    type: 'Credit'
  }),
  normalizeTransaction({
    _id: '6aa008173fdcf0e63ade4d65',
    date: '2026-01-20T12:00:00.000+00:00',
    month: 'Jan',
    category: 'Tech & Work',
    description: '4K UltraFine Ergonomic Display',
    paymentMethod: 'Account',
    amount: 850.00,
    type: 'Debit'
  })
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Salary', type: 'Credit' },
  { id: 'cat-2', name: 'Consulting', type: 'Credit' },
  { id: 'cat-3', name: 'Investments', type: 'Credit' },
  { id: 'cat-4', name: 'Housing', type: 'Debit' },
  { id: 'cat-5', name: 'Groceries', type: 'Debit' },
  { id: 'cat-6', name: 'Software', type: 'Debit' },
  { id: 'cat-7', name: 'Tech & Work', type: 'Debit' },
  { id: 'cat-8', name: 'Dining', type: 'Debit' },
  { id: 'cat-9', name: 'Utilities', type: 'Debit' }
];

const getLocalTransactions = (): Transaction[] => {
  const data = localStorage.getItem('pt_db_transactions');
  if (!data) {
    localStorage.setItem('pt_db_transactions', JSON.stringify(INITIAL_SEED_TRANSACTIONS));
    return INITIAL_SEED_TRANSACTIONS;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(normalizeTransaction) : INITIAL_SEED_TRANSACTIONS;
  } catch (e) {
    return INITIAL_SEED_TRANSACTIONS;
  }
};

const setLocalTransactions = (txs: Transaction[]): void => {
  localStorage.setItem('pt_db_transactions', JSON.stringify(txs));
};

const getLocalCategories = (): Category[] => {
  const data = localStorage.getItem('pt_db_categories');
  if (!data) {
    localStorage.setItem('pt_db_categories', JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
  } catch (e) {
    return INITIAL_CATEGORIES;
  }
};

const setLocalCategories = (cats: Category[]): void => {
  localStorage.setItem('pt_db_categories', JSON.stringify(cats));
};

export const expenseApi = {
  // Categories
  getCategories: async (type?: TransactionType): Promise<Category[]> => {
    try {
      const url = type ? `${API_BASE}/categories?type=${type}` : `${API_BASE}/categories`;
      const { data } = await axios.get<Category[]>(url, { timeout: 1500 });
      if (Array.isArray(data) && data.length > 0) {
        setLocalCategories(data);
        return data;
      }
    } catch (e) {
      // Use local storage fallback
    }
    const local = getLocalCategories();
    if (type) {
      const targetType = String(type).toUpperCase();
      return local.filter(c => String(c.type).toUpperCase() === targetType);
    }
    return local;
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    try {
      const { data } = await axios.post<Category>(`${API_BASE}/categories`, category, { timeout: 2000 });
      if (data) {
        const local = getLocalCategories();
        setLocalCategories([...local, data]);
        return data;
      }
    } catch (e) {
      // local fallback
    }
    const local = getLocalCategories();
    const newCat: Category = { ...category, id: `cat-${Date.now()}` };
    setLocalCategories([...local, newCat]);
    return newCat;
  },

  deleteCategory: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE}/categories/${id}`, { timeout: 2000 });
    } catch (e) {}
    const local = getLocalCategories().filter(c => c.id !== id && c._id !== id);
    setLocalCategories(local);
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const { data } = await axios.get<any[]>(`${API_BASE}/transactions`, { timeout: 1500 });
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeTransaction);
        setLocalTransactions(normalized);
        return normalized;
      }
    } catch (e) {
      // Local storage fallback
    }
    return getLocalTransactions();
  },

  createTransaction: async (transaction: Omit<Transaction, 'id' | '_id'>): Promise<Transaction> => {
    const dateVal = transaction.date || transaction.transactionDate || new Date().toISOString();
    const dateObj = new Date(dateVal);
    const month = transaction.month || (!isNaN(dateObj.getTime()) ? MONTH_NAMES[dateObj.getMonth()] : 'Mar');
    
    const payload = {
      ...transaction,
      date: dateVal,
      month,
      amount: Number(transaction.amount !== undefined ? transaction.amount : (transaction.amountSar || 0)),
      amountSar: Number(transaction.amount !== undefined ? transaction.amount : (transaction.amountSar || 0)),
      description: transaction.description || transaction.note || 'Transaction',
      note: transaction.description || transaction.note || 'Transaction',
      paymentMethod: transaction.paymentMethod || 'Account',
      type: String(transaction.type).toUpperCase() === 'CREDIT' ? 'Credit' : 'Debit'
    };

    try {
      const { data } = await axios.post<any>(`${API_BASE}/transactions`, payload, { timeout: 2000 });
      if (data) {
        const normalized = normalizeTransaction(data);
        const current = getLocalTransactions();
        setLocalTransactions([normalized, ...current]);
        return normalized;
      }
    } catch (e) {
      // local fallback
    }

    const localTx = normalizeTransaction({
      ...payload,
      _id: `tx-${Date.now()}`
    });
    const current = getLocalTransactions();
    setLocalTransactions([localTx, ...current]);
    return localTx;
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    try {
      const { data } = await axios.put<any>(`${API_BASE}/transactions/${id}`, transaction, { timeout: 2000 });
      if (data) {
        const normalized = normalizeTransaction(data);
        const current = getLocalTransactions().map(t => (t.id === id || t._id === id ? normalized : t));
        setLocalTransactions(current);
        return normalized;
      }
    } catch (e) {}

    const current = getLocalTransactions();
    const existing = current.find(t => t.id === id || t._id === id) || ({} as Transaction);
    const updated = normalizeTransaction({ ...existing, ...transaction, id, _id: id });
    setLocalTransactions(current.map(t => (t.id === id || t._id === id ? updated : t)));
    return updated;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE}/transactions/${id}`, { timeout: 2000 });
    } catch (e) {}
    const current = getLocalTransactions().filter(t => t.id !== id && t._id !== id);
    setLocalTransactions(current);
  },

  // Dashboard Summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      const { data } = await axios.get<DashboardSummary>(`${API_BASE}/expense-dashboard/summary`, { timeout: 1500 });
      if (data && (data.totalCredit > 0 || data.totalDebit > 0)) {
        return data;
      }
    } catch (e) {}

    const txs = getLocalTransactions();
    let totalCredit = 0;
    let totalDebit = 0;
    const expensesByCategory: Record<string, number> = {};

    for (const tx of txs) {
      const amt = Number(tx.amount || tx.amountSar || 0);
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
