import { useMemo } from 'react';
import { Flame, CheckCircle2, Circle, Trash2, Check, Sparkles } from 'lucide-react';
import type { Habit } from '../../../types';
import {
  getRolling7Days,
  getHabit7DayStatuses,
  calculateConsistency,
  getCategoryBadgeClass,
  getStreakTier,
} from './habitHelpers';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const rollingDays = useMemo(() => getRolling7Days(), []);
  const statuses = getHabit7DayStatuses(habit.history, habit.completedToday);
  const consistency = calculateConsistency(statuses);
  const tier = getStreakTier(habit.streak);

  return (
    <div className={`glass-panel habit-card-container ${habit.completedToday ? 'card-is-done' : ''}`}>
      {/* Top Header Row */}
      <div className="habit-card-header">
        <div className="habit-card-badges">
          <span className={`habit-cat-badge ${getCategoryBadgeClass(habit.category)}`}>
            {habit.category || 'General'}
          </span>
          <span className="habit-card-freq-tag">{habit.targetFrequency}</span>
        </div>

        <button
          onClick={() => onDelete(habit.id)}
          className="habit-delete-btn"
          title="Delete Routine"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Main Habit Title & Streak */}
      <div className="habit-card-body-row">
        <div className="habit-card-title-group">
          <h4 className={`habit-card-title ${habit.completedToday ? 'text-done' : ''}`}>
            {habit.title}
          </h4>
          <span className="habit-card-target-hint">Consistency: {consistency}% this week</span>
        </div>

        {/* Gamified Streak Trophy Badge */}
        <div
          className={`habit-streak-badge ${tier.badgeClass}`}
          title={`${tier.name}: ${tier.motto}`}
        >
          <span className="matrix-streak-emoji">{tier.emoji}</span>
          <Flame
            size={16}
            fill={habit.streak >= 3 ? tier.color : 'none'}
            color={tier.color}
            className={habit.streak >= 7 ? 'streak-fire-anim' : ''}
          />
          <span className="habit-streak-num">{habit.streak}</span>
          <span className="habit-streak-days">days</span>
        </div>
      </div>

      {/* 7-Day Rolling Heatmap Strip */}
      <div className="habit-card-heatmap">
        <div className="habit-heatmap-top">
          <span className="habit-heatmap-title">7-Day Consistency</span>
          <span className={`habit-heatmap-pct ${consistency >= 80 ? 'high' : 'normal'}`}>
            <Sparkles size={11} /> {consistency}% Score
          </span>
        </div>

        <div className="habit-heatmap-boxes">
          {rollingDays.map((day, idx) => {
            const isDone = statuses[idx] === 1;

            if (day.isToday) {
              return (
                <div
                  key={day.dateStr}
                  className="habit-heatmap-day-col is-today-col"
                  onClick={() => onToggle(habit.id, habit.completedToday)}
                  title={`Today (${day.displayDate}): Click to toggle`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`habit-heatmap-square today-square ${habit.completedToday ? 'completed' : 'missed'}`}>
                    {habit.completedToday ? <Check size={12} strokeWidth={3} /> : <span className="today-dot-pulse" />}
                  </div>
                  <span className="habit-heatmap-day-label today-label">Today</span>
                </div>
              );
            }

            return (
              <div
                key={day.dateStr}
                className="habit-heatmap-day-col"
                title={`${day.displayDate} (${day.dayName}): ${isDone ? 'Completed' : 'Missed'}`}
              >
                <div className={`habit-heatmap-square ${isDone ? 'completed' : 'missed'}`}>
                  {isDone ? <Check size={11} strokeWidth={2.5} /> : null}
                </div>
                <span className="habit-heatmap-day-label">{day.dayName.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="habit-card-footer">
        <button
          onClick={() => onToggle(habit.id, habit.completedToday)}
          className={`habit-checkin-btn ${habit.completedToday ? 'done' : 'pending'}`}
        >
          {habit.completedToday ? (
            <>
              <CheckCircle2 size={18} color="#10b981" /> Completed for Today
            </>
          ) : (
            <>
              <Circle size={18} /> Mark Done for Today
            </>
          )}
        </button>
      </div>
    </div>
  );
}
