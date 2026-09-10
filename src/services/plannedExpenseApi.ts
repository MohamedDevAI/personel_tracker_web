/**
 * Planned Expenses API service.
 * Handles CRUD for planned monthly expenses (SAR) via Spring Boot + MongoDB Atlas,
 * with localStorage cache for offline availability.
 */

import apiClient from './apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import type { PlannedExpense } from '../types';

// ─── Local Storage Helpers ────────────────────────────────────────────────────

const readCache = (): PlannedExpense[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PLANNED_EXPENSES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local planned expenses:', e);
  }
  return [];
};

const writeCache = (data: PlannedExpense[]): void => {
  localStorage.setItem(STORAGE_KEYS.PLANNED_EXPENSES, JSON.stringify(data));
};

const generateId = (): string => {
  return `pe-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// ─── API Methods ──────────────────────────────────────────────────────────────

export const plannedExpenseApi = {
  /**
   * Fetch planned expenses from MongoDB via Spring Boot API.
   * Falls back to localStorage cache on failure.
   */
  fetchFromDb: async (month?: string, year?: number): Promise<PlannedExpense[]> => {
    try {
      const params: Record<string, any> = {};
      if (month && month !== 'ALL') params.month = month;
      if (year) params.year = year;

      const { data } = await apiClient.get<PlannedExpense[]>('/finance_planned', { params });

      if (Array.isArray(data)) {
        // Merge into cache so other months aren't lost
        const currentStored = readCache();
        const map = new Map<string, PlannedExpense>();
        currentStored.forEach((p) => map.set(p.id, p));
        data.forEach((p) => map.set(p.id, p));
        writeCache(Array.from(map.values()));
        return data;
      }
    } catch (err) {
      console.warn('Could not fetch from /api/finance_planned, falling back to local storage:', err);
    }
    return plannedExpenseApi.getPlannedExpenses(month, year);
  },

  /** Synchronous getter from localStorage cache */
  getPlannedExpenses: (filterMonth?: string, filterYear?: number): PlannedExpense[] => {
    const all = readCache();
    if (!filterMonth && !filterYear) return all;

    return all.filter((p) => {
      const matchesMonth = !filterMonth || filterMonth === 'ALL' || p.month === filterMonth;
      const matchesYear = !filterYear || p.year === filterYear;
      return matchesMonth && matchesYear;
    });
  },

  /** Create a planned expense in MongoDB, with local fallback */
  createPlannedExpense: async (plan: Omit<PlannedExpense, 'id' | 'createdAt'>): Promise<PlannedExpense> => {
    const plannedAmt = Math.abs(Number(plan.plannedAmount) || 0);
    const isFulfilled = plan.isFulfilled ?? (plan.status === 'Fulfilled');
    const paidAmt = isFulfilled
      ? plannedAmt
      : (plan.paidAmount !== undefined ? Math.max(0, Number(plan.paidAmount)) : 0);
    const status = isFulfilled ? 'Fulfilled' : (paidAmt > 0 ? 'Partial' : (plan.status || 'Planned'));

    const payload = {
      ...plan,
      plannedAmount: plannedAmt,
      paidAmount: paidAmt,
      isFulfilled,
      status,
      currency: 'SAR',
      createdAt: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post<PlannedExpense>('/finance_planned', payload);
      if (data) {
        writeCache([data, ...readCache()]);
        return data;
      }
    } catch (err) {
      console.warn('API create failed, saving to local cache:', err);
    }

    // Local fallback
    const localPlan: PlannedExpense = { ...payload, id: generateId() };
    writeCache([localPlan, ...readCache()]);
    return localPlan;
  },

  /** Update a planned expense in MongoDB with full payload preservation */
  updatePlannedExpense: async (
    id: string,
    updates: Partial<PlannedExpense>,
    fallbackBase?: PlannedExpense
  ): Promise<PlannedExpense> => {
    const all = readCache();
    const existing = fallbackBase || all.find((p) => p.id === id);
    const merged = { ...(existing || {}), ...updates, id };

    try {
      const { data } = await apiClient.put<PlannedExpense>(`/finance_planned/${id}`, merged);
      if (data) {
        const updatedList = all.map((p) => (p.id === id ? data : p));
        if (!all.some((p) => p.id === id)) updatedList.push(data);
        writeCache(updatedList);
        return data;
      }
    } catch (err) {
      console.warn('API update failed, updating local cache:', err);
    }

    // Local fallback
    const index = all.findIndex((p) => p.id === id);
    if (index === -1) {
      const fullPlan = merged as PlannedExpense;
      writeCache([...all, fullPlan]);
      return fullPlan;
    }
    const updated = { ...all[index], ...updates };
    all[index] = updated;
    writeCache(all);
    return updated;
  },

  /** Delete a planned expense from MongoDB and local cache */
  deletePlannedExpense: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/finance_planned/${id}`);
    } catch (err) {
      console.warn('API delete failed:', err);
    }
    writeCache(readCache().filter((p) => p.id !== id));
  },

  /** Set fulfillment status and payment amount for a planned expense */
  setFulfillmentAndPayment: async (
    id: string,
    isFulfilled: boolean,
    paidAmount?: number,
    existingPlan?: PlannedExpense
  ): Promise<PlannedExpense> => {
    const current = existingPlan || readCache().find((p) => p.id === id);
    const plannedAmt = current?.plannedAmount || 0;

    const finalPaid = paidAmount !== undefined && paidAmount !== null
      ? Math.max(0, Number(paidAmount))
      : (isFulfilled ? plannedAmt : 0);

    const finalFulfilled = isFulfilled || finalPaid >= plannedAmt;
    const status = finalFulfilled ? 'Fulfilled' : (finalPaid > 0 ? 'Partial' : 'Planned');

    const updates: Partial<PlannedExpense> = {
      ...(current || {}),
      isFulfilled: finalFulfilled,
      paidAmount: finalPaid,
      status,
    };

    return plannedExpenseApi.updatePlannedExpense(id, updates, current);
  },

  /** Calculate monthly budget summary with category variance analysis */
  getMonthlyBudgetSummary: (
    plans: PlannedExpense[],
    actualCategoryExpenses: Record<string, number> = {}
  ) => {
    const totalPlanned = plans.reduce((acc, p) => acc + Number(p.plannedAmount || 0), 0);

    const getPaidAmount = (p: PlannedExpense): number => {
      if (p.paidAmount !== undefined && p.paidAmount !== null) return Number(p.paidAmount);
      if (p.isFulfilled || p.status === 'Fulfilled') return Number(p.plannedAmount || 0);
      return 0;
    };

    const totalPaid = plans.reduce((acc, p) => acc + getPaidAmount(p), 0);

    const totalRemaining = plans.reduce((acc, p) => {
      const planned = Number(p.plannedAmount || 0);
      return acc + Math.max(0, planned - getPaidAmount(p));
    }, 0);

    const totalOverpaid = plans.reduce((acc, p) => {
      const planned = Number(p.plannedAmount || 0);
      return acc + Math.max(0, getPaidAmount(p) - planned);
    }, 0);

    const fulfilledCount = plans.filter(
      (p) => p.isFulfilled || p.status === 'Fulfilled' || ((p.paidAmount ?? 0) >= p.plannedAmount)
    ).length;

    const fulfillmentRate = totalPlanned > 0
      ? Math.min(100, Math.round((totalPaid / totalPlanned) * 100))
      : 0;

    // Category variance analysis
    let totalActualSpent = 0;
    const groupedPlans: Record<string, number> = {};

    for (const p of plans) {
      if (p.category?.trim()) {
        groupedPlans[p.category] = (groupedPlans[p.category] || 0) + Number(p.plannedAmount || 0);
      }
    }

    const categoryVariance = Object.entries(groupedPlans).map(([cat, plannedAmt]) => {
      const actualAmt = actualCategoryExpenses[cat] || 0;
      totalActualSpent += actualAmt;
      return {
        category: cat,
        planned: plannedAmt,
        actual: actualAmt,
        variance: plannedAmt - actualAmt,
        percentage: plannedAmt > 0 ? Math.min(100, Math.round((actualAmt / plannedAmt) * 100)) : 0,
      };
    });

    return {
      plans,
      totalPlanned,
      totalPaid,
      totalRemaining,
      totalOverpaid,
      fulfilledCount,
      totalItems: plans.length,
      fulfillmentRate,
      totalActualSpent,
      remainingBudget: totalPlanned - totalActualSpent,
      adherenceRate: totalPlanned > 0 ? Math.min(100, Math.round((totalActualSpent / totalPlanned) * 100)) : 0,
      categoryVariance,
    };
  },
};
