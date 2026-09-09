import { BorrowRepayRecord, CreditorSummary } from '../types';

const STORAGE_KEY = 'pt_borrow_repay_records';

const INITIAL_SAMPLE_RECORDS: BorrowRepayRecord[] = [
  {
    id: 'br-sample-1',
    creditorName: 'Akash',
    date: '2024-11-27',
    type: 'Borrow',
    amount: 100,
    currency: 'INR',
    notes: 'Personal short loan',
    createdAt: '2024-11-27T10:00:00.000Z'
  },
  {
    id: 'br-sample-2',
    creditorName: 'Akash',
    date: '2024-12-02',
    type: 'Repaid',
    amount: 100,
    currency: 'INR',
    notes: 'Repaid via UPI',
    createdAt: '2024-12-02T15:00:00.000Z'
  }
];

export const borrowRepayApi = {
  getRecords: (): BorrowRepayRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load borrow/repay records:', e);
    }
    // Initialize with sample records if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_RECORDS));
    return INITIAL_SAMPLE_RECORDS;
  },

  createRecord: (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>): BorrowRepayRecord => {
    const records = borrowRepayApi.getRecords();
    const newRecord: BorrowRepayRecord = {
      ...record,
      id: `br-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      amount: Math.abs(Number(record.amount) || 0),
      currency: 'INR',
      createdAt: new Date().toISOString()
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  updateRecord: (id: string, updates: Partial<BorrowRepayRecord>): BorrowRepayRecord | null => {
    const records = borrowRepayApi.getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedRecord: BorrowRepayRecord = {
      ...records[index],
      ...updates,
      amount: updates.amount !== undefined ? Math.abs(Number(updates.amount)) : records[index].amount
    };
    records[index] = updatedRecord;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return updatedRecord;
  },

  deleteRecord: (id: string): void => {
    const records = borrowRepayApi.getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getCreditorSummaries: (): CreditorSummary[] => {
    const records = borrowRepayApi.getRecords();
    const creditorMap: Record<string, { totalBorrowed: number; totalRepaid: number; dates: string[] }> = {};

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
      let status: 'Outstanding' | 'Settled' | 'Overpaid' = 'Settled';
      if (netBalance > 0) status = 'Outstanding';
      else if (netBalance < 0) status = 'Overpaid';

      const sortedDates = data.dates.sort();
      const lastActivityDate = sortedDates[sortedDates.length - 1] || 'N/A';

      return {
        creditorName,
        totalBorrowed: data.totalBorrowed,
        totalRepaid: data.totalRepaid,
        netBalance,
        lastActivityDate,
        status
      };
    });
  },

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

    const netOutstanding = totalBorrowed - totalRepaid;
    const summaries = borrowRepayApi.getCreditorSummaries();
    const activeCreditorsCount = summaries.filter(s => s.netBalance > 0).length;

    return {
      totalBorrowed,
      totalRepaid,
      netOutstanding: Math.max(0, netOutstanding),
      activeCreditorsCount,
      totalCreditorsCount: summaries.length
    };
  },

  // ----------------------------------------------------
  // PLANNED REPAYMENTS (STEP 1 OF BORROW & REPAY) in INR
  // ----------------------------------------------------
  getPlannedRepayments: (): import('../types').PlannedRepayment[] => {
    const PLANNED_KEY = 'pt_planned_repayments';
    const INITIAL_PLANNED_REPAYMENTS: import('../types').PlannedRepayment[] = [
      {
        id: 'pr-sample-1',
        creditorName: 'Akash',
        targetDate: '2024-12-15',
        targetMonth: 'Dec',
        plannedAmount: 100,
        status: 'Paid',
        notes: 'Final settlement installment',
        createdAt: '2024-11-28T10:00:00.000Z'
      }
    ];

    try {
      const stored = localStorage.getItem(PLANNED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load planned repayments:', e);
    }

    localStorage.setItem(PLANNED_KEY, JSON.stringify(INITIAL_PLANNED_REPAYMENTS));
    return INITIAL_PLANNED_REPAYMENTS;
  },

  createPlannedRepayment: (plan: Omit<import('../types').PlannedRepayment, 'id' | 'createdAt'>): import('../types').PlannedRepayment => {
    const PLANNED_KEY = 'pt_planned_repayments';
    const current = borrowRepayApi.getPlannedRepayments();
    const newPlan: import('../types').PlannedRepayment = {
      ...plan,
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      plannedAmount: Math.abs(Number(plan.plannedAmount) || 0),
      createdAt: new Date().toISOString()
    };
    const updated = [newPlan, ...current];
    localStorage.setItem(PLANNED_KEY, JSON.stringify(updated));
    return newPlan;
  },

  updatePlannedRepayment: (id: string, updates: Partial<import('../types').PlannedRepayment>): import('../types').PlannedRepayment | null => {
    const PLANNED_KEY = 'pt_planned_repayments';
    const current = borrowRepayApi.getPlannedRepayments();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPlan: import('../types').PlannedRepayment = {
      ...current[index],
      ...updates,
      plannedAmount: updates.plannedAmount !== undefined ? Math.abs(Number(updates.plannedAmount)) : current[index].plannedAmount
    };
    current[index] = updatedPlan;
    localStorage.setItem(PLANNED_KEY, JSON.stringify(current));
    return updatedPlan;
  },

  deletePlannedRepayment: (id: string): void => {
    const PLANNED_KEY = 'pt_planned_repayments';
    const current = borrowRepayApi.getPlannedRepayments();
    const filtered = current.filter(p => p.id !== id);
    localStorage.setItem(PLANNED_KEY, JSON.stringify(filtered));
  },

  markPlannedRepaymentAsPaid: (id: string) => {
    const plan = borrowRepayApi.getPlannedRepayments().find(p => p.id === id);
    if (!plan) return null;

    // Update status to Paid
    borrowRepayApi.updatePlannedRepayment(id, { status: 'Paid' });

    // Also record it into Credit Tracker as an actual Repaid transaction
    const record = borrowRepayApi.createRecord({
      creditorName: plan.creditorName,
      date: plan.targetDate || new Date().toISOString().split('T')[0],
      type: 'Repaid',
      amount: plan.plannedAmount,
      currency: 'INR',
      notes: `Planned Repayment: ${plan.notes || 'Settled'}`
    });

    return { plan, record };
  }
};
