/**
 * Application-wide constants.
 * Consolidates values previously scattered across financeConstants.ts, Habits.tsx, Goals.tsx, Tasks.tsx, etc.
 */

// ─── API Configuration ───────────────────────────────────────────────────────

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Category Color Palette (for charts & badges) ────────────────────────────

export const CATEGORY_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#f97316', // Orange
  '#a855f7', // Purple
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
  '#64748b', // Slate
] as const;

/** Get a color from the palette by index (wraps around) */
export const getCategoryColor = (index: number): string => {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
};

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const PAYMENT_METHODS = ['Account', 'Card', 'Cash', 'Transfer', 'UPI'] as const;

// ─── Domain Category Lists ───────────────────────────────────────────────────

export const HABIT_CATEGORIES = [
  'Health', 'Productivity', 'Mindset', 'Learning', 'Fitness', 'Finance',
] as const;

export const GOAL_CATEGORIES = [
  'Career', 'Finance', 'Fitness', 'Learning', 'Personal',
] as const;

export const TASK_CATEGORIES = [
  'Development', 'DevOps', 'Finance', 'Health', 'Personal', 'General',
] as const;

// ─── Day Names ────────────────────────────────────────────────────────────────

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ─── Local Storage Keys ──────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  THEME: 'pt_theme',
  DASHBOARD: 'pt_dashboard',
  EXPENSES: 'pt_expenses',
  HABITS: 'pt_habits',
  GOALS: 'pt_goals',
  TASKS: 'pt_tasks',
  BORROW_REPAY: 'pt_borrow_repay_records',
  PLANNED_REPAYMENTS: 'pt_planned_repayments',
  PLANNED_EXPENSES: 'pt_planned_expenses',
} as const;
