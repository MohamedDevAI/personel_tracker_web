/**
 * Core API service for Dashboard data (habits, goals, tasks, expenses).
 * Directly communicates with Spring Boot backend via apiClient.
 */

import { BackendHealth, Expense, Goal, Habit, TaskItem } from '../interface';
import apiClient from './apiClient';
import { env } from '../config/env';

// ─── Backend Health Check ─────────────────────────────────────────────────────

export const checkBackendHealth = async (): Promise<BackendHealth> => {
  try {
    const res = await fetch(`${apiClient.defaults.baseURL}/health`, {
      signal: AbortSignal.timeout(env.apiHealthTimeout),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { connected: true, mode: 'remote', ...data };
    }
    return { connected: false, mode: 'remote' };
  } catch {
    return { connected: false, mode: 'remote' };
  }
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const api = {
  // ── Expenses ──────────────────────────────────────────────────────────────

  getExpenses: async (): Promise<Expense[]> => {
    const { data } = await apiClient.get<Expense[]>('/expenses', { timeout: env.apiTimeout });
    return Array.isArray(data) ? data : [];
  },

  createExpense: async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const { data } = await apiClient.post<Expense>('/expenses', expense);
    return data;
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/expenses/${id}`);
    return true;
  },

  // ── Habits ────────────────────────────────────────────────────────────────

  getHabits: async (): Promise<Habit[]> => {
    const { data } = await apiClient.get<Habit[]>('/habits', { timeout: env.apiTimeout });
    return Array.isArray(data) ? data : [];
  },

  toggleHabit: async (id: string): Promise<Habit> => {
    const { data } = await apiClient.post<Habit>(`/habits/${id}/toggle`);
    return data;
  },

  createHabit: async (habit: Pick<Habit, 'title' | 'category' | 'targetFrequency'>): Promise<Habit> => {
    const { data } = await apiClient.post<Habit>('/habits', habit);
    return data;
  },

  deleteHabit: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/habits/${id}`);
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

    const { data } = await apiClient.get<Goal[]>('/goals', { timeout: env.apiTimeout });
    return Array.isArray(data) ? data.map(sanitizeGoal) : [];
  },

  updateGoalProgress: async (id: string, newProgress: number): Promise<Goal> => {
    const { data } = await apiClient.patch<Goal>(`/goals/${id}/progress?value=${newProgress}`);
    return data;
  },

  createGoal: async (goal: Omit<Goal, 'id'>): Promise<Goal> => {
    const { data } = await apiClient.post<Goal>('/goals', goal);
    return data;
  },

  updateGoal: async (goal: Goal): Promise<Goal> => {
    try {
      const { data } = await apiClient.put<Goal>(`/goals/${goal.id}`, goal);
      if (data) return data;
    } catch (err: any) {
      if (err?.response?.status === 405) {
        // Fallback to POST /goals only if PUT is not allowed (HTTP 405)
        const { data } = await apiClient.post<Goal>('/goals', goal);
        if (data) return data;
      }
      throw err;
    }
    return goal;
  },

  deleteGoal: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/goals/${id}`);
    return true;
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  getTasks: async (): Promise<TaskItem[]> => {
    const { data } = await apiClient.get<TaskItem[]>('/tasks', { timeout: env.apiTimeout });
    return Array.isArray(data) ? data : [];
  },

  toggleTask: async (id: string): Promise<TaskItem> => {
    const { data } = await apiClient.post<TaskItem>(`/tasks/${id}/toggle`);
    return data;
  },

  createTask: async (task: Omit<TaskItem, 'id' | 'completed'>): Promise<TaskItem> => {
    const { data } = await apiClient.post<TaskItem>('/tasks', task);
    return data;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/tasks/${id}`);
    return true;
  },
};
