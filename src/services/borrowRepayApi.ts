/**
 * Borrow & Repay API service.
 * Handles CRUD operations for borrow/repay records and planned repayments
 * via Spring Boot + MongoDB Atlas.
 */

import apiClient from './apiClient';
import { BorrowRepayRecord, CreditorSummary, PlannedRepayment } from '../interface';
import { getLocalDateISO } from '../utils/dateHelpers';
import { plannedRepayCreditApi } from './plannedRepayCreditApi';

function parseDateToTimestamp(dStr: string): number {
  if (!dStr) return 0;
  if (dStr.includes('/')) {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10) - 1;
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d).getTime();
    }
  }
  const t = new Date(dStr).getTime();
  return isNaN(t) ? 0 : t;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export const borrowRepayApi = {
  // ── Borrow/Repay Records ──────────────────────────────────────────────────

  /** Fetch all borrow/repay records from MongoDB. */
  getRecords: async (): Promise<BorrowRepayRecord[]> => {
    const { data } = await apiClient.get<BorrowRepayRecord[]>('/borrow-repay', { timeout: 6000 });
    return Array.isArray(data) ? data : [];
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
  updateRecord: async (
    id: string,
    updates: Partial<BorrowRepayRecord>,
    existingRecord?: BorrowRepayRecord
  ): Promise<BorrowRepayRecord | null> => {
    let base = existingRecord;
    if (!base) {
      try {
        const all = await borrowRepayApi.getRecords();
        base = all.find(r => r.id === id);
      } catch {}
    }
    const merged = {
      ...(base || {}),
      ...updates,
      ...(updates.amount !== undefined ? { amount: Math.abs(Number(updates.amount)) } : {}),
      id,
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
      displayName: string;
      totalBorrowed: number;
      totalRepaid: number;
      creditGiven: number;
      txCount: number;
      dates: string[];
    }> = {};

    for (const r of list) {
      if (!r || typeof r !== 'object') continue;
      const rawName = (r.creditorName || '').trim() || 'Unknown';
      const key = rawName.toLowerCase();
      if (!creditorMap[key]) {
        creditorMap[key] = {
          displayName: rawName,
          totalBorrowed: 0,
          totalRepaid: 0,
          creditGiven: 0,
          txCount: 0,
          dates: [],
        };
      }
      creditorMap[key].txCount += 1;
      const amt = Number(r.amount) || 0;
      if (r.type === 'Credit Given' || (r.type === 'Borrow' && amt < 0)) {
        creditorMap[key].creditGiven += Math.abs(amt);
      } else if (r.type === 'Borrow') {
        creditorMap[key].totalBorrowed += Math.abs(amt);
      } else {
        creditorMap[key].totalRepaid += Math.abs(amt);
      }
      if (r.date) {
        creditorMap[key].dates.push(r.date);
      }
    }

    return Object.values(creditorMap).map((data) => {
      // Net balance: positive means we owe them; negative means we gave them credit / overpaid
      const netBalance = data.totalBorrowed - data.totalRepaid - data.creditGiven;
      let status: CreditorSummary['status'] = 'Settled';
      if (netBalance > 0) {
        status = 'Outstanding';
      } else if (netBalance < 0) {
        if (data.creditGiven > 0) {
          status = 'Credit Given';
        } else {
          status = 'Overpaid';
        }
      }

      const sortedDates = [...data.dates].sort((a, b) => {
        const tA = parseDateToTimestamp(a);
        const tB = parseDateToTimestamp(b);
        return tA - tB;
      });
      const lastActivityDate = sortedDates[sortedDates.length - 1] || 'N/A';

      return {
        creditorName: data.displayName,
        totalBorrowed: data.totalBorrowed,
        totalRepaid: data.totalRepaid,
        creditGiven: data.creditGiven,
        txCount: data.txCount,
        netBalance,
        lastActivityDate,
        status,
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
      if (r.type === 'Credit Given' || (r.type === 'Borrow' && amt < 0)) {
        totalCreditGiven += Math.abs(amt);
      } else if (r.type === 'Borrow') {
        totalBorrowed += Math.abs(amt);
      } else {
        totalRepaid += Math.abs(amt);
      }
    }

    const summaries = borrowRepayApi.getCreditorSummaries(list);
    const netOutstanding = summaries
      .filter(s => s.netBalance > 0)
      .reduce((acc, s) => acc + s.netBalance, 0);

    const totalOverpaid = summaries
      .filter(s => s.status === 'Overpaid')
      .reduce((acc, s) => acc + Math.abs(s.netBalance), 0);

    return {
      totalBorrowed,
      totalRepaid,
      totalCreditGiven,
      netOutstanding,
      totalOverpaid,
      activeCreditorsCount: summaries.filter(s => s.netBalance > 0).length,
      settledCreditorsCount: summaries.filter(s => s.netBalance === 0).length,
      creditGivenCreditorsCount: summaries.filter(s => s.status === 'Credit Given' || (s.creditGiven && s.creditGiven > 0)).length,
      overpaidCreditorsCount: summaries.filter(s => s.status === 'Overpaid').length,
      totalCreditorsCount: summaries.length,
      totalTransactions: list.length,
    };
  },

  // ── Planned Repayments ────────────────────────────────────────────────────

  /** Fetch all planned repayments from MongoDB. */
  getPlannedRepayments: async (): Promise<PlannedRepayment[]> => {
    const { data } = await apiClient.get<PlannedRepayment[]>('/planned-repayments', { timeout: 6000 });
    return Array.isArray(data) ? data : [];
  },

  /** Create a planned repayment in MongoDB. */
  createPlannedRepayment: async (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>): Promise<PlannedRepayment> => {
    const payload = {
      ...plan,
      plannedAmount: Math.abs(Number(plan.plannedAmount) || 0),
      currency: plan.currency || 'INR',
      createdAt: new Date().toISOString(),
    };

    const { data } = await apiClient.post<PlannedRepayment>('/planned-repayments', payload);
    return data;
  },

  /** Update a planned repayment in MongoDB. */
  updatePlannedRepayment: async (
    id: string,
    updates: Partial<PlannedRepayment>,
    existingPlan?: PlannedRepayment
  ): Promise<PlannedRepayment | null> => {
    let base = existingPlan;
    if (!base) {
      try {
        const all = await borrowRepayApi.getPlannedRepayments();
        base = all.find(p => p.id === id);
      } catch {}
    }
    const payload = {
      ...(base || {}),
      ...updates,
      ...(updates.plannedAmount !== undefined ? { plannedAmount: Math.abs(Number(updates.plannedAmount)) } : {}),
      id,
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

    // Idempotency guard: prevent duplicate repayment records if already paid
    if (plan.status === 'Paid') {
      return { plan, record: null };
    }

    // 1. Create the repayment record first so failure leaves no orphan Paid status
    const record = await borrowRepayApi.createRecord({
      creditorName: plan.creditorName,
      date: plan.targetDate || getLocalDateISO(),
      type: 'Repaid',
      amount: plan.plannedAmount,
      currency: plan.currency || 'INR',
      notes: `Planned Repayment: ${plan.notes || 'Settled'}`,
    });

    // 2. Mark the plan as Paid
    let updatedPlan: PlannedRepayment | null = null;
    try {
      updatedPlan = await borrowRepayApi.updatePlannedRepayment(id, { status: 'Paid' }, plan);
    } catch (err) {
      console.error('Failed to update plan status to Paid after creating record:', err);
      throw err;
    }

    // 3. Keep /planned-repay-credit matrix item in sync (mark Completed)
    try {
      const allCreditItems = await plannedRepayCreditApi.getAll();
      const normCreditor = plan.creditorName.trim().toLowerCase();
      const matchingCreditItem = allCreditItems.find(
        (ci) =>
          ci.creditorName.trim().toLowerCase() === normCreditor &&
          ci.targetDate === plan.targetDate &&
          ci.status !== 'Completed'
      );
      if (matchingCreditItem) {
        const cId = matchingCreditItem.id || matchingCreditItem._id;
        if (cId) {
          await plannedRepayCreditApi.updateStatus(cId, 'Completed');
        }
      }
    } catch (e) {
      console.warn('Could not sync planned-repay-credit matrix status:', e);
    }

    return { plan: updatedPlan || plan, record };
  },
};
