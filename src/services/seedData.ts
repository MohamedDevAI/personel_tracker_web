/**
 * Initial seed data for local-storage fallback.
 * Previously inlined inside api.ts and borrowRepayApi.ts.
 */

import type { Expense, Habit, Goal, TaskItem, BorrowRepayRecord, PlannedRepayment } from '../types';

// ─── Dashboard Seed ───────────────────────────────────────────────────────────

export interface DashboardSeed {
  streakDays: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  activeHabitsCount: number;
  completedTasksToday: number;
  totalTasksToday: number;
  goalsCompletedCount: number;
  activeGoalsCount: number;
}

export const SEED_DASHBOARD: DashboardSeed = {
  streakDays: 14,
  monthlyIncome: 6450.0,
  monthlyExpense: 2310.5,
  savingsRate: 64.2,
  activeHabitsCount: 6,
  completedTasksToday: 7,
  totalTasksToday: 9,
  goalsCompletedCount: 3,
  activeGoalsCount: 5,
};

// ─── Expenses Seed ────────────────────────────────────────────────────────────

export const SEED_EXPENSES: Expense[] = [
  { id: '1', title: 'MacBook Pro M4 Monitor Setup', amount: 849.0, type: 'EXPENSE', category: 'Tech & Work', date: '2026-09-02', notes: 'Tax-deductible office workstation' },
  { id: '2', title: 'Consulting Retainer Client A', amount: 4200.0, type: 'INCOME', category: 'Consulting', date: '2026-09-01', notes: 'Monthly engineering deliverables' },
  { id: '3', title: 'Whole Foods Organic Groceries', amount: 165.4, type: 'EXPENSE', category: 'Nutrition', date: '2026-09-05', notes: 'Weekly meal prep' },
  { id: '4', title: 'SaaS Subscriptions (JetBrains, Cloud)', amount: 78.0, type: 'EXPENSE', category: 'Software', date: '2026-09-06', notes: 'Dev tools' },
  { id: '5', title: 'Equity Dividend Payout', amount: 2250.0, type: 'INCOME', category: 'Investment', date: '2026-09-07', notes: 'Quarterly dividend distribution' },
  { id: '6', title: 'Equinox Gym & Wellness Membership', amount: 260.0, type: 'EXPENSE', category: 'Fitness', date: '2026-09-04', notes: 'Monthly membership' },
];

// ─── Habits Seed ──────────────────────────────────────────────────────────────

export const SEED_HABITS: Habit[] = [
  { id: '1', title: '6:30 AM Morning Run & Mobility', category: 'Health', streak: 14, targetFrequency: 'Daily', completedToday: true, history: [1, 1, 1, 1, 1, 1, 1] },
  { id: '2', title: 'Deep Work Block (90 Mins No Distraction)', category: 'Productivity', streak: 9, targetFrequency: 'Daily', completedToday: true, history: [1, 0, 1, 1, 1, 1, 1] },
  { id: '3', title: 'Read 25 Pages (Architecture & Tech)', category: 'Learning', streak: 21, targetFrequency: 'Daily', completedToday: false, history: [1, 1, 1, 1, 1, 1, 0] },
  { id: '4', title: 'Cold Shower & Wim Hof Breathing', category: 'Health', streak: 8, targetFrequency: 'Daily', completedToday: true, history: [0, 1, 1, 1, 1, 1, 1] },
  { id: '5', title: 'Evening Portfolio & Budget Review', category: 'Finance', streak: 12, targetFrequency: 'Daily', completedToday: false, history: [1, 1, 1, 1, 1, 0, 0] },
];

// ─── Goals Seed ───────────────────────────────────────────────────────────────

export const SEED_GOALS: Goal[] = [
  { id: '1', title: 'Launch Production Micro-SaaS Product', category: 'Career', targetDate: '2026-11-30', progress: 75, targetValue: 100, currentValue: 75, unit: '%', status: 'IN_PROGRESS' },
  { id: '2', title: 'Emergency Fund ($30,000 Liquid)', category: 'Finance', targetDate: '2026-12-31', progress: 85, targetValue: 30000, currentValue: 25500, unit: '$', status: 'IN_PROGRESS' },
  { id: '3', title: 'Run Half-Marathon under 1h 45m', category: 'Fitness', targetDate: '2026-10-15', progress: 60, targetValue: 100, currentValue: 60, unit: '%', status: 'IN_PROGRESS' },
  { id: '4', title: 'Master Distributed Systems with Java & Go', category: 'Learning', targetDate: '2026-10-01', progress: 90, targetValue: 100, currentValue: 90, unit: '%', status: 'NEAR_COMPLETION' },
];

// ─── Tasks Seed ───────────────────────────────────────────────────────────────

export const SEED_TASKS: TaskItem[] = [
  { id: '1', title: 'Connect Spring Boot to MongoDB Atlas Cluster', priority: 'HIGH', category: 'Development', completed: false, dueDate: '2026-09-09' },
  { id: '2', title: 'Review Personal Tracker Github Repository remote sync', priority: 'HIGH', category: 'DevOps', completed: true, dueDate: '2026-09-08' },
  { id: '3', title: 'Configure monthly recurring savings transfer', priority: 'MEDIUM', category: 'Finance', completed: false, dueDate: '2026-09-10' },
  { id: '4', title: 'Write unit tests for Spring Boot Mongo controllers', priority: 'MEDIUM', category: 'Development', completed: false, dueDate: '2026-09-11' },
  { id: '5', title: 'Order electrolyte supplements for marathon training', priority: 'LOW', category: 'Health', completed: true, dueDate: '2026-09-07' },
];

// ─── Borrow/Repay Seed ────────────────────────────────────────────────────────

export const SEED_BORROW_REPAY_RECORDS: BorrowRepayRecord[] = [
  {
    id: 'br-sample-1',
    creditorName: 'Akash',
    date: '2024-11-27',
    type: 'Borrow',
    amount: 100,
    currency: 'INR',
    notes: 'Personal short loan',
    createdAt: '2024-11-27T10:00:00.000Z',
  },
  {
    id: 'br-sample-2',
    creditorName: 'Akash',
    date: '2024-12-02',
    type: 'Repaid',
    amount: 100,
    currency: 'INR',
    notes: 'Repaid via UPI',
    createdAt: '2024-12-02T15:00:00.000Z',
  },
];

// ─── Planned Repayments Seed ──────────────────────────────────────────────────

export const SEED_PLANNED_REPAYMENTS: PlannedRepayment[] = [
  {
    id: 'pr-sample-1',
    creditorName: 'Akash',
    targetDate: '2024-12-15',
    targetMonth: 'Dec',
    plannedAmount: 100,
    status: 'Paid',
    notes: 'Final settlement installment',
    createdAt: '2024-11-28T10:00:00.000Z',
  },
];
