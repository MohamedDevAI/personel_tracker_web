import { MONTH_NAMES, getCurrentYear } from '../../../utils/dateHelpers';

export interface HabitsDateStripProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  selectedYear?: number;
  monthlyCounts?: Record<string, number>;
  totalCount?: number;
  countLabel?: string;
}

export default function HabitsDateStrip({
  selectedMonth,
  onSelectMonth,
  selectedYear = getCurrentYear(),
  monthlyCounts = {},
  totalCount,
  countLabel = 'habits',
}: HabitsDateStripProps) {
  const isAllSelected = selectedMonth.toLowerCase() === 'all';

  // Calculate total across months if totalCount not explicitly provided
  const computedTotal = totalCount !== undefined
    ? totalCount
    : Object.values(monthlyCounts).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="habits-date-strip" role="region" aria-label="Month selection toolbar">
      {/* All Year Button */}
      <button
        type="button"
        onClick={() => onSelectMonth('All')}
        className={`habits-date-pill habits-date-pill-all ${isAllSelected ? 'active' : ''}`}
        title={`View all habits for ${selectedYear}`}
      >
        <span className="habits-date-pill-label">All Year</span>
        <span className="habits-date-pill-count">
          {computedTotal} {countLabel}
        </span>
      </button>

      {/* 12 Individual Month Buttons */}
      {MONTH_NAMES.map((month) => {
        const isSelected = selectedMonth.toLowerCase() === month.toLowerCase();
        const count = monthlyCounts[month] || 0;
        const hasData = count > 0;

        return (
          <button
            key={month}
            type="button"
            onClick={() => onSelectMonth(month)}
            className={`habits-date-pill ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
            title={`Select ${month} ${selectedYear}`}
          >
            <span className="habits-date-pill-label">{month}</span>
            <span className="habits-date-pill-count">
              {count} {countLabel}
            </span>

            {/* Orange indicator dot when month has activity and is not selected */}
            {hasData && !isSelected && (
              <span className="habits-date-dot" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
