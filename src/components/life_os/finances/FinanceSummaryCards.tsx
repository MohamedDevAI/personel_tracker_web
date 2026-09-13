import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Filter } from 'lucide-react';
import { formatCurrency } from './financeConstants';

interface FinanceSummaryCardsProps {
  selectedMonth: string;
  selectedYear: number;
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  transactionCount: number;
}

export default function FinanceSummaryCards({
  selectedMonth,
  selectedYear,
  totalCredit,
  totalDebit,
  netBalance,
  transactionCount
}: FinanceSummaryCardsProps) {
  const isAll = selectedMonth === 'All';
  const periodLabel = isAll ? `${selectedYear}` : `${selectedMonth.toUpperCase()} ${selectedYear}`;
  const savingsRate = totalCredit > 0 ? ((netBalance / totalCredit) * 100).toFixed(1) : '0';

  return (
    <div className="finance-summary-grid">
      
      {/* Total Credit */}
      <div className="glass-panel finance-kpi-card finance-kpi-credit">
        <div className="kpi-card-top">
          <div className="kpi-card-label">
            {isAll ? `${selectedYear} TOTAL CREDIT` : `${periodLabel} CREDIT`}
          </div>
          <div className="kpi-card-icon kpi-icon-credit">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div className="kpi-card-value kpi-val-credit">
          +SAR {formatCurrency(totalCredit)}
        </div>
        <div className="kpi-card-footer">
          Inflows & Salary deposits
        </div>
      </div>

      {/* Total Debit */}
      <div className="glass-panel finance-kpi-card finance-kpi-debit">
        <div className="kpi-card-top">
          <div className="kpi-card-label">
            {isAll ? `${selectedYear} TOTAL DEBIT` : `${periodLabel} DEBIT`}
          </div>
          <div className="kpi-card-icon kpi-icon-debit">
            <ArrowDownRight size={16} />
          </div>
        </div>
        <div className="kpi-card-value kpi-val-debit">
          -SAR {formatCurrency(Math.abs(totalDebit))}
        </div>
        <div className="kpi-card-footer">
          Expenses & Outgoing payments
        </div>
      </div>

      {/* Net Monthly Balance */}
      <div className={`glass-panel finance-kpi-card ${netBalance >= 0 ? 'finance-kpi-savings' : 'finance-kpi-debit'}`}>
        <div className="kpi-card-top">
          <div className="kpi-card-label">
            {isAll ? `${selectedYear} NET SAVINGS` : `${periodLabel} NET SAVINGS`}
          </div>
          <div className={`kpi-card-icon ${netBalance >= 0 ? 'kpi-icon-savings' : 'kpi-icon-debit'}`}>
            <Wallet size={16} />
          </div>
        </div>
        <div className={`kpi-card-value ${netBalance >= 0 ? 'kpi-val-savings' : 'kpi-val-debit'}`}>
          SAR {formatCurrency(netBalance)}
        </div>
        <div className="kpi-card-footer">
          {totalCredit > 0 ? `${savingsRate}% savings rate` : 'Cash balance for period'}
        </div>
      </div>

      {/* Monthly Activity */}
      <div className="glass-panel finance-kpi-card finance-kpi-count">
        <div className="kpi-card-top">
          <div className="kpi-card-label">
            TRANSACTIONS COUNT
          </div>
          <div className="kpi-card-icon kpi-icon-count">
            <Filter size={16} />
          </div>
        </div>
        <div className="kpi-card-value kpi-val-count">
          {transactionCount} <span className="kpi-unit-text">Entries</span>
        </div>
        <div className="kpi-card-footer">
          In {isAll ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`}
        </div>
      </div>

    </div>
  );
}
