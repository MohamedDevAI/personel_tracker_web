import { Sparkles, RefreshCw, Plus } from 'lucide-react';

interface GlanceHeroBannerProps {
  isLoading: boolean;
  onRefresh?: () => void;
  onAddPlan: () => void;
}

export default function GlanceHeroBanner({
  isLoading,
  onRefresh,
  onAddPlan
}: GlanceHeroBannerProps) {
  return (
    <div className="glance-hero-banner glass-panel">
      <div className="glance-hero-top">
        <div className="glance-hero-info">
          <div className="glance-tag-row">
            <span className="glance-badge-pill emerald">
              <Sparkles size={12} />
              <span>Planned Expenses Horizon</span>
            </span>
          </div>
          <h2 className="glance-hero-title">Planned Budget Matrix</h2>
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
    </div>
  );
}
