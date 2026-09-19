import { Plus } from 'lucide-react';

interface PlannedExpensesHeaderProps {
  onAddPlan: () => void;
}

export default function PlannedExpensesHeader({
  onAddPlan
}: PlannedExpensesHeaderProps) {
  return (
    <div className="planned-header-row mb-4">
      <div>
        <h2 className="planned-header-title">
          Planned Expenses &amp; <span className="emerald-gradient-text">Fulfillment Tracker</span>
        </h2>
      </div>

      <div className="planned-header-actions">
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
