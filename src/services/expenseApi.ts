import axios from 'axios';
import { Category, Transaction, DashboardSummary, TransactionType } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const expenseApi = {
  // Categories
  getCategories: async (type?: TransactionType): Promise<Category[]> => {
    const url = type ? `${API_BASE}/categories?type=${type}` : `${API_BASE}/categories`;
    const { data } = await axios.get<Category[]>(url);
    return data;
  },
  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const { data } = await axios.post<Category>(`${API_BASE}/categories`, category);
    return data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/categories/${id}`);
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const { data } = await axios.get<Transaction[]>(`${API_BASE}/transactions`);
    return data;
  },
  createTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const { data } = await axios.post<Transaction>(`${API_BASE}/transactions`, transaction);
    return data;
  },
  updateTransaction: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const { data } = await axios.put<Transaction>(`${API_BASE}/transactions/${id}`, transaction);
    return data;
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/transactions/${id}`);
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const { data } = await axios.get<DashboardSummary>(`${API_BASE}/expense-dashboard/summary`);
    return data;
  }
};
