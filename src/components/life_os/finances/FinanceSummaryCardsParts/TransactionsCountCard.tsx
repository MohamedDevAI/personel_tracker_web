
import { Filter } from 'lucide-react';

/** Props for the TransactionsCountCard KPI panel */
export interface TransactionsCountCardProps {
  /** Whether the period filter is set to "All" months */
  isAll: boolean;
  /** Human-readable period label (unused in footer, kept for consistency) */
  periodLabel: string;
  /** Total number of transactions in the period */
  transactionCount: number;
  /** The selected month name, e.g. "Sep" */
  selectedMonth: string;
  /** The selected year */
  selectedYear: number;
}

/**
 * TransactionsCountCard shows the total number of transactions for the period.
 */
export default function TransactionsCountCard({
  isAll,
  transactionCount,
  selectedMonth,
  selectedYear,
}: TransactionsCountCardProps) {
  const footerText = isAll ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`;

  return (
    <div className="glass-panel finance-kpi-card finance-kpi-count">
      <div className="kpi-card-top">
        <div className="kpi-card-label">TRANSACTIONS COUNT</div>
        <div className="kpi-card-icon kpi-icon-count">
          <Filter size={16} />
        </div>
      </div>
      <div className="kpi-card-value kpi-val-count">
        {transactionCount} <span className="kpi-unit-text">Entries</span>
      </div>
      <div className="kpi-card-footer">In {footerText}</div>
    </div>
  );
}
