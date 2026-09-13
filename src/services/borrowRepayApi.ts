/**
 * Borrow & Repay API service.
 * Handles CRUD operations for borrow/repay records and planned repayments
 * via Spring Boot + MongoDB Atlas, with localStorage cache fallback.
 */

import apiClient from './apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import { SEED_BORROW_REPAY_RECORDS, SEED_PLANNED_REPAYMENTS } from './seedData';
import type {
  BorrowRepayRecord,
  CreditorSummary,
  PlannedRepayment,
} from '../types';

// ─── Local Storage Cache Helpers ──────────────────────────────────────────────

const readCache = <T>(key: string, seed: T[] = []): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(`Failed to load ${key}:`, e);
  }
  // Return seed as initial default
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
};

const writeCache = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getCachedRecords = (): BorrowRepayRecord[] =>
  readCache<BorrowRepayRecord>(STORAGE_KEYS.BORROW_REPAY, SEED_BORROW_REPAY_RECORDS);

const getCachedPlans = (): PlannedRepayment[] =>
  readCache<PlannedRepayment>(STORAGE_KEYS.PLANNED_REPAYMENTS, SEED_PLANNED_REPAYMENTS);

// ─── API Methods ──────────────────────────────────────────────────────────────

export const borrowRepayApi = {
  // ── Borrow/Repay Records ──────────────────────────────────────────────────

  /** Fetch all borrow/repay records from MongoDB. Falls back to localStorage cache. */
  getRecords: async (): Promise<BorrowRepayRecord[]> => {
    try {
      const { data } = await apiClient.get<BorrowRepayRecord[]>('/borrow-repay', { timeout: 6000 });
      if (Array.isArray(data)) {
        writeCache(STORAGE_KEYS.BORROW_REPAY, data);
        return data;
      }
    } catch (e) {
      console.warn('Unable to fetch borrow/repay records from API, using local cache:', e);
    }
    return getCachedRecords();
  },

  /** Synchronous getter from localStorage cache (for derived computations) */
  getRecordsSync: (): BorrowRepayRecord[] => {
    return getCachedRecords();
  },

  /** Create a new borrow/repay record in MongoDB, with local cache fallback. */
  createRecord: async (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>): Promise<BorrowRepayRecord> => {
    const payload = {
      ...record,
      amount: Math.abs(Number(record.amount) || 0),
      currency: record.currency || 'INR',
      createdAt: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post<BorrowRepayRecord>('/borrow-repay', payload);
      if (data) {
        const cached = getCachedRecords();
        writeCache(STORAGE_KEYS.BORROW_REPAY, [data, ...cached]);
        return data;
      }
    } catch (e) {
      console.warn('API create failed, saving to local cache:', e);
    }

    // Local fallback
    const localRecord: BorrowRepayRecord = {
      ...payload,
      id: `br-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    const cached = getCachedRecords();
    writeCache(STORAGE_KEYS.BORROW_REPAY, [localRecord, ...cached]);
    return localRecord;
  },

  /** Update an existing borrow/repay record in MongoDB. */
  updateRecord: async (id: string, updates: Partial<BorrowRepayRecord>): Promise<BorrowRepayRecord | null> => {
    const cached = getCachedRecords();
    const existing = cached.find(r => r.id === id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      amount: updates.amount !== undefined ? Math.abs(Number(updates.amount)) : existing.amount,
    };

    try {
      const { data } = await apiClient.put<BorrowRepayRecord>(`/borrow-repay/${id}`, merged);
      if (data) {
        const updatedList = cached.map(r => (r.id === id ? data : r));
        writeCache(STORAGE_KEYS.BORROW_REPAY, updatedList);
        return data;
      }
    } catch (e) {
      console.warn('API update failed, updating local cache:', e);
    }

    // Local fallback
    const updatedList = cached.map(r => (r.id === id ? merged : r));
    writeCache(STORAGE_KEYS.BORROW_REPAY, updatedList);
    return merged;
  },

  /** Delete a borrow/repay record from MongoDB and local cache. */
  deleteRecord: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/borrow-repay/${id}`);
    } catch (e) {
      console.warn('API delete failed:', e);
    }
    const filtered = getCachedRecords().filter(r => r.id !== id);
    writeCache(STORAGE_KEYS.BORROW_REPAY, filtered);
  },

  // ── Creditor Summaries (computed from cached data or passed records) ──────

  getCreditorSummaries: (records?: BorrowRepayRecord[]): CreditorSummary[] => {
    const list = Array.isArray(records) ? records : borrowRepayApi.getRecordsSync();
    if (!Array.isArray(list)) return [];

    const creditorMap: Record<string, {
      totalBorrowed: number;
      totalRepaid: number;
      creditGiven: number;
      txCount: number;
      dates: string[];
    }> = {};

    for (const r of list) {
      if (!r || typeof r !== 'object') continue;
      const name = (r.creditorName || '').trim() || 'Unknown';
      if (!creditorMap[name]) {
        creditorMap[name] = { totalBorrowed: 0, totalRepaid: 0, creditGiven: 0, txCount: 0, dates: [] };
      }
      creditorMap[name].txCount += 1;
      const amt = Number(r.amount) || 0;
      if (r.type === 'Borrow') {
        if (amt < 0) {
          creditorMap[name].creditGiven += Math.abs(amt);
        } else {
          creditorMap[name].totalBorrowed += amt;
        }
      } else {
        creditorMap[name].totalRepaid += Math.abs(amt);
      }
      if (r.date) {
        creditorMap[name].dates.push(r.date);
      }
    }

    return Object.entries(creditorMap).map(([creditorName, data]) => {
      // Net balance: positive means we owe them; negative means we gave them credit / overpaid
      const netBalance = data.totalBorrowed - data.totalRepaid - data.creditGiven;
      let status: CreditorSummary['status'] = 'Settled';
      if (netBalance > 0) status = 'Outstanding';
      else if (netBalance < 0) status = 'Overpaid';

      const sortedDates = data.dates.sort();
      const lastActivityDate = sortedDates[sortedDates.length - 1] || 'N/A';

      return {
        creditorName,
        totalBorrowed: data.totalBorrowed,
        totalRepaid: data.totalRepaid,
        creditGiven: data.creditGiven,
        txCount: data.txCount,
        netBalance,
        lastActivityDate,
        status
      };
    });
  },

  // ── Overall Stats (computed from records) ─────────────────────────────────

  getOverallStats: (records?: BorrowRepayRecord[]) => {
    const list = Array.isArray(records) ? records : borrowRepayApi.getRecordsSync();
    if (!Array.isArray(list)) {
      return {
        totalBorrowed: 0,
        totalRepaid: 0,
        totalCreditGiven: 0,
        netOutstanding: 0,
        activeCreditorsCount: 0,
        settledCreditorsCount: 0,
        creditGivenCreditorsCount: 0,
        totalCreditorsCount: 0,
        totalTransactions: 0,
      };
    }

    let totalBorrowed = 0;
    let totalRepaid = 0;
    let totalCreditGiven = 0;

    for (const r of list) {
      if (!r || typeof r !== 'object') continue;
      const amt = Number(r.amount) || 0;
      if (r.type === 'Borrow') {
        if (amt < 0) {
          totalCreditGiven += Math.abs(amt);
        } else {
          totalBorrowed += amt;
        }
      } else {
        totalRepaid += Math.abs(amt);
      }
    }

    const summaries = borrowRepayApi.getCreditorSummaries(list);
    const netOutstanding = summaries
      .filter(s => s.netBalance > 0)
      .reduce((acc, s) => acc + s.netBalance, 0);

    return {
      totalBorrowed,
      totalRepaid,
      totalCreditGiven,
      netOutstanding,
      activeCreditorsCount: summaries.filter(s => s.netBalance > 0).length,
      settledCreditorsCount: summaries.filter(s => s.netBalance === 0).length,
      creditGivenCreditorsCount: summaries.filter(s => s.netBalance < 0).length,
      totalCreditorsCount: summaries.length,
      totalTransactions: list.length,
    };
  },

  // ── Planned Repayments ────────────────────────────────────────────────────

  /** Fetch all planned repayments from MongoDB. Falls back to localStorage cache. */
  getPlannedRepayments: async (): Promise<PlannedRepayment[]> => {
    try {
      const { data } = await apiClient.get<PlannedRepayment[]>('/planned-repayments', { timeout: 6000 });
      if (Array.isArray(data)) {
        writeCache(STORAGE_KEYS.PLANNED_REPAYMENTS, data);
        return data;
      }
    } catch (e) {
      console.warn('Unable to fetch planned repayments from API, using local cache:', e);
    }
    return getCachedPlans();
  },

  /** Synchronous getter from localStorage cache */
  getPlannedRepaymentsSync: (): PlannedRepayment[] => {
    return getCachedPlans();
  },

  /** Create a planned repayment in MongoDB with local fallback. */
  createPlannedRepayment: async (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>): Promise<PlannedRepayment> => {
    const payload = {
      ...plan,
      plannedAmount: Math.abs(Number(plan.plannedAmount) || 0),
      createdAt: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post<PlannedRepayment>('/planned-repayments', payload);
      if (data) {
        const cached = getCachedPlans();
        writeCache(STORAGE_KEYS.PLANNED_REPAYMENTS, [data, ...cached]);
        return data;
      }
    } catch (e) {
      console.warn('API create failed, saving to local cache:', e);
    }

    // Local fallback
    const localPlan: PlannedRepayment = {
      ...payload,
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    const cached = getCachedPlans();
    writeCache(STORAGE_KEYS.PLANNED_REPAYMENTS, [localPlan, ...cached]);
    return localPlan;
  },

  /** Update a planned repayment in MongoDB. */
  updatePlannedRepayment: async (id: string, updates: Partial<PlannedRepayment>): Promise<PlannedRepayment | null> => {
    const cached = getCachedPlans();
    const existing = cached.find(p => p.id === id);
    if (!existing) return null;

    const merged: PlannedRepayment = {
      ...existing,
      ...updates,
      plannedAmount: updates.plannedAmount !== undefined
        ? Math.abs(Number(updates.plannedAmount))
        : existing.plannedAmount,
    };

    try {
      const { data } = await apiClient.put<PlannedRepayment>(`/planned-repayments/${id}`, merged);
      if (data) {
        const updatedList = cached.map(p => (p.id === id ? data : p));
        writeCache(STORAGE_KEYS.PLANNED_REPAYMENTS, updatedList);
        return data;
      }
    } catch (e) {
      console.warn('API update failed, updating local cache:', e);
    }

    // Local fallback
    const updatedList = cached.map(p => (p.id === id ? merged : p));
    writeCache(STORAGE_KEYS.PLANNED_REPAYMENTS, updatedList);
    return merged;
  },

  /** Delete a planned repayment from MongoDB and local cache. */
  deletePlannedRepayment: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/planned-repayments/${id}`);
    } catch (e) {
      console.warn('API delete failed:', e);
    }
    const filtered = getCachedPlans().filter(p => p.id !== id);
    writeCache(STORAGE_KEYS.PLANNED_REPAYMENTS, filtered);
  },

  /**
   * Mark a planned repayment as paid and create a corresponding actual repayment record.
   * Both operations hit the API (update planned + create record).
   */
  markPlannedRepaymentAsPaid: async (id: string) => {
    const cached = getCachedPlans();
    const plan = cached.find(p => p.id === id);
    if (!plan) return null;

    await borrowRepayApi.updatePlannedRepayment(id, { status: 'Paid' });

    const record = await borrowRepayApi.createRecord({
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
