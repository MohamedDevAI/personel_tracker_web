import { Sparkles, RefreshCw, Plus, Calendar, CheckCircle2, Clock, TrendingUp, Tag } from 'lucide-react';
import { formatSAR } from './plannedExpenseSync';

export interface GlanceKpiStatsData {
  totalPlanned: number;
  totalFulfilled: number;
  totalPending: number;
  completedMonthsCount: number;
  totalMonths: number;
  totalItems: number;
  fulfilledItemsCount: number;
  pendingItemsCount: number;
  progressPercent: number;
  currentMonthName: string;
  currentMonthYear: number;
  currentMonthTotal: number;
  currentMonthItemCount: number;
  currentMonthPendingCount: number;
  topCategory?: {
    name: string;
    amount: number;
    percentage: number;
  };
  nextUpcoming?: {
    title: string;
    month: string;
    year: number;
    amount: number;
  };
  nextYearTotal: number;
  nextYearCount: number;
}

export interface GlanceHeroBannerProps {
  isLoading: boolean;
  onRefresh?: () => void;
  onAddPlan: () => void;
  stats?: GlanceKpiStatsData;
  onSelectMonth?: (monthShort: string, year?: number) => void;
}

export default function GlanceHeroBanner({
  isLoading,
  onRefresh,
  onAddPlan,
  stats,
  onSelectMonth
}: GlanceHeroBannerProps) {
  return (
    <div className="glance-hero-banner glass-panel">
      {/* ── Top Header & Actions ── */}
      <div className="glance-hero-top">
        <div className="glance-hero-info">
          <div className="glance-tag-row">
            <span className="glance-badge-pill emerald">
              <Sparkles size={12} />
              <span>Planned Expenses Horizon</span>
            </span>
            {stats && (
              <span className="glance-badge-pill sync">
                <span>{stats.totalMonths} Month Matrix</span>
              </span>
            )}
          </div>
          <h2 className="glance-hero-title">Planned Budget Matrix</h2>
          <p className="glance-hero-desc">
            Executive financial horizon tracking planned expenses, fulfilled objectives, and upcoming commitments.
          </p>
        </div>

        <div className="glance-hero-actions-cluster">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="btn btn-secondary btn-sm"
              title="Refresh schedule data"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddPlan}
            className="btn btn-primary btn-sm glance-hero-add-btn"
          >
            <Plus size={14} />
            <span>Add Planned Expense</span>
          </button>
        </div>
      </div>

      {/* ── Executive Stats Grid ── */}
      {stats && (
        <>
          <div className="glance-hero-stats">
            {/* Box 1: Total Planned Horizon */}
            <div className="glance-stat-box">
              <span className="glance-stat-label">
                <Calendar size={12} /> TOTAL PLANNED HORIZON
              </span>
              <span className="glance-stat-value">{formatSAR(stats.totalPlanned)}</span>
              <span className="glance-stat-sub">
                {stats.totalMonths} Months • {stats.totalItems} Objectives
              </span>
            </div>

            {/* Box 2: Fulfilled to Date */}
            <div className="glance-stat-box fulfilled">
              <span className="glance-stat-label">
                <CheckCircle2 size={12} color="#34d399" /> FULFILLED TO DATE
              </span>
              <span className="glance-stat-value emerald-text">{formatSAR(stats.totalFulfilled)}</span>
              <span className="glance-stat-sub">
                {stats.completedMonthsCount} of {stats.totalMonths} Months Completed ({stats.fulfilledItemsCount} items)
              </span>
            </div>

            {/* Box 3: Remaining Pending */}
            <div className="glance-stat-box pending">
              <span className="glance-stat-label">
                <Clock size={12} color="#fbbf24" /> REMAINING PENDING
              </span>
              <span className="glance-stat-value amber-text">{formatSAR(stats.totalPending)}</span>
              <span className="glance-stat-sub">
                {stats.pendingItemsCount > 0
                  ? `${stats.pendingItemsCount} unfulfilled objective(s)`
                  : 'All horizon objectives fulfilled ✓'}
              </span>
            </div>

            {/* Box 4: Current Month Active */}
            <div
              className="glance-stat-box current-month"
              style={{ cursor: onSelectMonth ? 'pointer' : 'default' }}
              onClick={() => onSelectMonth?.(stats.currentMonthName, stats.currentMonthYear)}
              title={onSelectMonth ? `View detailed breakdown for ${stats.currentMonthName}` : undefined}
            >
              <span className="glance-stat-label">
                <Sparkles size={12} color="#a5b4fc" /> {stats.currentMonthName.toUpperCase()} {stats.currentMonthYear} (CURRENT)
              </span>
              <span className="glance-stat-value indigo-text">{formatSAR(stats.currentMonthTotal)}</span>
              <span className="glance-stat-sub">
                {stats.currentMonthItemCount} items ({stats.currentMonthPendingCount} pending)
              </span>
            </div>
          </div>

          {/* ── Horizon Progress Container ── */}
          <div className="glance-progress-container">
            <div className="glance-progress-header">
              <span className="glance-progress-title">
                <TrendingUp size={14} color="#34d399" />
                <span>Horizon Fulfillment Progress</span>
              </span>
              <span className="glance-progress-meta">
                <strong>{stats.progressPercent}%</strong> Fulfilled ({formatSAR(stats.totalFulfilled)} of {formatSAR(stats.totalPlanned)})
              </span>
            </div>
            <div className="glance-progress-track">
              <div
                className="glance-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, stats.progressPercent))}%` }}
              />
            </div>
          </div>

          {/* ── Insights Chips ── */}
          {(stats.topCategory || stats.nextUpcoming || stats.nextYearCount > 0) && (
            <div className="glance-insights-row">
              {stats.topCategory && (
                <div className="glance-insight-chip emerald-chip">
                  <Tag size={12} />
                  <span>
                    Top Spending: <strong>{stats.topCategory.name}</strong> ({formatSAR(stats.topCategory.amount)} • {stats.topCategory.percentage}%)
                  </span>
                </div>
              )}
              {stats.nextUpcoming && (
                <div className="glance-insight-chip highlight">
                  <Clock size={12} />
                  <span>
                    Next Due: <strong>{stats.nextUpcoming.title}</strong> in {stats.nextUpcoming.month} ({formatSAR(stats.nextUpcoming.amount)})
                  </span>
                </div>
              )}
              {stats.nextYearCount > 0 && (
                <div className="glance-insight-chip">
                  <Calendar size={12} />
                  <span>
                    Next Year Horizons: <strong>{stats.nextYearCount} items</strong> ({formatSAR(stats.nextYearTotal)})
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
