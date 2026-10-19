import { useMemo } from 'react';
import { Flame, Plus, Sparkles } from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import './habits.css';

interface AtomicHabitsKpiBarProps {
  habits: Habit[];
  selectedDate: string;
  isToday: boolean;
  onOpenAddModal: () => void;
  onFilterNeverMissTwice?: () => void;
}

export default function AtomicHabitsKpiBar({
  habits,
  selectedDate: _selectedDate,
  isToday: _isToday,
  onOpenAddModal,
}: AtomicHabitsKpiBarProps) {
  // Calculations
  const stats = useMemo(() => {
    const total = habits.length;
    // Check completed habits
    const completed = habits.filter((h) => h.completedToday).length;

    const momentumPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Highest active streak
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

    // Habits at risk ("Never Miss Twice")
    const neverMissTwiceCount = habits.filter((h) => h.missedYesterday).length;

    return {
      total,
      completed,
      momentumPercent,
      maxStreak,
      neverMissTwiceCount,
    };
  }, [habits]);

  return (
    <div className="atomic-kpi-container">
      {/* 1. Daily Momentum Compounding Card */}
      <div className="atomic-kpi-card momentum-card">
        <div className="atomic-kpi-header">
          <div className="atomic-kpi-icon-wrap emerald">
            <Sparkles size={18} />
          </div>
          <span className="atomic-kpi-label">Atomic Momentum</span>
        </div>
        <div className="atomic-kpi-main-stat">
          <span className="atomic-kpi-value">{stats.momentumPercent}%</span>
          <span className="atomic-kpi-subtext">
            {stats.completed}/{stats.total} habits
          </span>
        </div>
        {/* Progress Bar */}
        <div className="atomic-progress-bar-bg">
          <div
            className="atomic-progress-bar-fill"
            style={{ width: `${stats.momentumPercent}%` }}
          />
        </div>

      </div>

      {/* 3. Top Active Streak */}
      <div className="atomic-kpi-card">
        <div className="atomic-kpi-header">
          <div className="atomic-kpi-icon-wrap amber">
            <Flame size={18} />
          </div>
          <span className="atomic-kpi-label">Highest Streak</span>
        </div>
        <div className="atomic-kpi-main-stat">
          <span className="atomic-kpi-value">{stats.maxStreak}</span>
          <span className="atomic-kpi-subtext">Days in a Row</span>
        </div>

      </div>



      {/* 5. Add Habit Quick Button */}
      <div className="atomic-kpi-card action-card">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="atomic-add-habit-btn"
          title="Create a new habit using the 4 Laws of Behavior Change"
        >
          <div className="atomic-add-icon-circle">
            <Plus size={22} />
          </div>
          <span className="atomic-add-btn-title">Design New Habit</span>
          <span className="atomic-add-btn-sub">Using the 4 Laws</span>
        </button>
      </div>
    </div>
  );
}
