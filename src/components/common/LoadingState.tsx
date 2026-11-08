import { Loader2 } from 'lucide-react';
import './LoadingState.css';

interface KpiValueSkeletonProps {
  width?: string | number;
  height?: number;
  subtextWidth?: string | number;
  showSubtext?: boolean;
}

/**
 * Inline skeleton for KPI values & subtext so the KPI card header/title remains visible
 * while the metric is loading.
 */
export function KpiValueSkeleton({
  width = '65%',
  height = 30,
  subtextWidth = '80%',
  showSubtext = true,
}: KpiValueSkeletonProps) {
  return (
    <div className="kpi-inline-skeleton" aria-busy="true" aria-label="Loading KPI metric">
      <span
        className="skeleton-shimmer skeleton-value"
        style={{ width, height }}
      />
      {showSubtext && (
        <span
          className="skeleton-shimmer skeleton-subtext"
          style={{ width: subtextWidth, marginTop: 6 }}
        />
      )}
    </div>
  );
}

interface KpiCardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Full KPI Card Skeleton grid for multi-card KPI bars.
 */
export function KpiCardSkeleton({ count = 4, className = '' }: KpiCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`glass-panel kpi-skeleton-card ${className}`}
          aria-busy="true"
        >
          <div className="kpi-skeleton-top">
            <span className="skeleton-shimmer skeleton-line" style={{ width: '48%' }} />
            <span className="skeleton-shimmer skeleton-badge" />
          </div>
          <span className="skeleton-shimmer skeleton-value" />
          <span className="skeleton-shimmer skeleton-subtext" />
        </div>
      ))}
    </>
  );
}

interface PageLoadingScreenProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  rows?: number;
  className?: string;
}

/**
 * Unified Loading Screen for pages, sections, tables, and matrices.
 */
export function PageLoadingScreen({
  title = 'Loading data...',
  subtitle = 'Synchronizing latest records from your Life OS workspace.',
  compact = false,
  rows = 3,
  className = '',
}: PageLoadingScreenProps) {
  return (
    <div
      className={`page-loading-screen ${compact ? 'compact' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="page-loading-spinner-wrap">
        <Loader2 size={compact ? 22 : 26} className="page-loading-spinner" />
      </div>
      <div>
        <h4 className="page-loading-title">{title}</h4>
        {subtitle && <p className="page-loading-subtitle">{subtitle}</p>}
      </div>

      {rows > 0 && (
        <div className="page-loading-skeleton-list">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="page-loading-skeleton-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '65%' }}>
                <span
                  className="skeleton-shimmer skeleton-circle"
                  style={{ width: 20, height: 20, borderRadius: '50%' }}
                />
                <span
                  className="skeleton-shimmer skeleton-line"
                  style={{ width: `${75 - idx * 12}%` }}
                />
              </div>
              <span
                className="skeleton-shimmer skeleton-badge"
                style={{ width: 56, height: 18 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PageLoadingScreen;
