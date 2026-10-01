// ─── Planned Repay Credit Matrix (9-Month Debt Roll) Interfaces ──────────────

export interface PlannedRepayCreditItem {
  id?: string;
  _id?: string;
  targetDate: string;
  targetMonth: string;
  monthIndex?: number;
  creditorName: string;
  plannedAmount: number;
  monthTotal?: number;
  status: 'Completed' | 'In-Completed';
  notes?: string;
  createdAt?: string;
}

export interface PlannedRepayCreditColumn {
  targetMonth: string;
  targetDate: string;
  monthIndex: number;
  monthTotal: number;
  status: 'Completed' | 'In-Completed';
  itemCount: number;
  items: PlannedRepayCreditItem[];
}

export interface PlannedRepayCreditMatrix {
  totalPlanned: number;
  totalCompleted: number;
  totalInCompleted: number;
  totalMonths: number;
  completedMonthsCount: number;
  totalItems: number;
  completionRate: number;
  columns: PlannedRepayCreditColumn[];
}
