import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';

interface MonthYearFilterProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableYears: number[];
  monthlyTransactionCounts: Record<string, number>;
  totalTransactionsForYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthYearFilter({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  availableYears,
  monthlyTransactionCounts,
  totalTransactionsForYear,
  onPrevMonth,
  onNextMonth
}: MonthYearFilterProps) {
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const isCurrentActive = selectedYear === currentYear && selectedMonth === currentMonth;

  return (
    <div className="glass-panel month-filter-panel">
      <div className="month-filter-top-row">
        
        {/* Year Controls */}
        <div className="month-filter-year-nav">
          <div className="year-indicator-chip">
            <Calendar size={16} color="#6366f1" />
            <span className="year-indicator-text">YEAR:</span>
          </div>

          <div className="year-indicator-chip">
            <button 
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="btn-icon btn-nav-arrow" 
              title="Previous Year"
            >
              <ChevronLeft size={16} />
            </button>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="year-select-dropdown"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            <button 
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="btn-icon btn-nav-arrow" 
              title="Next Year"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick jump to Current Month */}
          <button 
            onClick={() => { setSelectedYear(currentYear); setSelectedMonth(currentMonth); }}
            className={`btn btn-secondary btn-jump-current ${isCurrentActive ? 'active' : ''}`}
            title={`Jump to Current Month (${currentMonth} ${currentYear})`}
          >
            Current Month ({currentMonth} {currentYear})
          </button>
        </div>

        {/* Prev / Next Month Quick Switcher */}
        <div className="month-filter-actions">
          <div className="month-browsing-info">
            Browsing: <strong className="month-browsing-strong">{selectedMonth === 'All' ? `Full Year ${selectedYear}` : `${selectedMonth} ${selectedYear}`}</strong>
          </div>
          <div className="month-nav-arrows">
            <button 
              onClick={onPrevMonth} 
              className="btn-icon btn-nav-arrow" 
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={onNextMonth} 
              className="btn-icon btn-nav-arrow" 
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 12-Month Strip + All Months Option */}
      <div className="month-grid-strip">
        {/* ALL Months Button */}
        <button
          onClick={() => setSelectedMonth('All')}
          className={`month-btn month-btn-all ${selectedMonth === 'All' ? 'active' : ''}`}
        >
          <span>All Year</span>
          <span className="month-btn-count">
            {totalTransactionsForYear} txs
          </span>
        </button>

        {/* Individual Month Buttons */}
        {MONTH_NAMES.map(month => {
          const isSelected = selectedMonth === month;
          const count = monthlyTransactionCounts[month] || 0;
          const hasData = count > 0;

          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`month-btn month-btn-month ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
            >
              <span>{month}</span>
              <span className="month-btn-count">
                {count} txs
              </span>

              {hasData && !isSelected && (
                <span className="month-indicator-dot" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
