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

      <div className="planned-header-actions">
        {!isAll && onSelectAllMonths && (
          <button
            type="button"
            onClick={onSelectAllMonths}
            className="btn btn-secondary planned-header-switch-btn"
            title="Switch back to the All-Months Glance Matrix"
          >
            <LayoutGrid size={15} /> All Months (Glance Matrix)
          </button>
        )}

        {isAll && (
          <span className="badge planned-header-glance-badge">
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
