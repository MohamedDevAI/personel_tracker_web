import { PlannedExpense } from '../types';

const STORAGE_KEY = 'pt_planned_expenses';

const INITIAL_SAMPLE_PLANS: PlannedExpense[] = [
  // User's July Planning (Complete: 2,384.86 SAR)
  {
    id: 'pe-jul-1',
    title: 'Laptop',
    category: 'Shopping',
    month: 'Jul',
    year: 2026,
    plannedAmount: 748.17,
    paidAmount: 748.17,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Laptop allocation',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-2',
    title: 'Recharge',
    category: 'Utilities',
    month: 'Jul',
    year: 2026,
    plannedAmount: 103.5,
    paidAmount: 103.5,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Mobile / data recharge',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-3',
    title: 'Bakala',
    category: 'Grocery',
    month: 'Jul',
    year: 2026,
    plannedAmount: 500,
    paidAmount: 500,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Bakala local grocery supplies',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-4',
    title: 'Tabby',
    category: 'Credit Payback',
    month: 'Jul',
    year: 2026,
    plannedAmount: 85.5,
    paidAmount: 85.5,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Tabby split payment',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-5',
    title: 'Tamara',
    category: 'Credit Payback',
    month: 'Jul',
    year: 2026,
    plannedAmount: 46.1,
    paidAmount: 46.1,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Tamara installment',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-6',
    title: 'Tablet',
    category: 'Shopping',
    month: 'Jul',
    year: 2026,
    plannedAmount: 750,
    paidAmount: 750,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Tablet device allocation',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-7',
    title: 'Tabby',
    category: 'Credit Payback',
    month: 'Jul',
    year: 2026,
    plannedAmount: 54.87,
    paidAmount: 54.87,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Tabby installment',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-8',
    title: 'Tabby',
    category: 'Credit Payback',
    month: 'Jul',
    year: 2026,
    plannedAmount: 48.36,
    paidAmount: 48.36,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Tabby installment',
    createdAt: '2026-07-01T08:00:00.000Z'
  },
  {
    id: 'pe-jul-9',
    title: 'Tabby',
    category: 'Credit Payback',
    month: 'Jul',
    year: 2026,
    plannedAmount: 48.36,
    paidAmount: 48.36,
    isFulfilled: true,
    status: 'Fulfilled',
    notes: 'Tabby installment',
    createdAt: '2026-07-01T08:00:00.000Z'
  },

  // March 2026 sample plans
  {
    id: 'pe-1',
    title: 'Monthly Grocery & Provisions',
    category: 'Grocery',
    month: 'Mar',
    year: 2026,
    plannedAmount: 1500,
    paidAmount: 850,
    isFulfilled: false,
    dueDate: '2026-03-25',
    status: 'Partial',
    notes: 'Supermarket and weekly supplies',
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'pe-2',
    title: 'Dining & Food Orders',
    category: 'Food',
    month: 'Mar',
    year: 2026,
    plannedAmount: 800,
    paidAmount: 0,
    isFulfilled: false,
    dueDate: '2026-03-31',
    status: 'Planned',
    notes: 'Weekend dining budget',
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'pe-3',
    title: 'Fuel & Commute',
    category: 'Transport',
    month: 'Mar',
    year: 2026,
    plannedAmount: 500,
    paidAmount: 200,
    isFulfilled: false,
    dueDate: '2026-03-28',
    status: 'Partial',
    notes: 'Fuel and public transit budget',
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'pe-4',
    title: 'Medical & Healthcare Check',
    category: 'Medical',
    month: 'Mar',
    year: 2026,
    plannedAmount: 350,
    paidAmount: 350,
    isFulfilled: true,
    dueDate: '2026-03-15',
    status: 'Fulfilled',
    notes: 'Prescriptions and clinic visit',
    createdAt: '2026-03-01T08:00:00.000Z'
  }
];

export const plannedExpenseApi = {
  getPlannedExpenses: (): PlannedExpense[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PlannedExpense[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if July items are present, if not, merge them
          const hasJuly = parsed.some(p => p.month === 'Jul');
          if (!hasJuly) {
            const julyPlans = INITIAL_SAMPLE_PLANS.filter(p => p.month === 'Jul');
            const merged = [...julyPlans, ...parsed];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load planned expenses:', e);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_PLANS));
    return INITIAL_SAMPLE_PLANS;
  },

  createPlannedExpense: (plan: Omit<PlannedExpense, 'id' | 'createdAt'>): PlannedExpense => {
    const plans = plannedExpenseApi.getPlannedExpenses();
    const plannedAmt = Math.abs(Number(plan.plannedAmount) || 0);
    const isFulfilled = plan.isFulfilled ?? (plan.status === 'Fulfilled');
    const paidAmt = isFulfilled 
      ? plannedAmt 
      : (plan.paidAmount !== undefined ? Math.max(0, Number(plan.paidAmount)) : 0);

    const status = isFulfilled ? 'Fulfilled' : (paidAmt > 0 ? 'Partial' : (plan.status || 'Planned'));

    const newPlan: PlannedExpense = {
      ...plan,
      id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      plannedAmount: plannedAmt,
      paidAmount: paidAmt,
      isFulfilled,
      status,
      createdAt: new Date().toISOString()
    };
    const updated = [newPlan, ...plans];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newPlan;
  },

  updatePlannedExpense: (id: string, updates: Partial<PlannedExpense>): PlannedExpense | null => {
    const plans = plannedExpenseApi.getPlannedExpenses();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return null;

    const current = plans[index];
    const plannedAmt = updates.plannedAmount !== undefined 
      ? Math.abs(Number(updates.plannedAmount)) 
      : current.plannedAmount;

    let isFulfilled = updates.isFulfilled !== undefined 
      ? updates.isFulfilled 
      : (updates.status === 'Fulfilled' ? true : current.isFulfilled ?? (current.status === 'Fulfilled'));

    let paidAmt = updates.paidAmount !== undefined 
      ? Number(updates.paidAmount) 
      : (current.paidAmount ?? (current.status === 'Fulfilled' ? plannedAmt : 0));

    if (isFulfilled) {
      paidAmt = plannedAmt;
    } else {
      if (updates.isFulfilled === false && updates.paidAmount === undefined && paidAmt >= plannedAmt) {
        paidAmt = 0;
      }
    }

    const status = isFulfilled ? 'Fulfilled' : (paidAmt > 0 ? 'Partial' : (updates.status || 'Planned'));

    const updatedPlan: PlannedExpense = {
      ...current,
      ...updates,
      plannedAmount: plannedAmt,
      paidAmount: paidAmt,
      isFulfilled,
      status
    };
    plans[index] = updatedPlan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return updatedPlan;
  },

  setFulfillmentAndPayment: (id: string, isFulfilled: boolean, paidAmount?: number): PlannedExpense | null => {
    const plans = plannedExpenseApi.getPlannedExpenses();
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return null;

    const current = plans[index];
    const plannedAmt = current.plannedAmount;
    const finalPaid = isFulfilled ? plannedAmt : Math.max(0, Number(paidAmount) || 0);
    const finalFulfilled = isFulfilled || finalPaid >= plannedAmt;
    const status = finalFulfilled ? 'Fulfilled' : (finalPaid > 0 ? 'Partial' : 'Planned');

    const updatedPlan: PlannedExpense = {
      ...current,
      isFulfilled: finalFulfilled,
      paidAmount: finalPaid,
      status
    };
    plans[index] = updatedPlan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return updatedPlan;
  },

  deletePlannedExpense: (id: string): void => {
    const plans = plannedExpenseApi.getPlannedExpenses();
    const filtered = plans.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getMonthlyBudgetSummary: (month: string, year: number, actualCategoryExpenses: Record<string, number> = {}) => {
    const plans = plannedExpenseApi.getPlannedExpenses().filter(p => p.month === month && p.year === year);
    const totalPlanned = plans.reduce((acc, p) => acc + Number(p.plannedAmount), 0);

    const totalPaid = plans.reduce((acc, p) => {
      if (p.isFulfilled || p.status === 'Fulfilled') {
        return acc + Number(p.plannedAmount);
      }
      return acc + (p.paidAmount !== undefined ? Number(p.paidAmount) : 0);
    }, 0);

    const totalRemaining = Math.max(0, totalPlanned - totalPaid);
    const fulfilledCount = plans.filter(p => p.isFulfilled || p.status === 'Fulfilled' || ((p.paidAmount ?? 0) >= p.plannedAmount)).length;
    const fulfillmentRate = totalPlanned > 0 ? Math.min(100, Math.round((totalPaid / totalPlanned) * 100)) : 0;

    // Sum actual spent across categories from live transactions
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
      groupedPlans[p.category] = (groupedPlans[p.category] || 0) + Number(p.plannedAmount);
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
