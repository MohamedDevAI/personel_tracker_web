import { ArrowDownLeft, ArrowUpRight, HandCoins } from 'lucide-react';
import { KpiValueSkeleton } from '../../../common/LoadingState';

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
    overpaidCreditorsCount?: number;
    totalOverpaid?: number;
    totalTransactions?: number;
  };
  formatINR: (val: number) => string;
  /** If true, shows the 4-card aggregation layout (includes Credit Given). Otherwise 3-card tracker layout */
  variant?: 'tracker' | 'aggregation';
  isLoading?: boolean;
}

export default function BorrowKpiCards({
  stats,
  formatINR,
  variant = 'tracker',
  isLoading = false,
}: BorrowKpiCardsProps) {
  return (
    <div className="borrow-kpi-grid">
      {/* Total Borrowed */}
      <div className="borrow-kpi-card borrow-card">
        <div className="borrow-kpi-header">
          <span className="borrow-kpi-label">TOTAL BORROWED</span>
          <div className="borrow-kpi-icon borrow-icon"><ArrowDownLeft size={16} /></div>
        </div>
        {isLoading ? (
          <KpiValueSkeleton showSubtext={false} />
        ) : (
          <div className="borrow-kpi-val borrow-text">{formatINR(stats.totalBorrowed)}</div>
        )}
      </div>

      {/* Total Repaid */}
      <div className="borrow-kpi-card repaid-card">
        <div className="borrow-kpi-header">
          <span className="borrow-kpi-label">TOTAL REPAID</span>
          <div className="borrow-kpi-icon repaid-icon"><ArrowUpRight size={16} /></div>
        </div>
        {isLoading ? (
          <KpiValueSkeleton showSubtext={false} />
        ) : (
          <div className="borrow-kpi-val repaid-text">{formatINR(stats.totalRepaid)}</div>
        )}
      </div>

      {variant === 'aggregation' && (
        <div className="borrow-kpi-card" style={{ borderColor: 'rgba(248, 158, 48, 0.3)' }}>
          <div className="borrow-kpi-header">
            <span className="borrow-kpi-label">CREDIT GIVEN</span>
            <div className="borrow-kpi-icon" style={{ background: 'rgba(248, 158, 48, 0.15)', color: '#e88308' }}>
              <HandCoins size={16} />
            </div>
          </div>
          {isLoading ? (
            <KpiValueSkeleton showSubtext={false} />
          ) : (
            <div className="borrow-kpi-val" style={{ color: '#e88308' }}>
              {formatINR(stats.totalCreditGiven || 0)}
            </div>
          )}
        </div>
      )}

      {/* Net Outstanding */}
      <div className={`borrow-kpi-card ${stats.netOutstanding > 0 ? 'outstanding-card' : 'settled-card'}`}>
        <div className="borrow-kpi-header">
          <span className="borrow-kpi-label">NET OUTSTANDING</span>
          <div className="borrow-kpi-icon outstanding-icon"><HandCoins size={16} /></div>
        </div>
        {isLoading ? (
          <KpiValueSkeleton showSubtext={false} />
        ) : (
          <div className={`borrow-kpi-val ${stats.netOutstanding > 0 ? 'outstanding-text' : 'settled-text'}`}>
            {formatINR(stats.netOutstanding)}
          </div>
        )}
      </div>
    </div>
  );
}
