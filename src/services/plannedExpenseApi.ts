import { PlannedExpense } from '../types';

const STORAGE_KEY = 'pt_planned_expenses';

const INITIAL_SAMPLE_PLANS: PlannedExpense[] = [
  {
    id: 'pe-1',
    title: 'Monthly Grocery & Provisions',
    category: 'Grocery',
    month: 'Mar',
    year: 2026,
    plannedAmount: 1500,
    dueDate: '2026-03-25',
    status: 'Planned',
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
    dueDate: '2026-03-28',
    status: 'Planned',
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
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
    const newPlan: PlannedExpense = {
      ...plan,
      id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      plannedAmount: Math.abs(Number(plan.plannedAmount) || 0),
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

    const updatedPlan: PlannedExpense = {
      ...plans[index],
      ...updates,
      plannedAmount: updates.plannedAmount !== undefined ? Math.abs(Number(updates.plannedAmount)) : plans[index].plannedAmount
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

    // Sum actual spent across categories that have plans
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
      totalActualSpent,
      remainingBudget: totalPlanned - totalActualSpent,
      adherenceRate: totalPlanned > 0 ? Math.min(100, Math.round((totalActualSpent / totalPlanned) * 100)) : 0,
      categoryVariance
    };
  }
};
