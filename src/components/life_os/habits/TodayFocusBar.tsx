import { useMemo } from 'react';
import { CheckCircle2, Circle, Flame, Sparkles, CheckCheck, Award } from 'lucide-react';
import type { Habit } from '../../../types';
import { getCategoryBadgeClass, getStreakTier } from './habitHelpers';

interface TodayFocusBarProps {
  habits: Habit[];
  onToggle: (id: string, currentlyDone: boolean) => void;
  onBulkCheckIn: () => void;
}

export default function TodayFocusBar({ habits, onToggle, onBulkCheckIn }: TodayFocusBarProps) {
  const total = habits.length;
  const completed = habits.filter((h) => h.completedToday).length;
  const pending = total - completed;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = total > 0 && pending === 0;

  // Sort habits so pending ones come first, then completed ones
  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      if (a.completedToday === b.completedToday) return b.streak - a.streak;
      return a.completedToday ? 1 : -1;
    });
  }, [habits]);

  if (total === 0) return null;

  return (
    <div className={`glass-panel today-focus-panel ${isAllDone ? 'all-crushed' : ''}`}>
      {/* Top Bar Header */}
      <div className="today-focus-header">
        <div className="today-focus-left">
          <div className="today-focus-icon-wrap">
            {isAllDone ? (
              <Award size={22} className="all-done-trophy" />
            ) : (
              <Sparkles size={20} color="#818cf8" />
            )}
          </div>
          <div>
            <div className="today-focus-title-row">
              <h3 className="today-focus-title">
                {isAllDone ? '🎉 All Habits Crushed Today!' : "Today's Power Checklist"}
              </h3>
              <span className={`today-focus-score-badge ${isAllDone ? 'done-gold' : ''}`}>
                {completed} of {total} Done ({progressPct}%)
              </span>
            </div>
            <p className="today-focus-sub">
              {isAllDone
                ? 'Flawless execution! You defended every single streak today.'
                : `Tap any habit to check it off instantly. ${pending} routine${pending === 1 ? '' : 's'} remaining.`}
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="today-focus-actions">
          {!isAllDone && (
            <button
              onClick={onBulkCheckIn}
              className="btn btn-secondary today-bulk-btn"
              title="Mark all remaining habits as completed"
            >
              <CheckCheck size={16} color="#34d399" /> Check Off All ({pending})
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="today-focus-track-bar">
        <div
          className={`today-focus-fill-bar ${isAllDone ? 'fill-gold' : ''}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Habits Quick Chips Grid */}
      <div className="today-focus-cards-grid">
        {sortedHabits.map((habit) => {
          const tier = getStreakTier(habit.streak);
          const isDone = habit.completedToday;

          return (
            <div
              key={habit.id}
              onClick={() => onToggle(habit.id, isDone)}
              className={`today-habit-card ${isDone ? 'is-completed' : 'is-pending'}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(habit.id, isDone);
                }
              }}
              title={`Click to ${isDone ? 'uncheck' : 'complete'} "${habit.title}"`}
            >
              {/* Check Indicator Icon */}
              <div className="today-habit-check-icon">
                {isDone ? (
                  <CheckCircle2 size={24} className="check-done-icon" />
                ) : (
                  <Circle size={24} className="check-ring-icon" />
                )}
              </div>

              {/* Title & Category */}
              <div className="today-habit-info">
                <span className={`today-habit-title ${isDone ? 'strikethrough' : ''}`}>
                  {habit.title}
                </span>
                <div className="today-habit-meta">
                  <span className={`habit-cat-badge ${getCategoryBadgeClass(habit.category)}`}>
                    {habit.category || 'General'}
                  </span>
                  <span className="today-habit-freq">{habit.targetFrequency}</span>
                </div>
              </div>

              {/* Streak Badge with Tier Glow */}
              <div
                className={`today-habit-streak-pill ${tier.badgeClass} ${isDone ? 'streak-pump' : ''}`}
                title={tier.motto}
              >
                <span className="streak-emoji">{tier.emoji}</span>
                <span className="streak-count">{habit.streak}d</span>
                <Flame
                  size={14}
                  fill={habit.streak >= 3 ? tier.color : 'none'}
                  color={tier.color}
                  className={habit.streak >= 7 ? 'streak-fire-anim' : ''}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
