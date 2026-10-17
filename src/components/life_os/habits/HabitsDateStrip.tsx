import { useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { MONTH_NAMES, getLocalDateISO } from '../../../utils/dateHelpers';

export interface HabitsDateStripProps {
  selectedDate: string; // ISO string 'YYYY-MM-DD' or 'ALL'
  onSelectDate: (date: string) => void;
  viewYear: number;
  viewMonth: number; // 0-11
  onChangeMonth: (year: number, month: number) => void;
  dailyCompletionCounts?: Record<string, number>; // 'YYYY-MM-DD' -> count
}

export default function HabitsDateStrip({
  selectedDate,
  onSelectDate,
  viewYear,
  viewMonth,
  onChangeMonth,
  dailyCompletionCounts = {},
}: HabitsDateStripProps) {
  const activePillRef = useRef<HTMLButtonElement | null>(null);
  const stripScrollRef = useRef<HTMLDivElement | null>(null);

  const todayISO = useMemo(() => getLocalDateISO(new Date()), []);
  const todayDateObj = useMemo(() => new Date(), []);
  const currentRealYear = todayDateObj.getFullYear();
  const currentRealMonth = todayDateObj.getMonth();

  // Number of days in the currently viewed month
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  // Generate all day items for the current viewed month
  const monthDays = useMemo(() => {
    const days = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(viewYear, viewMonth, dayNum);
      const dateISO = getLocalDateISO(dateObj);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = dateISO === todayISO;
      const count = dailyCompletionCounts[dateISO] || 0;
      const hasData = count > 0;

      days.push({
        dayNumber: dayNum,
        dayName,
        dateISO,
        isToday,
        count,
        hasData,
      });
    }
    return days;
  }, [viewYear, viewMonth, daysInMonth, todayISO, dailyCompletionCounts]);

  const isAllSelected = selectedDate === 'ALL';
  const isViewingCurrentMonth = viewYear === currentRealYear && viewMonth === currentRealMonth;

  // Auto-scroll selected date into view smoothly
  useEffect(() => {
    if (activePillRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedDate, viewMonth, viewYear]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      onChangeMonth(viewYear - 1, 11);
    } else {
      onChangeMonth(viewYear, viewMonth - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (viewMonth === 11) {
      onChangeMonth(viewYear + 1, 0);
    } else {
      onChangeMonth(viewYear, viewMonth + 1);
    }
  };

  // Jump to Today
  const handleJumpToday = () => {
    onChangeMonth(currentRealYear, currentRealMonth);
    onSelectDate(todayISO);
  };

  // Scroll buttons for desktop/touch
  const scrollStrip = (direction: 'left' | 'right') => {
    if (stripScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      stripScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="habits-date-toolbar-container">
      {/* Month Navigator Header */}
      <div className="habits-date-nav-row">
        <div className="habits-date-month-controls">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn-icon habits-date-nav-btn"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="habits-date-month-title">
            <Calendar size={15} className="habits-date-cal-icon" />
            <span className="habits-date-month-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="btn-icon habits-date-nav-btn"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="habits-date-nav-actions">
          <button
            type="button"
            onClick={handleJumpToday}
            className={`habits-date-today-btn ${
              isViewingCurrentMonth && selectedDate === todayISO ? 'is-active-today' : ''
            }`}
            title="Jump to Today's Date"
          >
            <Sparkles size={13} />
            Today
          </button>
        </div>
      </div>

      {/* Horizontal Dates Strip */}
      <div className="habits-date-strip-wrapper">
        <button
          type="button"
          onClick={() => scrollStrip('left')}
          className="habits-strip-scroll-arrow left"
          title="Scroll left"
          aria-label="Scroll dates left"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="habits-date-strip" ref={stripScrollRef} role="region" aria-label="Dates selector">
          {/* All Days in Month Button */}
          <button
            type="button"
            onClick={() => onSelectDate('ALL')}
            ref={isAllSelected ? activePillRef : null}
            className={`habits-date-pill habits-date-pill-all ${isAllSelected ? 'active' : ''}`}
            title={`View all days for ${MONTH_NAMES[viewMonth]} ${viewYear}`}
          >
            <span className="habits-date-pill-num">All</span>
            <span className="habits-date-pill-day">Month</span>
          </button>

          {/* Individual Day Number Pills (1 to 28/30/31) */}
          {monthDays.map((day) => {
            const isSelected = selectedDate === day.dateISO;

            return (
              <button
                key={day.dateISO}
                type="button"
                onClick={() => onSelectDate(day.dateISO)}
                ref={isSelected ? activePillRef : null}
                className={`habits-date-pill ${isSelected ? 'active' : ''} ${day.isToday ? 'is-today' : ''} ${
                  day.hasData ? 'has-data' : ''
                }`}
                title={`${day.dayName}, ${MONTH_NAMES[viewMonth]} ${day.dayNumber}, ${viewYear}${
                  day.isToday ? ' (Today)' : ''
                }`}
              >
                {/* Day Number */}
                <span className="habits-date-pill-num">{day.dayNumber}</span>

                {/* Day of the Week */}
                <span className="habits-date-pill-day">
                  {day.isToday ? 'Today' : day.dayName}
                </span>

                {/* Orange Indicator Dot on dates with habit activity */}
                {day.hasData && !isSelected && (
                  <span className="habits-date-dot" aria-hidden="true" />
                )}

                {/* Subtle indicator for Today when not selected */}
                {day.isToday && !isSelected && (
                  <span className="habits-today-marker" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollStrip('right')}
          className="habits-strip-scroll-arrow right"
          title="Scroll right"
          aria-label="Scroll dates right"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
