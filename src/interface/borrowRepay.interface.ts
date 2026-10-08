// ─── Borrow & Repay (Debt & Creditor Tracker) Interfaces ─────────────────────

export type BorrowRepayType = 'Borrow' | 'Repaid' | 'Credit Given';

export interface BorrowRepayRecord {
  id: string;
  creditorName: string;
  date: string;
  type: BorrowRepayType;
  /** Stored as positive number; displayed with sign based on type */
  amount: number;
  currency?: string;
  notes?: string;
  createdAt?: string;
}

export type CreditorStatus = 'Outstanding' | 'Settled' | 'Credit Given' | 'Overpaid';

export interface CreditorSummary {
  creditorName: string;
  totalBorrowed: number;
  totalRepaid: number;
  creditGiven?: number;
  txCount?: number;
  /** Positive = still owe creditor, 0 = settled, negative = credit given to them or overpaid */
  netBalance: number;
  lastActivityDate: string;
  status: CreditorStatus;
}

export type PlannedRepaymentStatus = 'Scheduled' | 'Paid' | 'Pending';

export interface PlannedRepayment {
  id: string;
  creditorName: string;
  targetDate: string;
  targetMonth?: string;
  plannedAmount: number;
  currency?: string;
  status: PlannedRepaymentStatus;
  notes?: string;
  createdAt?: string;
}
