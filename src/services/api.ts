/**
 * Core API service for Life OS Dashboard data (habits, goals, tasks).
 * Directly communicates with Spring Boot backend via apiClient.
 */

import { BackendHealth, Goal, Habit, TaskItem } from '../interface';
import apiClient from './apiClient';

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
  // ── Habits ────────────────────────────────────────────────────────────────

  getHabits: async (): Promise<Habit[]> => {
    try {
      const { data } = await apiClient.get<Habit[]>('/habits', { timeout: 6000 });
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('Failed to fetch habits from API:', e);
    }
    return [];
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

    try {
      const { data } = await apiClient.get<Goal[]>('/goals', { timeout: 6000 });
      if (Array.isArray(data)) return data.map(sanitizeGoal);
    } catch (e) {
      console.warn('Failed to fetch goals from API:', e);
    }
    return [];
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
      if (err?.response?.status === 404 || err?.response?.status === 405) {
        const { data } = await apiClient.post<Goal>('/goals', goal);
        if (data) return data;
      } else {
        throw err;
      }
    }
    return goal;
  },

  deleteGoal: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/goals/${id}`);
    return true;
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  getTasks: async (): Promise<TaskItem[]> => {
    try {
      const { data } = await apiClient.get<TaskItem[]>('/tasks', { timeout: 6000 });
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('Failed to fetch tasks from API:', e);
    }
    return [];
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
