import React from 'react';
import { Plus } from 'lucide-react';
import { MONTH_NAMES } from '../../../utils/dateHelpers';

interface PlannedExpensesHeaderProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onAddPlan: () => void;
}

export default function PlannedExpensesHeader({
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  onAddPlan
}: PlannedExpensesHeaderProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = React.useMemo(() => {
    const set = new Set([currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2, selectedYear]);
    return Array.from(set).sort();
  }, [currentYear, selectedYear]);

  return (
    <div className="planned-header-row">
      <div>
        <h2 className="planned-header-title">
          Planned Expenses &amp; <span className="emerald-gradient-text">Fulfillment Tracker</span>
        </h2>
      </div>

      <div className="planned-header-actions">
        {/* Month & Year Filter Pills */}
        <div className="month-year-select-bar">
          <select
            value={selectedMonth}
            onChange={e => onMonthChange(e.target.value)}
            className="select-custom-pill"
            title="Select Month"
          >
            {MONTH_NAMES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => onYearChange(Number(e.target.value))}
            className="select-custom-pill"
            title="Select Year"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddPlan}
          className="btn btn-primary"
        >
          <Plus size={16} />  Plan An Expense
        </button>
      </div>
    </div>
  );
}
