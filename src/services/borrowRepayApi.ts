/**
 * Borrow & Repay API service.
 * Handles CRUD operations for borrow/repay records and planned repayments
 * via Spring Boot + MongoDB Atlas.
 */

import apiClient from './apiClient';
import { BorrowRepayRecord, CreditorSummary, PlannedRepayment } from '../interface';

// ─── API Methods ──────────────────────────────────────────────────────────────

export const borrowRepayApi = {
  // ── Borrow/Repay Records ──────────────────────────────────────────────────

  /** Fetch all borrow/repay records from MongoDB. */
  getRecords: async (): Promise<BorrowRepayRecord[]> => {
    try {
      const { data } = await apiClient.get<BorrowRepayRecord[]>('/borrow-repay', { timeout: 6000 });
      if (Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Unable to fetch borrow/repay records from API:', e);
    }
    return [];
  },



  /** Create a new borrow/repay record in MongoDB. */
  createRecord: async (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>): Promise<BorrowRepayRecord> => {
    const payload = {
      ...record,
      amount: Math.abs(Number(record.amount) || 0),
      currency: record.currency || 'INR',
      createdAt: new Date().toISOString(),
    };

    const { data } = await apiClient.post<BorrowRepayRecord>('/borrow-repay', payload);
    return data;
  },

  /** Update an existing borrow/repay record in MongoDB. */
  updateRecord: async (id: string, updates: Partial<BorrowRepayRecord>): Promise<BorrowRepayRecord | null> => {
    const merged = {
      ...updates,
      ...(updates.amount !== undefined ? { amount: Math.abs(Number(updates.amount)) } : {}),
    };

    const { data } = await apiClient.put<BorrowRepayRecord>(`/borrow-repay/${id}`, merged);
    return data || null;
  },

  /** Delete a borrow/repay record from MongoDB. */
  deleteRecord: async (id: string): Promise<void> => {
    await apiClient.delete(`/borrow-repay/${id}`);
  },

  // ── Creditor Summaries (computed from passed records) ──────────────────────

  getCreditorSummaries: (records: BorrowRepayRecord[] = []): CreditorSummary[] => {
    const list = Array.isArray(records) ? records : [];

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

  getOverallStats: (records: BorrowRepayRecord[] = []) => {
    const list = Array.isArray(records) ? records : [];
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

  /** Fetch all planned repayments from MongoDB. */
  getPlannedRepayments: async (): Promise<PlannedRepayment[]> => {
    try {
      const { data } = await apiClient.get<PlannedRepayment[]>('/planned-repayments', { timeout: 6000 });
      if (Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn('Unable to fetch planned repayments from API:', e);
    }
    return [];
  },


  /** Create a planned repayment in MongoDB. */
  createPlannedRepayment: async (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>): Promise<PlannedRepayment> => {
    const payload = {
      ...plan,
      plannedAmount: Math.abs(Number(plan.plannedAmount) || 0),
      createdAt: new Date().toISOString(),
    };

    const { data } = await apiClient.post<PlannedRepayment>('/planned-repayments', payload);
    return data;
  },

  /** Update a planned repayment in MongoDB. */
  updatePlannedRepayment: async (id: string, updates: Partial<PlannedRepayment>): Promise<PlannedRepayment | null> => {
    const payload = {
      ...updates,
      ...(updates.plannedAmount !== undefined ? { plannedAmount: Math.abs(Number(updates.plannedAmount)) } : {}),
    };

    const { data } = await apiClient.put<PlannedRepayment>(`/planned-repayments/${id}`, payload);
    return data || null;
  },

  /** Delete a planned repayment from MongoDB. */
  deletePlannedRepayment: async (id: string): Promise<void> => {
    await apiClient.delete(`/planned-repayments/${id}`);
  },

  /**
   * Mark a planned repayment as paid and create a corresponding actual repayment record.
   * Both operations hit the API (update planned + create record).
   */
  markPlannedRepaymentAsPaid: async (id: string, planData?: PlannedRepayment) => {
    let plan = planData;
    if (!plan) {
      const all = await borrowRepayApi.getPlannedRepayments();
      plan = all.find(p => p.id === id);
    }
    if (!plan) return null;

    const updatedPlan = await borrowRepayApi.updatePlannedRepayment(id, { status: 'Paid' });

    const record = await borrowRepayApi.createRecord({
      creditorName: plan.creditorName,
      date: plan.targetDate || new Date().toISOString().split('T')[0],
      type: 'Repaid',
      amount: plan.plannedAmount,
      currency: 'INR',
      notes: `Planned Repayment: ${plan.notes || 'Settled'}`,
    });

    return { plan: updatedPlan || plan, record };
  },
};
