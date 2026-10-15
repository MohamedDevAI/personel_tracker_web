interface PlannedExpensesHeaderProps {
  onAddPlan?: () => void;
  selectedMonth?: string;
  onSelectAllMonths?: () => void;
}

export default function PlannedExpensesHeader(_props: PlannedExpensesHeaderProps = {}) {
  return (
    <div className="planned-header-row mb-4">
      <div>
        <h2 className="planned-header-title">
          Planned Expenses &amp; <span className="emerald-gradient-text">Fulfillment Tracker</span>
        </h2>
      </div>
    </div>
  );
}
