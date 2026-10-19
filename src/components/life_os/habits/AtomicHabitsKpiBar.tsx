import { useMemo } from 'react';
import { Flame, Plus, CheckCircle2 } from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import './habits.css';

interface AtomicHabitsKpiBarProps {
  habits: Habit[];
  selectedDate?: string;
  isToday?: boolean;
  onOpenAddModal: () => void;
}

export default function AtomicHabitsKpiBar({
  habits,
  onOpenAddModal,
}: AtomicHabitsKpiBarProps) {
  // Simple, truthful calculations
  const stats = useMemo(() => {
    const total = habits.length;
    const completed = habits.filter((h) => h.completedToday).length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

    return {
      total,
      completed,
      progressPercent,
      maxStreak,
    };
  }, [habits]);

  return (
    <div className="atomic-kpi-container">
      {/* 1. Today's Progress Card */}
      <div className="atomic-kpi-card momentum-card">
        <div className="atomic-kpi-header">
          <div className="atomic-kpi-icon-wrap emerald">
            <CheckCircle2 size={18} />
          </div>
          <span className="atomic-kpi-label">Today's Progress</span>
        </div>
        <div className="atomic-kpi-main-stat">
          <span className="atomic-kpi-value">{stats.progressPercent}%</span>
          <span className="atomic-kpi-subtext">
            {stats.completed} of {stats.total} habits completed
          </span>
        </div>
        {/* Progress Bar */}
        <div className="atomic-progress-bar-bg">
          <div
            className="atomic-progress-bar-fill"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Highest Active Streak */}
      <div className="atomic-kpi-card">
        <div className="atomic-kpi-header">
          <div className="atomic-kpi-icon-wrap amber">
            <Flame size={18} />
          </div>
          <span className="atomic-kpi-label">Current Best Streak</span>
        </div>
        <div className="atomic-kpi-main-stat">
          <span className="atomic-kpi-value">{stats.maxStreak}</span>
          <span className="atomic-kpi-subtext">Days in a Row</span>
        </div>
      </div>

      {/* 3. Add Habit Quick Button */}
      <div className="atomic-kpi-card action-card">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="atomic-add-habit-btn"
          title="Add a new habit"
        >
          <div className="atomic-add-icon-circle">
            <Plus size={22} />
          </div>
          <span className="atomic-add-btn-title">Add New Habit</span>
          <span className="atomic-add-btn-sub">Quick & Simple</span>
        </button>
      </div>
    </div>
  );
}
