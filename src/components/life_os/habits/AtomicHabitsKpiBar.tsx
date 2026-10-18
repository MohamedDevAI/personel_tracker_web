import { useMemo } from 'react';
import { Flame, Target, ShieldAlert, Plus, Sparkles, CheckCircle2, Award } from 'lucide-react';
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
  onFilterNeverMissTwice,
}: AtomicHabitsKpiBarProps) {
  // Calculations
  const stats = useMemo(() => {
    const total = habits.length;
    // Check completed for current active view
    const completed = habits.filter((h: any) =>
      h.isCompletedOnSelectedDate !== undefined ? h.isCompletedOnSelectedDate : h.completedToday
    ).length;

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
        <p className="atomic-kpi-footnote">
          {stats.momentumPercent === 100 ? (
            <span className="text-emerald-glow">🌟 All systems fired! +1% better today</span>
          ) : (
            <span>Tiny daily wins compound into 37x growth</span>
          )}
        </p>
      </div>

      {/* 2. Identity Votes Cast */}
      <div className="atomic-kpi-card">
        <div className="atomic-kpi-header">
          <div className="atomic-kpi-icon-wrap teal">
            <Target size={18} />
          </div>
          <span className="atomic-kpi-label">Identity Votes Cast</span>
        </div>
        <div className="atomic-kpi-main-stat">
          <span className="atomic-kpi-value">{stats.completed}</span>
          <span className="atomic-kpi-badge-pill">
            <CheckCircle2 size={12} />
            Votes Today
          </span>
        </div>
        <p className="atomic-kpi-footnote">
          "Every action is a vote for the person you want to become."
        </p>
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
        <p className="atomic-kpi-footnote">
          <Award size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
          Consistency builds identity
        </p>
      </div>

      {/* 4. Never Miss Twice Protocol Alert Card */}
      <div
        className={`atomic-kpi-card alert-card ${
          stats.neverMissTwiceCount > 0 ? 'is-warning-active' : ''
        }`}
        onClick={stats.neverMissTwiceCount > 0 ? onFilterNeverMissTwice : undefined}
        style={{ cursor: stats.neverMissTwiceCount > 0 ? 'pointer' : 'default' }}
        title={
          stats.neverMissTwiceCount > 0
            ? 'Click to filter habits needing a comeback today'
            : 'All habits protected'
        }
      >
        <div className="atomic-kpi-header">
          <div
            className={`atomic-kpi-icon-wrap ${
              stats.neverMissTwiceCount > 0 ? 'orange-pulse' : 'gray'
            }`}
          >
            <ShieldAlert size={18} />
          </div>
          <span className="atomic-kpi-label">Never Miss Twice</span>
        </div>
        <div className="atomic-kpi-main-stat">
          <span className="atomic-kpi-value">
            {stats.neverMissTwiceCount}
          </span>
          <span className="atomic-kpi-subtext">
            {stats.neverMissTwiceCount === 1 ? 'Habit at risk' : 'Habits at risk'}
          </span>
        </div>
        <p className="atomic-kpi-footnote">
          {stats.neverMissTwiceCount > 0 ? (
            <span className="text-orange-bold">⚡ Missing once is an accident. Never miss twice!</span>
          ) : (
            <span className="text-muted-check">🛡️ No broken streaks today</span>
          )}
        </p>
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
