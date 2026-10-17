import { useState, useMemo } from 'react';
import { Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import HabitsDateStrip from './HabitsDateStrip';
import { getLocalDateISO, MONTH_NAMES } from '../../../utils/dateHelpers';
import { useHabitsQuery } from '../../../hooks/useHabitsQuery';
import './habits.css';

export default function HabitsView() {
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => getLocalDateISO(today), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  const { data: habits = [] } = useHabitsQuery();

  const handleChangeMonth = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  };

  // Completion counts per date (can be mapped from habit history when available)
  const dailyCompletionCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    if (habits.length > 0) {
      // Mark today with active habits count
      counts[todayISO] = habits.filter((h) => h.completedToday).length;
    }
    return counts;
  }, [habits, todayISO]);

  // Formatted date string for user display
  const displaySelectedDate = useMemo(() => {
    if (selectedDate === 'ALL') {
      return `All Days (${MONTH_NAMES[viewMonth]} ${viewYear})`;
    }
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (!y || !m || !d) return selectedDate;
    const dateObj = new Date(y, m - 1, d);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const isToday = selectedDate === todayISO;
    return `${dayName}, ${MONTH_NAMES[m - 1]} ${d}, ${y}${isToday ? ' (Today)' : ''}`;
  }, [selectedDate, viewMonth, viewYear, todayISO]);

  return (
    <div className="habits-container">
      {/* Top Calendar Dates Strip Toolbar */}
      <HabitsDateStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onChangeMonth={handleChangeMonth}
        dailyCompletionCounts={dailyCompletionCounts}
      />

      {/* Habits Content Area */}
      <div className="habits-clean-slate">
        <div className="habits-active-month-badge">
          <Calendar size={14} />
          <span>{displaySelectedDate}</span>
        </div>

        <div className="habits-clean-slate-icon">
          <Sparkles size={30} />
        </div>
        <h2 className="habits-clean-slate-title">Habit Tracker Ready</h2>
        <p className="habits-clean-slate-desc">
          Top date picker strip is active. You can select any day (or "All Month") to view and track your habits.
        </p>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} color="#2dd4bf" />
          <span>Selected date: <strong style={{ color: '#ffffff' }}>{selectedDate === 'ALL' ? 'All Days' : selectedDate}</strong></span>
        </div>
      </div>
    </div>
  );
}
