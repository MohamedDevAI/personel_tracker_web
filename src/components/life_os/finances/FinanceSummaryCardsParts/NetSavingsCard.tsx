
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../financeConstants';

/** Props for the NetSavingsCard KPI panel */
export interface NetSavingsCardProps {
  /** Whether the period filter is set to "All" months */
  isAll: boolean;
  /** Human-readable period label, e.g. "SEP 2026" */
  periodLabel: string;
  /** The selected year */
  selectedYear: number;
  /** Net balance (credit - debit) for the period */
  netBalance: number;
  /** Total credit used to calculate savings rate */
  totalCredit: number;
}

/**
 * NetSavingsCard displays the net savings (or deficit) KPI for a finance period.
 * Turns red when the balance is negative.
 */
export default function NetSavingsCard({
  isAll,
  periodLabel,
  selectedYear,
  netBalance,
  totalCredit,
}: NetSavingsCardProps) {
  const label = isAll ? `${selectedYear} NET SAVINGS` : `${periodLabel} NET SAVINGS`;
  const isPositive = netBalance >= 0;
  const savingsRate = totalCredit > 0 ? ((netBalance / totalCredit) * 100).toFixed(1) : '0';
  const footerText = totalCredit > 0 ? `${savingsRate}% savings rate` : 'Cash balance for period';

  return (
    <div className={`glass-panel finance-kpi-card ${isPositive ? 'finance-kpi-savings' : 'finance-kpi-debit'}`}>
      <div className="kpi-card-top">
        <div className="kpi-card-label">{label}</div>
        <div className={`kpi-card-icon ${isPositive ? 'kpi-icon-savings' : 'kpi-icon-debit'}`}>
          <Wallet size={16} />
        </div>
      </div>
      <div className={`kpi-card-value ${isPositive ? 'kpi-val-savings' : 'kpi-val-debit'}`}>
        SAR {formatCurrency(netBalance)}
      </div>
      <div className="kpi-card-footer">{footerText}</div>
    </div>
  );
}
