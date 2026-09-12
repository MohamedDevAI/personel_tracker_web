import React from 'react';
import { ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';

interface BorrowKpiCardsProps {
  stats: {
    totalBorrowed: number;
    totalRepaid: number;
    netOutstanding: number;
    activeCreditorsCount: number;
    settledCreditorsCount: number;
    totalCreditorsCount: number;
    totalCreditGiven?: number;
    creditGivenCreditorsCount?: number;
    totalTransactions?: number;
  };
  formatINR: (val: number) => string;
  /** If true, shows the 4-card aggregation layout (includes Credit Given). Otherwise 3-card tracker layout */
  variant?: 'tracker' | 'aggregation';
}

export default function BorrowKpiCards({ stats, formatINR, variant = 'tracker' }: BorrowKpiCardsProps) {
  return (
    <div className="borrow-kpi-grid">
      {/* Total Borrowed */}
      <div className="borrow-kpi-card borrow-card">
        <div className="borrow-kpi-header">
          <span className="borrow-kpi-label">TOTAL BORROWED</span>
          <div className="borrow-kpi-icon borrow-icon"><ArrowDownLeft size={16} /></div>
        </div>
        <div className="borrow-kpi-val borrow-text">{formatINR(stats.totalBorrowed)}</div>
        <div className="borrow-kpi-meta">
          {variant === 'aggregation'
            ? `Across ${stats.totalCreditorsCount} creditors`
            : 'Money received as credit/loans'}
        </div>
      </div>

      {/* Total Repaid */}
      <div className="borrow-kpi-card repaid-card">
        <div className="borrow-kpi-header">
          <span className="borrow-kpi-label">TOTAL REPAID</span>
          <div className="borrow-kpi-icon repaid-icon"><ArrowUpRight size={16} /></div>
        </div>
        <div className="borrow-kpi-val repaid-text">{formatINR(stats.totalRepaid)}</div>
        <div className="borrow-kpi-meta">Total debt returned to creditors</div>
      </div>

      {/* Credit Given (aggregation only) */}
      {variant === 'aggregation' && (
        <div className="borrow-kpi-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <div className="borrow-kpi-header">
            <span className="borrow-kpi-label">CREDIT GIVEN</span>
            <div className="borrow-kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <HandCoins size={16} />
            </div>
          </div>
          <div className="borrow-kpi-val" style={{ color: '#38bdf8' }}>
            {formatINR(stats.totalCreditGiven || 0)}
          </div>
          <div className="borrow-kpi-meta">{stats.creditGivenCreditorsCount} creditor(s) received credit</div>
        </div>
      )}

      {/* Net Outstanding */}
      <div className={`borrow-kpi-card ${stats.netOutstanding > 0 ? 'outstanding-card' : 'settled-card'}`}>
        <div className="borrow-kpi-header">
          <span className="borrow-kpi-label">NET OUTSTANDING</span>
          <div className="borrow-kpi-icon outstanding-icon"><HandCoins size={16} /></div>
        </div>
        <div className={`borrow-kpi-val ${stats.netOutstanding > 0 ? 'outstanding-text' : 'settled-text'}`}>
          {formatINR(stats.netOutstanding)}
        </div>
        <div className="borrow-kpi-meta">
          {variant === 'aggregation'
            ? `${stats.activeCreditorsCount} pending / ${stats.settledCreditorsCount} settled`
            : stats.netOutstanding > 0
              ? `${stats.activeCreditorsCount} creditor(s) pending settlement`
              : 'All borrowed money fully settled!'}
        </div>
      </div>
    </div>
  );
}
