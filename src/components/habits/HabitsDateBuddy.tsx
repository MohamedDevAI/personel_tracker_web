import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';

interface HabitsDateBuddyProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onJumpToday: () => void;
}

export default function HabitsDateBuddy({
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  onJumpToday,
}: HabitsDateBuddyProps) {
  const currentRealMonth = getCurrentMonth();
  const currentRealYear = getCurrentYear();
  const isCurrentActive = selectedYear === currentRealYear && selectedMonth === currentRealMonth;

  const yearsList = [2024, 2025, 2026, 2027];

  const handlePrevMonth = () => {
    if (selectedMonth === 'All') {
      onMonthChange('Dec');
      return;
    }
    const idx = MONTH_NAMES.indexOf(selectedMonth as any);
    if (idx > 0) {
      onMonthChange(MONTH_NAMES[idx - 1]);
    } else {
      onMonthChange(MONTH_NAMES[11]);
      onYearChange(selectedYear - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'All') {
      onMonthChange('Jan');
      return;
    }
    const idx = MONTH_NAMES.indexOf(selectedMonth as any);
    if (idx < 11) {
      onMonthChange(MONTH_NAMES[idx + 1]);
    } else {
      onMonthChange(MONTH_NAMES[0]);
      onYearChange(selectedYear + 1);
    }
  };

  return (
    <div className="glass-panel habits-date-buddy-panel">
      {/* Top Control Bar */}
      <div className="habits-date-buddy-top">
        {/* Year Navigator */}
        <div className="habits-date-year-group">
          <div className="habits-date-chip">
            <Calendar size={15} color="#6366f1" />
            <span className="habits-date-chip-label">Date Buddy:</span>
          </div>

          <div className="habits-year-stepper">
            <button
              type="button"
              onClick={() => onYearChange(selectedYear - 1)}
              className="btn-icon habits-nav-arrow"
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="habits-year-select"
            >
              {yearsList.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onYearChange(selectedYear + 1)}
              className="btn-icon habits-nav-arrow"
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Quick Month Stepper & Today Button */}
        <div className="habits-date-buddy-actions">
          <div className="habits-month-stepper-btn-group">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="btn btn-secondary habits-step-btn"
              title="Previous Month"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="habits-current-period-text">
              {selectedMonth === 'All' ? `All Months ${selectedYear}` : `${selectedMonth} ${selectedYear}`}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="btn btn-secondary habits-step-btn"
              title="Next Month"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={onJumpToday}
            className={`btn ${isCurrentActive ? 'btn-secondary active-today-btn' : 'btn-primary'}`}
            title="Jump to Today's Current Date"
          >
            <Sparkles size={14} /> Today ({currentRealMonth} {currentRealYear})
          </button>
        </div>
      </div>

      {/* Month Pills Bar */}
      <div className="habits-month-pills-row">
        <button
          type="button"
          onClick={() => onMonthChange('All')}
          className={`habits-month-pill ${selectedMonth === 'All' ? 'active' : ''}`}
        >
          All
        </button>

        {MONTH_NAMES.map((m) => {
          const isMonthActive = selectedMonth === m;
          const isCurrentReal = m === currentRealMonth && selectedYear === currentRealYear;

          return (
            <button
              key={m}
              type="button"
              onClick={() => onMonthChange(m)}
              className={`habits-month-pill ${isMonthActive ? 'active' : ''} ${isCurrentReal ? 'is-current-month' : ''}`}
            >
              <span>{m}</span>
              {isCurrentReal && <span className="habits-today-dot" title="Current Month" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
