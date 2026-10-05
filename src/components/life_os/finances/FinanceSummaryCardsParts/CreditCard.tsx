import { ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../financeConstants';

/** Props for the CreditCard KPI panel */
export interface CreditCardProps {
  /** Whether the period filter is set to "All" months */
  isAll: boolean;
  /** Human-readable period label, e.g. "SEP 2026" */
  periodLabel: string;
  /** The selected year, e.g. 2026 */
  selectedYear: number;
  /** Total credit (income) amount for the period in SAR */
  totalCredit: number;
}

/**
 * CreditCard displays the total credit (income) KPI for a finance period.
 * It shows the label, icon, formatted amount, and a brief footer note.
 */
export default function CreditCard({ isAll, periodLabel, selectedYear, totalCredit }: CreditCardProps) {
  const label = isAll ? `${selectedYear} TOTAL CREDIT` : `${periodLabel} CREDIT`;

  return (
    <div className="glass-panel finance-kpi-card finance-kpi-credit">
      <div className="kpi-card-top">
        <div className="kpi-card-label">{label}</div>
        <div className="kpi-card-icon kpi-icon-credit">
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="kpi-card-value kpi-val-credit">+SAR {formatCurrency(totalCredit)}</div>
      <div className="kpi-card-footer">Inflows &amp; Salary deposits</div>
    </div>
  );
}
