/**
 * Planned Expenses API service.
 * Handles CRUD for planned monthly expenses (SAR) via Spring Boot + MongoDB Atlas,
 * with localStorage cache for offline availability.
 */

import apiClient from './apiClient';
import type { PlannedExpense } from '../types';

// ─── API Methods ──────────────────────────────────────────────────────────────

export const plannedExpenseApi = {
  /**
   * Fetch planned expenses from MongoDB via Spring Boot API.
   */
  fetchFromDb: async (month?: string, year?: number): Promise<PlannedExpense[]> => {
    const params: Record<string, any> = {};
    if (month && month !== 'ALL') params.month = month;
    if (year) params.year = year;

    const { data } = await apiClient.get<PlannedExpense[]>('/finance_planned', { params });
    return Array.isArray(data) ? data : [];
  },

  /** Create a planned expense in MongoDB */
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

    const { data } = await apiClient.post<PlannedExpense>('/finance_planned', payload);
    return data;
  },

  /** Update a planned expense in MongoDB */
  updatePlannedExpense: async (
    id: string,
    updates: Partial<PlannedExpense>,
    fallbackBase?: PlannedExpense
  ): Promise<PlannedExpense> => {
    const merged = { ...(fallbackBase || {}), ...updates, id };
    const { data } = await apiClient.put<PlannedExpense>(`/finance_planned/${id}`, merged);
    return data;
  },

  /** Delete a planned expense from MongoDB */
  deletePlannedExpense: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance_planned/${id}`);
  },

  /** Set fulfillment status and payment amount for a planned expense */
  setFulfillmentAndPayment: async (
    id: string,
    isFulfilled: boolean,
    paidAmount?: number,
    existingPlan?: PlannedExpense
  ): Promise<PlannedExpense> => {
    const plannedAmt = existingPlan?.plannedAmount || 0;

    const finalPaid = paidAmount !== undefined && paidAmount !== null
      ? Math.max(0, Number(paidAmount))
      : (isFulfilled ? plannedAmt : 0);

    const finalFulfilled = isFulfilled ? true : (finalPaid >= plannedAmt && plannedAmt > 0 && paidAmount !== 0);
    const status = finalFulfilled ? 'Fulfilled' : (finalPaid > 0 ? 'Partial' : 'Planned');

    const updates: Partial<PlannedExpense> = {
      ...(existingPlan || {}),
      id,
      isFulfilled: finalFulfilled,
      paidAmount: finalPaid,
      status,
    };

    return plannedExpenseApi.updatePlannedExpense(id, updates, existingPlan);
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
