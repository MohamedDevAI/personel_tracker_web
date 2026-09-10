import axios from 'axios';
import { PlannedExpense } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const STORAGE_KEY = 'pt_planned_expenses';

export const plannedExpenseApi = {
  // Fetch live from MongoDB Atlas via Spring Boot API: /api/finance_planned
  fetchFromDb: async (month?: string, year?: number): Promise<PlannedExpense[]> => {
    try {
      const params: Record<string, any> = {};
      if (month && month !== 'ALL') params.month = month;
      if (year) params.year = year;
      const res = await axios.get<PlannedExpense[]>(`${API_BASE}/finance_planned`, { params, timeout: 6000 });
      if (Array.isArray(res.data)) {
        // Cache in localStorage for offline availability (merge by id so other months aren't lost)
        const currentStored = plannedExpenseApi.getPlannedExpenses();
        const map = new Map<string, PlannedExpense>();
        currentStored.forEach(p => map.set(p.id, p));
        res.data.forEach(p => map.set(p.id, p));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(map.values())));
        return res.data;
      }
    } catch (err) {
      console.warn('Could not fetch from /api/finance_planned, falling back to local storage:', err);
    }
    return plannedExpenseApi.getPlannedExpenses(month, year);
  },

  // Synchronous getter from cache / storage
  getPlannedExpenses: (filterMonth?: string, filterYear?: number): PlannedExpense[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PlannedExpense[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!filterMonth && !filterYear) return parsed;
          return parsed.filter(p => {
            const matchesM = !filterMonth || filterMonth === 'ALL' || p.month === filterMonth;
            const matchesY = !filterYear || p.year === filterYear;
            return matchesM && matchesY;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse local planned expenses:', e);
    }
    return [];
  },

  // Create planned expense in MongoDB
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
      createdAt: new Date().toISOString()
    };

    try {
      const res = await axios.post<PlannedExpense>(`${API_BASE}/finance_planned`, payload, { timeout: 6000 });
      if (res.data) {
        // update cache
        const all = plannedExpenseApi.getPlannedExpenses();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([res.data, ...all]));
        return res.data;
      }
    } catch (err) {
      console.warn('API create failed, saving to local cache:', err);
    }

    // Local fallback
    const localPlan: PlannedExpense = {
      ...payload,
      id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    const current = plannedExpenseApi.getPlannedExpenses();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([localPlan, ...current]));
    return localPlan;
  },

  // Update planned expense in MongoDB with full payload preservation
  updatePlannedExpense: async (id: string, updates: Partial<PlannedExpense>, fallbackBase?: PlannedExpense): Promise<PlannedExpense> => {
    const all = plannedExpenseApi.getPlannedExpenses();
    const existing = fallbackBase || all.find(p => p.id === id);
    const merged = { ...(existing || {}), ...updates, id };

    try {
      const res = await axios.put<PlannedExpense>(`${API_BASE}/finance_planned/${id}`, merged, { timeout: 6000 });
      if (res.data) {
        const updatedList = all.map(p => p.id === id ? res.data : p);
        if (!all.some(p => p.id === id)) {
          updatedList.push(res.data);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        return res.data;
      }
    } catch (err) {
      console.warn('API update failed, updating local cache:', err);
    }

    // Local fallback
    const index = all.findIndex(p => p.id === id);
    if (index === -1) {
      const fullPlan = merged as PlannedExpense;
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, fullPlan]));
      return fullPlan;
    }
    const updated = { ...all[index], ...updates };
    all[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return updated;
  },

  // Delete planned expense in MongoDB
  deletePlannedExpense: async (id: string): Promise<void> => {
    try {
      await axios.delete(`${API_BASE}/finance_planned/${id}`, { timeout: 6000 });
    } catch (err) {
      console.warn('API delete failed:', err);
    }
    const all = plannedExpenseApi.getPlannedExpenses().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  // Set fulfillment and payment
  setFulfillmentAndPayment: async (
    id: string, 
    isFulfilled: boolean, 
    paidAmount?: number,
    existingPlan?: PlannedExpense
  ): Promise<PlannedExpense> => {
    const current = existingPlan || plannedExpenseApi.getPlannedExpenses().find(p => p.id === id);
    const plannedAmt = current?.plannedAmount || 0;
    const finalPaid = paidAmount !== undefined && paidAmount !== null
      ? Math.max(0, Number(paidAmount))
      : (isFulfilled ? plannedAmt : 0);
    const finalFulfilled = isFulfilled || finalPaid >= plannedAmt;
    const status = finalFulfilled 
      ? 'Fulfilled' 
      : (finalPaid > 0 ? 'Partial' : 'Planned');

    const updates: Partial<PlannedExpense> = {
      ...(current || {}),
      isFulfilled: finalFulfilled,
      paidAmount: finalPaid,
      status
    };
    return plannedExpenseApi.updatePlannedExpense(id, updates, current);
  },

  // Calculate monthly summary
  getMonthlyBudgetSummary: (
    plansOrMonth: PlannedExpense[] | string,
    actualOrYear?: Record<string, number> | number,
    actualCategoryExpensesRecord: Record<string, number> = {}
  ) => {
    let plans: PlannedExpense[] = [];
    let actualCategoryExpenses: Record<string, number> = {};

    if (Array.isArray(plansOrMonth)) {
      plans = plansOrMonth;
      actualCategoryExpenses = (actualOrYear && typeof actualOrYear === 'object') ? (actualOrYear as Record<string, number>) : {};
    } else {
      const month = plansOrMonth;
      const year = typeof actualOrYear === 'number' ? actualOrYear : undefined;
      plans = plannedExpenseApi.getPlannedExpenses(month, year);
      actualCategoryExpenses = actualCategoryExpensesRecord || {};
    }
    const totalPlanned = plans.reduce((acc, p) => acc + Number(p.plannedAmount || 0), 0);

    const totalPaid = plans.reduce((acc, p) => {
      const paid = p.paidAmount !== undefined && p.paidAmount !== null 
        ? Number(p.paidAmount) 
        : (p.isFulfilled || p.status === 'Fulfilled' ? Number(p.plannedAmount || 0) : 0);
      return acc + paid;
    }, 0);

    const totalRemaining = plans.reduce((acc, p) => {
      const planned = Number(p.plannedAmount || 0);
      const paid = p.paidAmount !== undefined && p.paidAmount !== null 
        ? Number(p.paidAmount) 
        : (p.isFulfilled || p.status === 'Fulfilled' ? planned : 0);
      return acc + Math.max(0, planned - paid);
    }, 0);

    const totalOverpaid = plans.reduce((acc, p) => {
      const planned = Number(p.plannedAmount || 0);
      const paid = p.paidAmount !== undefined && p.paidAmount !== null 
        ? Number(p.paidAmount) 
        : (p.isFulfilled || p.status === 'Fulfilled' ? planned : 0);
      return acc + Math.max(0, paid - planned);
    }, 0);

    const fulfilledCount = plans.filter(p => p.isFulfilled || p.status === 'Fulfilled' || ((p.paidAmount ?? 0) >= p.plannedAmount)).length;
    const fulfillmentRate = totalPlanned > 0 ? Math.min(100, Math.round((totalPaid / totalPlanned) * 100)) : 0;

    let totalActualSpent = 0;
    const categoryVariance: Array<{
      category: string;
      planned: number;
      actual: number;
      variance: number;
      percentage: number;
    }> = [];

    const groupedPlans: Record<string, number> = {};
    for (const p of plans) {
      if (p.category && p.category.trim()) {
        groupedPlans[p.category] = (groupedPlans[p.category] || 0) + Number(p.plannedAmount || 0);
      }
    }

    for (const [cat, plannedAmt] of Object.entries(groupedPlans)) {
      const actualAmt = actualCategoryExpenses[cat] || 0;
      totalActualSpent += actualAmt;
      const variance = plannedAmt - actualAmt;
      const percentage = plannedAmt > 0 ? Math.min(100, Math.round((actualAmt / plannedAmt) * 100)) : 0;
      categoryVariance.push({
        category: cat,
        planned: plannedAmt,
        actual: actualAmt,
        variance,
        percentage
      });
    }

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
      categoryVariance
    };
  }
};
