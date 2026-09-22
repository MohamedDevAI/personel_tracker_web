/**
 * Core API service for Dashboard data (habits, goals, tasks, expenses).
 * Uses localStorage as fallback when Spring Boot backend is unreachable.
 */

import { BackendHealth, Expense, Goal, Habit, TaskItem } from '../types';
import apiClient from './apiClient';

// ─── Local Storage Helpers ────────────────────────────────────────────────────

type StorageMap = {
  expenses: Expense[];
  habits: Habit[];
  goals: Goal[];
  tasks: TaskItem[];
};

/** Read from localStorage with fallback to empty array */
const getLocal = <K extends keyof StorageMap>(key: K): StorageMap[K] => {
  const storageKey = `pt_${key}`;
  const data = localStorage.getItem(storageKey);

  if (!data) {
    return [] as unknown as StorageMap[K];
  }

  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? (parsed as StorageMap[K]) : ([] as unknown as StorageMap[K]);
  } catch {
    return [] as unknown as StorageMap[K];
  }
};

/** Write to localStorage */
const setLocal = <K extends keyof StorageMap>(key: K, val: StorageMap[K]): void => {
  localStorage.setItem(`pt_${key}`, JSON.stringify(val));
};

// ─── Backend Health Check ─────────────────────────────────────────────────────

export const checkBackendHealth = async (): Promise<BackendHealth> => {
  try {
    const res = await fetch(`${apiClient.defaults.baseURL}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      return { connected: true, mode: 'remote', ...data };
    }
    return { connected: false, mode: 'local' };
  } catch {
    return { connected: false, mode: 'local' };
  }
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const api = {
  // ── Expenses ──────────────────────────────────────────────────────────────

  getExpenses: async (): Promise<Expense[]> => {
    try {
      const { data } = await apiClient.get<Expense[]>('/expenses', { timeout: 2000 });
      if (Array.isArray(data)) return data;
    } catch { /* fallback below */ }
    return getLocal('expenses');
  },

  createExpense: async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    try {
      const { data } = await apiClient.post<Expense>('/expenses', expense);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('expenses');
    const newItem: Expense = { ...expense, id: Date.now().toString() };
    setLocal('expenses', [newItem, ...list]);
    return newItem;
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/expenses/${id}`);
    } catch { /* fallback below */ }

    const list = getLocal('expenses').filter((x) => x.id !== id);
    setLocal('expenses', list);
    return true;
  },

  // ── Habits ────────────────────────────────────────────────────────────────

  getHabits: async (): Promise<Habit[]> => {
    try {
      const { data } = await apiClient.get<Habit[]>('/habits', { timeout: 2000 });
      if (Array.isArray(data)) return data;
    } catch { /* fallback below */ }
    return getLocal('habits');
  },

  toggleHabit: async (id: string): Promise<Habit> => {
    try {
      const { data } = await apiClient.post<Habit>(`/habits/${id}/toggle`);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('habits');
    const updated = list.map((h) => {
      if (h.id !== id) return h;
      const nextState = !h.completedToday;
      return {
        ...h,
        completedToday: nextState,
        streak: nextState ? h.streak + 1 : Math.max(0, h.streak - 1),
        history: [...h.history.slice(1), nextState ? 1 : 0],
      };
    });
    setLocal('habits', updated);

    const result = updated.find((h) => h.id === id);
    if (!result) throw new Error('Habit not found');
    return result;
  },

  createHabit: async (habit: Pick<Habit, 'title' | 'category' | 'targetFrequency'>): Promise<Habit> => {
    try {
      const { data } = await apiClient.post<Habit>('/habits', habit);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('habits');
    const newItem: Habit = {
      ...habit,
      id: Date.now().toString(),
      streak: 1,
      completedToday: true,
      history: [0, 0, 0, 0, 0, 0, 1],
    };
    setLocal('habits', [...list, newItem]);
    return newItem;
  },

  deleteHabit: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/habits/${id}`);
    } catch { /* fallback below */ }

    const list = getLocal('habits').filter((x) => x.id !== id);
    setLocal('habits', list);
    return true;
  },

  // ── Goals ─────────────────────────────────────────────────────────────────

  getGoals: async (): Promise<Goal[]> => {
    const sanitizeGoal = (g: Goal): Goal => {
      const rawUnit = g.unit?.trim();
      const unit = (!rawUnit || rawUnit === '$' || rawUnit === 'USD')
        ? 'SAR'
        : (rawUnit === 'INR' ? 'INR' : rawUnit);
      const title = g.title ? g.title.replace(/\(\$([0-9,]+)/g, '(SAR $1') : g.title;
      return { ...g, unit, title };
    };

    try {
      const { data } = await apiClient.get<Goal[]>('/goals', { timeout: 2000 });
      if (Array.isArray(data)) return data.map(sanitizeGoal);
    } catch { /* fallback below */ }
    return getLocal('goals').map(sanitizeGoal);
  },

  updateGoalProgress: async (id: string, newProgress: number): Promise<Goal> => {
    try {
      const { data } = await apiClient.patch<Goal>(`/goals/${id}/progress?value=${newProgress}`);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('goals');
    const updated = list.map((g) =>
      g.id === id ? { ...g, progress: Math.min(100, Math.max(0, newProgress)) } : g
    );
    setLocal('goals', updated);

    const result = updated.find((g) => g.id === id);
    if (!result) throw new Error('Goal not found');
    return result;
  },

  createGoal: async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    try {
      const { data } = await apiClient.post<Goal>('/goals', goal);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('goals');
    const newItem: Goal = { ...goal, id: Date.now().toString(), status: 'IN_PROGRESS' };
    setLocal('goals', [...list, newItem]);
    return newItem;
  },

  updateGoal: async (goal: Goal): Promise<Goal> => {
    // 1. Try POST /goals (Spring Data Mongo repository.save(goal) updates existing document when ID is present)
    try {
      const { data } = await apiClient.post<Goal>('/goals', goal);
      if (data) return data;
    } catch {
      // 2. Try PUT /goals/{id}
      try {
        const { data } = await apiClient.put<Goal>(`/goals/${goal.id}`, goal);
        if (data) return data;
      } catch {
        // 3. Try PATCH /goals/{id}
        try {
          const { data } = await apiClient.patch<Goal>(`/goals/${goal.id}`, goal);
          if (data) return data;
        } catch { /* fallback to local below */ }
      }
    }

    const list = getLocal('goals');
    const updated = list.map((g) => (g.id === goal.id ? { ...g, ...goal } : g));
    setLocal('goals', updated);

    const result = updated.find((g) => g.id === goal.id);
    return result || goal;
  },

  deleteGoal: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/goals/${id}`);
    } catch { /* fallback below */ }

    const list = getLocal('goals').filter((g) => g.id !== id);
    setLocal('goals', list);
    return true;
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  getTasks: async (): Promise<TaskItem[]> => {
    try {
      const { data } = await apiClient.get<TaskItem[]>('/tasks', { timeout: 2000 });
      if (Array.isArray(data)) return data;
    } catch { /* fallback below */ }
    return getLocal('tasks');
  },

  toggleTask: async (id: string): Promise<TaskItem> => {
    try {
      const { data } = await apiClient.post<TaskItem>(`/tasks/${id}/toggle`);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('tasks');
    const updated = list.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setLocal('tasks', updated);

    const result = updated.find((t) => t.id === id);
    if (!result) throw new Error('Task not found');
    return result;
  },

  createTask: async (task: Omit<TaskItem, 'id' | 'completed'>): Promise<TaskItem> => {
    try {
      const { data } = await apiClient.post<TaskItem>('/tasks', task);
      if (data) return data;
    } catch { /* fallback below */ }

    const list = getLocal('tasks');
    const newItem: TaskItem = { ...task, id: Date.now().toString(), completed: false };
    setLocal('tasks', [newItem, ...list]);
    return newItem;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch { /* fallback below */ }

    const list = getLocal('tasks').filter((t) => t.id !== id);
    setLocal('tasks', list);
    return true;
  },
};
