import { ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '../financeConstants';

/** Props for the DebitCard KPI panel */
export interface DebitCardProps {
  /** Whether the period filter is set to "All" months */
  isAll: boolean;
  /** Human-readable period label, e.g. "SEP 2026" */
  periodLabel: string;
  /** The selected year, e.g. 2026 */
  selectedYear: number;
  /** Total debit (expenses) amount for the period in SAR */
  totalDebit: number;
}

/**
 * DebitCard displays the total debit (expenses) KPI for a finance period.
 */
export default function DebitCard({ isAll, periodLabel, selectedYear, totalDebit }: DebitCardProps) {
  const label = isAll ? `${selectedYear} TOTAL DEBIT` : `${periodLabel} DEBIT`;

  return (
    <div className="glass-panel finance-kpi-card finance-kpi-debit">
      <div className="kpi-card-top">
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-icon kpi-icon-debit">
          <ArrowDownRight size={16} />
        </div>
      </div>
      <div className="kpi-card-value kpi-val-debit">-SAR {formatCurrency(Math.abs(totalDebit))}</div>
      <div className="kpi-card-footer">Expenses &amp; Outgoing payments</div>
    </div>
  );
}
