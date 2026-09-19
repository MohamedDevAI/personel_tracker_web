import { Plus, LayoutGrid } from 'lucide-react';

interface PlannedExpensesHeaderProps {
  onAddPlan: () => void;
  selectedMonth?: string;
  onSelectAllMonths?: () => void;
}

export default function PlannedExpensesHeader({
  onAddPlan,
  selectedMonth = 'All',
  onSelectAllMonths
}: PlannedExpensesHeaderProps) {
  const isAll = selectedMonth.toLowerCase() === 'all';

  return (
    <div className="planned-header-row mb-4">
      <div>
        <h2 className="planned-header-title">
          Planned Expenses &amp; <span className="emerald-gradient-text">Fulfillment Tracker</span>
        </h2>
      </div>

      <div className="planned-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isAll && onSelectAllMonths && (
          <button
            type="button"
            onClick={onSelectAllMonths}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            title="Switch back to the All-Months Glance Matrix"
          >
            <LayoutGrid size={15} /> All Months (Glance Matrix)
          </button>
        )}

        {isAll && (
          <span
            className="badge"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <LayoutGrid size={14} /> Glance Matrix Mode (All Months)
          </span>
        )}

        <button
          onClick={onAddPlan}
          className="btn btn-primary"
        >
          <Plus size={16} /> Plan An Expense
        </button>
      </div>
    </div>
  );
}
