// ─── Core TypeScript Interfaces and Types for Personal Tracker ────────────────

/**
 * Transaction type — normalized to title-case for consistency.
 * Backend may return CREDIT/DEBIT; normalizeTransaction() handles conversion.
 */
export type TransactionType = 'Credit' | 'Debit';

/** Raw transaction type values the backend may return before normalization */
export type RawTransactionType = 'Credit' | 'Debit' | 'CREDIT' | 'DEBIT' | 'INCOME' | 'EXPENSE';

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  type: TransactionType;
  createdAt?: string;
}

/**
 * A financial transaction from the MongoDB-backed ledger.
 *
 * Note: the backend returns some duplicate fields (_id/id, date/transactionDate,
 * amount/amountSar, description/note, category/categoryName). We keep all fields
 * here for API compatibility, but normalizeTransaction() in expenseApi.ts ensures
 * the canonical fields are always populated.
 */
export interface Transaction {
  _id?: string;
  id?: string;
  date?: string;
  transactionDate?: string;
  month?: string;
  category: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  note?: string;
  paymentMethod?: string;
  amount: number;
  amountSar?: number;
  type: TransactionType;
  createdAt?: string;
  plannedExpenseId?: string;
}

export interface DashboardSummary {
  totalCredit: number;
  totalDebit: number;
  balance: number;
  expensesByCategory?: Record<string, number>;
}

// ─── Dashboard Mock Data Types ────────────────────────────────────────────────

export type ExpenseType = 'INCOME' | 'EXPENSE';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: ExpenseType;
  category: string;
  date: string;
  notes?: string;
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  title: string;
  category: string;
  streak: number;
  targetFrequency: string;
  completedToday: boolean;
  history: number[];
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate?: string;
  progress: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status?: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  completed: boolean;
  dueDate?: string;
}

// ─── Backend Health ───────────────────────────────────────────────────────────

export interface BackendHealth {
  connected: boolean;
  mode: 'local' | 'remote';
  status?: string;
  service?: string;
  database?: string;
  timestamp?: number;
}

// ─── Borrow & Repay (INR) ─────────────────────────────────────────────────────

export type BorrowRepayType = 'Borrow' | 'Repaid';

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

export interface CreditorSummary {
  creditorName: string;
  totalBorrowed: number;
  totalRepaid: number;
  creditGiven?: number;
  txCount?: number;
  /** Positive = still owe creditor, 0 = settled, negative = credit given to them */
  netBalance: number;
  lastActivityDate: string;
  status: 'Outstanding' | 'Settled' | 'Overpaid';
}

// ─── Planned Repayments (INR) ─────────────────────────────────────────────────

export type PlannedRepaymentStatus = 'Scheduled' | 'Paid' | 'Pending';

export interface PlannedRepayment {
  id: string;
  creditorName: string;
  targetDate: string;
  targetMonth?: string;
  plannedAmount: number;
  status: PlannedRepaymentStatus;
  notes?: string;
  createdAt?: string;
}

// ─── Planned Expenses (SAR) ───────────────────────────────────────────────────

export type PlannedExpenseStatus = 'Planned' | 'Fulfilled' | 'Pending' | 'Overdue' | 'Partial';

export interface PlannedExpense {
  id: string;
  title: string;
  category?: string;
  /** Month abbreviation (e.g. "Jul") */
  month: string;
  /** Full year (e.g. 2026) */
  year: number;
  /** Planned amount in SAR */
  plannedAmount: number;
  /** Amount paid so far in SAR */
  paidAmount?: number;
  /** Whether fully paid */
  isFulfilled?: boolean;
  currency?: string;
  dueDate?: string;
  status: PlannedExpenseStatus;
  notes?: string;
  createdAt?: string;
}

// ─── Planned Repay Credit (MongoDB collection: planned_repay_credit) ───────────

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

// ─── Investment Holdings (Money DB) ───────────────────────────────────────────

export type InvestmentCategory = 'Mutual Funds' | 'Bonds' | 'FDs' | 'Stocks' | 'SIPs';
export type Verdict = 'Buy' | 'Hold' | 'Sell';

export interface InvestmentHolding {
  id: string;
  _id?: string;
  name: string;               // e.g. "Reliance Industries", "HDFC Mid-Cap Fund"
  ticker?: string;            // e.g. "RELIANCE.NS"
  category: InvestmentCategory;
  buyPrice: number;           // per unit/share in INR
  currentPrice: number;       // latest price in INR
  quantity: number;           // number of shares/units
  buyDate: string;            // ISO date e.g. "2024-06-01"
  currency: string;           // always "INR"

  // Scoring outputs (computed client-side by scoring engine)
  verdict?: Verdict;
  confidence?: number;        // 0–100%

  // 90-day daily closing prices for charts + technicals computation
  priceHistory?: number[];

  // Category-specific metrics — only the relevant block is populated
  fundamentals?: FundamentalMetrics;       // Stocks
  mutualFundMetrics?: MutualFundMetrics;   // Mutual Funds & SIPs
  bondMetrics?: BondMetrics;               // Bonds
  fdMetrics?: FDMetrics;                   // FDs
  technicals?: TechnicalIndicators;        // Stocks + MFs

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Fundamental financial metrics — Stocks only */
export interface FundamentalMetrics {
  roe?: number;                // Return on Equity %
  roce?: number;               // Return on Capital Employed %
  debtToEquity?: number;       // D/E ratio
  freeCashFlow?: number;       // ₹ Crores
  peRatio?: number;
  pbRatio?: number;
  marketCap?: number;          // ₹ Crores
  promoterHolding?: number;    // current %
  promoterHoldingChange?: number;  // QoQ change in %
  moatRating?: 'Wide' | 'Narrow' | 'None';
  governanceScore?: number;    // 1–10
  sector?: string;
}

/** Mutual Fund & SIP specific metrics */
export interface MutualFundMetrics {
  cagr3yr?: number;
  cagr5yr?: number;
  cagr10yr?: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  expenseRatio?: number;       // %
  alphaVsBenchmark?: number;   // % over benchmark
  beta?: number;
  fundManagerTenure?: number;  // years
  exitLoadPeriod?: number;    // months
  exitLoadPercent?: number;
  sipAmount?: number;         // monthly SIP amount in ₹
  sipDay?: number;            // day of month (e.g. 5, 10, 15)
  sipActive?: boolean;
  fundHouse?: string;
  benchmark?: string;
}

/** Bond-specific metrics */
export interface BondMetrics {
  creditRating?: string;       // "AAA", "AA+", etc.
  yieldToMaturity?: number;    // %
  duration?: number;           // Modified duration in years
  bondType?: 'Government' | 'Corporate' | 'Tax-Free';
  couponRate?: number;         // %
  maturityDate?: string;       // ISO date
  faceValue?: number;          // ₹ per bond
  issuer?: string;
}

/** Fixed Deposit specific metrics */
export interface FDMetrics {
  interestRate: number;       // % p.a.
  fdType?: 'Cumulative' | 'Non-Cumulative';
  tenure?: number;             // months
  maturityDate?: string;       // ISO date
  maturityAmount?: number;     // ₹
  bankName?: string;
  taxTreatment?: 'Taxable' | 'Tax-Saver (80C)';
  payoutFrequency?: 'Monthly' | 'Quarterly' | 'Annual' | 'Maturity';
}

/** Technical indicators computed from price history */
export interface TechnicalIndicators {
  rsi14: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  sma50: number;
  sma200: number;
  ema20: number;
  bollingerUpper: number;
  bollingerLower: number;
  bollingerMiddle: number;
  atr14: number;
  volume?: number;
  avgVolume20?: number;
}

/** Output of the rule-based scoring engine */
export interface ScoringResult {
  verdict: Verdict;
  confidence: number;         // 0–100 normalised percentage
  totalScore: number;         // raw summed score
  maxPossibleScore: number;
  factors: ScoringFactor[];
}

export interface ScoringFactor {
  name: string;
  score: number;              // -2 to +2
  maxScore: number;           // always 2
  detail: string;             // e.g. "RSI at 28 — oversold"
  direction: 'positive' | 'neutral' | 'negative';
}

/** Aggregated stats for the whole portfolio or a category */
export interface PortfolioStats {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPct: number;
  todayChange: number;
  todayChangePct: number;
  monthlySipTotal?: number;
  byCategory: CategoryStats[];
}

export interface CategoryStats {
  category: InvestmentCategory;
  invested: number;
  currentValue: number;
  returnPct: number;
  holdingCount: number;
  allocationPct: number;
}

