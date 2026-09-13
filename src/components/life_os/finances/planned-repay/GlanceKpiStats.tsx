import React from 'react';
import { CheckCircle2, Link2 } from 'lucide-react';

interface GlanceKpiStatsProps {
  totalPlanned: number;
  effectiveFulfilled: number;
  truePending: number;
  completedMonthsCount: number;
  totalMonths: number;
  totalItems: number;
  rolloverStats: { countRecovered: number; recoveredOriginalTotal: number };
  formatINR: (val: number) => string;
}

export default function GlanceKpiStats({
  totalPlanned, effectiveFulfilled, truePending,
  completedMonthsCount, totalMonths, totalItems,
  rolloverStats, formatINR
}: GlanceKpiStatsProps) {
  return (
    <div className="glance-hero-banner glass-panel" style={{ padding: '16px 20px', gap: 14 }}>
      <div className="glance-hero-stats" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>

        {/* Total Commitment */}
        <div className="glance-stat-box">
          <span className="glance-stat-label">TOTAL COMMITMENT</span>
          <span className="glance-stat-value">{formatINR(totalPlanned)}</span>
          <span className="glance-stat-sub">{totalMonths} Months ({totalItems} items)</span>
        </div>

        {/* Fulfilled / Completed */}
        <div className="glance-stat-box fulfilled">
          <span className="glance-stat-label">FULFILLED / COMPLETED</span>
          <span className="glance-stat-value emerald-text">{formatINR(effectiveFulfilled)}</span>
          <span className="glance-stat-sub">
            {completedMonthsCount} of {totalMonths} Months
          </span>
        </div>

        {/* Remaining Pending */}
        <div className="glance-stat-box pending">
          <span className="glance-stat-label">REMAINING PENDING</span>
          <span className="glance-stat-value amber-text">{formatINR(Math.max(0, truePending))}</span>
          <span className="glance-stat-sub">
            {truePending <= 0 ? 'All debts accounted for ✓' : `${totalMonths - completedMonthsCount} Month(s) Pending`}
          </span>
        </div>

        {/* Next-Month Recovered (conditional) */}
        {rolloverStats.countRecovered > 0 && (
          <div className="glance-stat-box" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.08)' }}>
            <span className="glance-stat-label" style={{ color: '#a5b4fc' }}>NEXT-MONTH RECOVERED</span>
            <span className="glance-stat-value" style={{ color: '#818cf8' }}>{formatINR(rolloverStats.recoveredOriginalTotal)}</span>
            <span className="glance-stat-sub" style={{ color: '#c7d2fe' }}>
              {rolloverStats.countRecovered} debt(s) paid in next month
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
