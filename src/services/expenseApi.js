import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export const expenseApi = {
    // Categories
    getCategories: async (type) => {
        const url = type ? `${API_BASE}/categories?type=${type}` : `${API_BASE}/categories`;
        const { data } = await axios.get(url);
        return data;
    },
    createCategory: async (category) => {
        const { data } = await axios.post(`${API_BASE}/categories`, category);
        return data;
    },
    deleteCategory: async (id) => {
        await axios.delete(`${API_BASE}/categories/${id}`);
    },

    // Transactions
    getTransactions: async () => {
        const { data } = await axios.get(`${API_BASE}/transactions`);
        return data;
    },
    createTransaction: async (transaction) => {
        const { data } = await axios.post(`${API_BASE}/transactions`, transaction);
        return data;
    },
    updateTransaction: async (id, transaction) => {
        const { data } = await axios.put(`${API_BASE}/transactions/${id}`, transaction);
        return data;
    },
    deleteTransaction: async (id) => {
        await axios.delete(`${API_BASE}/transactions/${id}`);
    },

    // Dashboard
    getDashboardSummary: async () => {
        const { data } = await axios.get(`${API_BASE}/expense-dashboard/summary`);
        return data;
    }
};
