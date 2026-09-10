/**
 * Borrow & Repay API service.
 * Manages borrow/repay records and planned repayments using localStorage.
 */

import { STORAGE_KEYS } from '../utils/constants';
import { SEED_BORROW_REPAY_RECORDS, SEED_PLANNED_REPAYMENTS } from './seedData';
import type {
  BorrowRepayRecord,
  CreditorSummary,
  PlannedRepayment,
} from '../types';

// ─── Local Storage Helpers ────────────────────────────────────────────────────

const readStorage = <T>(key: string, seed: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`Failed to load ${key}:`, e);
  }
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
};

const writeStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const borrowRepayApi = {
  // ── Borrow/Repay Records ──────────────────────────────────────────────────

  getRecords: (): BorrowRepayRecord[] => {
    return readStorage(STORAGE_KEYS.BORROW_REPAY, SEED_BORROW_REPAY_RECORDS);
  },

  createRecord: (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>): BorrowRepayRecord => {
    const records = borrowRepayApi.getRecords();
    const newRecord: BorrowRepayRecord = {
      ...record,
      id: generateId('br'),
      amount: Math.abs(Number(record.amount) || 0),
      currency: 'INR',
      createdAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.BORROW_REPAY, [newRecord, ...records]);
    return newRecord;
  },

  updateRecord: (id: string, updates: Partial<BorrowRepayRecord>): BorrowRepayRecord | null => {
    const records = borrowRepayApi.getRecords();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updatedRecord: BorrowRepayRecord = {
      ...records[index],
      ...updates,
      amount: updates.amount !== undefined
        ? Math.abs(Number(updates.amount))
        : records[index].amount,
    };
    records[index] = updatedRecord;
    writeStorage(STORAGE_KEYS.BORROW_REPAY, records);
    return updatedRecord;
  },

  deleteRecord: (id: string): void => {
    const filtered = borrowRepayApi.getRecords().filter((r) => r.id !== id);
    writeStorage(STORAGE_KEYS.BORROW_REPAY, filtered);
  },

  // ── Creditor Summaries ────────────────────────────────────────────────────

  getCreditorSummaries: (): CreditorSummary[] => {
    const records = borrowRepayApi.getRecords();
    const creditorMap: Record<string, {
      totalBorrowed: number;
      totalRepaid: number;
      dates: string[];
    }> = {};

    for (const r of records) {
      const name = r.creditorName.trim() || 'Unknown';
      if (!creditorMap[name]) {
        creditorMap[name] = { totalBorrowed: 0, totalRepaid: 0, dates: [] };
      }
      if (r.type === 'Borrow') {
        creditorMap[name].totalBorrowed += Number(r.amount);
      } else {
        creditorMap[name].totalRepaid += Number(r.amount);
      }
      creditorMap[name].dates.push(r.date);
    }

    return Object.entries(creditorMap).map(([creditorName, data]) => {
      const netBalance = data.totalBorrowed - data.totalRepaid;
      let status: CreditorSummary['status'] = 'Settled';
      if (netBalance > 0) status = 'Outstanding';
      else if (netBalance < 0) status = 'Overpaid';

      const sortedDates = data.dates.sort();
      const lastActivityDate = sortedDates[sortedDates.length - 1] || 'N/A';

      return { creditorName, totalBorrowed: data.totalBorrowed, totalRepaid: data.totalRepaid, netBalance, lastActivityDate, status };
    });
  },

  // ── Overall Stats ─────────────────────────────────────────────────────────

  getOverallStats: () => {
    const records = borrowRepayApi.getRecords();
    let totalBorrowed = 0;
    let totalRepaid = 0;

    for (const r of records) {
      if (r.type === 'Borrow') {
        totalBorrowed += Number(r.amount);
      } else {
        totalRepaid += Number(r.amount);
      }
    }

    const summaries = borrowRepayApi.getCreditorSummaries();

    return {
      totalBorrowed,
      totalRepaid,
      netOutstanding: Math.max(0, totalBorrowed - totalRepaid),
      activeCreditorsCount: summaries.filter((s) => s.netBalance > 0).length,
      totalCreditorsCount: summaries.length,
    };
  },

  // ── Planned Repayments ────────────────────────────────────────────────────

  getPlannedRepayments: (): PlannedRepayment[] => {
    return readStorage(STORAGE_KEYS.PLANNED_REPAYMENTS, SEED_PLANNED_REPAYMENTS);
  },

  createPlannedRepayment: (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>): PlannedRepayment => {
    const current = borrowRepayApi.getPlannedRepayments();
    const newPlan: PlannedRepayment = {
      ...plan,
      id: generateId('pr'),
      plannedAmount: Math.abs(Number(plan.plannedAmount) || 0),
      createdAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.PLANNED_REPAYMENTS, [newPlan, ...current]);
    return newPlan;
  },

  updatePlannedRepayment: (id: string, updates: Partial<PlannedRepayment>): PlannedRepayment | null => {
    const current = borrowRepayApi.getPlannedRepayments();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedPlan: PlannedRepayment = {
      ...current[index],
      ...updates,
      plannedAmount: updates.plannedAmount !== undefined
        ? Math.abs(Number(updates.plannedAmount))
        : current[index].plannedAmount,
    };
    current[index] = updatedPlan;
    writeStorage(STORAGE_KEYS.PLANNED_REPAYMENTS, current);
    return updatedPlan;
  },

  deletePlannedRepayment: (id: string): void => {
    const filtered = borrowRepayApi.getPlannedRepayments().filter((p) => p.id !== id);
    writeStorage(STORAGE_KEYS.PLANNED_REPAYMENTS, filtered);
  },

  /** Mark a planned repayment as paid and create a corresponding actual repayment record */
  markPlannedRepaymentAsPaid: (id: string) => {
    const plan = borrowRepayApi.getPlannedRepayments().find((p) => p.id === id);
    if (!plan) return null;

    borrowRepayApi.updatePlannedRepayment(id, { status: 'Paid' });

    const record = borrowRepayApi.createRecord({
      creditorName: plan.creditorName,
      date: plan.targetDate || new Date().toISOString().split('T')[0],
      type: 'Repaid',
      amount: plan.plannedAmount,
      currency: 'INR',
      notes: `Planned Repayment: ${plan.notes || 'Settled'}`,
    });

    return { plan, record };
  },
};
