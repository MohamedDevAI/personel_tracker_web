import { useState, useMemo } from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import HabitsDateStrip from './HabitsDateStrip';
import { getCurrentMonth, getCurrentYear } from '../../../utils/dateHelpers';
import { useHabitsQuery } from '../../../hooks/useHabitsQuery';
import './habits.css';

export default function HabitsView() {
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const selectedYear = currentYear;

  const { data: habits = [] } = useHabitsQuery();

  // Compute habit completion counts or counts per month
  const monthlyCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    if (habits.length > 0) {
      counts[currentMonth] = habits.length;
    }
    return counts;
  }, [habits, currentMonth]);

  const totalCount = useMemo(() => {
    return habits.length;
  }, [habits]);

  return (
    <div className="habits-container">
      {/* Top Dates Filter Strip matching the design */}
      <HabitsDateStrip
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        selectedYear={selectedYear}
        monthlyCounts={monthlyCounts}
        totalCount={totalCount}
        countLabel="habits"
      />

      {/* Habits Main Content Area */}
      <div className="habits-clean-slate">
        <div className="habits-active-month-badge">
          <Calendar size={14} />
          <span>
            {selectedMonth === 'All' ? `All Year ${selectedYear}` : `${selectedMonth} ${selectedYear}`}
          </span>
        </div>

        <div className="habits-clean-slate-icon">
          <Sparkles size={30} />
        </div>
        <h2 className="habits-clean-slate-title">Habit Tracker Ready</h2>
        <p className="habits-clean-slate-desc">
          Top date filter strip has been added. Select any month to filter habits, or describe the next feature you want to add!
        </p>
      </div>
    </div>
  );
}
