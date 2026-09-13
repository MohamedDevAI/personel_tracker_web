import React from 'react';
import { Flame, CheckCircle2, Circle, Sparkles, Trash2 } from 'lucide-react';
import { DAY_NAMES } from '../../utils/constants';
import type { Habit } from '../../types';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  const completedCount = habit.history.filter((x) => x === 1).length;
  const consistency = Math.round((completedCount / (habit.history.length || 1)) * 100);

  const getCategoryClass = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('health')) return 'habit-cat-health';
    if (cat.includes('fit')) return 'habit-cat-fitness';
    if (cat.includes('mind')) return 'habit-cat-mindset';
    if (cat.includes('prod')) return 'habit-cat-productivity';
    if (cat.includes('learn')) return 'habit-cat-learning';
    return 'habit-cat-productivity';
  };

  const isHotStreak = habit.streak >= 5;

  return (
    <div className="glass-panel habit-card-container">
      {/* Top Row: Title, Category, Streak */}
      <div className="habit-card-header">
        <div className="habit-card-title-group">
          <div className="habit-card-badges">
            <span className={`habit-cat-badge ${getCategoryClass(habit.category)}`}>
              {habit.category || 'General'}
            </span>
          </div>
          <h3 className="habit-card-title">{habit.title}</h3>
          <span className="habit-card-freq">Schedule: {habit.targetFrequency}</span>
        </div>

        <div className={`habit-streak-badge ${isHotStreak ? 'fire' : ''}`}>
          <Flame size={18} fill={isHotStreak ? '#f59e0b' : 'none'} color="#f59e0b" />
          <span className="habit-streak-num">{habit.streak}</span>
          <span className="habit-streak-days">days</span>
        </div>
      </div>

      {/* 7-Day History Heatmap */}
      <div className="habit-card-heatmap">
        <div className="habit-heatmap-top">
          <span className="habit-heatmap-title">Past 7 Days History</span>
          <span className="habit-heatmap-pct">{consistency}% Consistency</span>
        </div>

        <div className="habit-heatmap-boxes">
          {habit.history.map((val, idx) => (
            <div key={idx} className="habit-heatmap-day-col">
              <div
                className={`habit-heatmap-square ${val === 1 ? 'completed' : 'missed'}`}
                title={`${DAY_NAMES[idx]}: ${val === 1 ? 'Completed' : 'Not Done'}`}
              >
                {val === 1 ? <Sparkles size={11} /> : null}
              </div>
              <span className="habit-heatmap-day-label">{DAY_NAMES[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="habit-card-footer">
        <button
          onClick={() => onToggle(habit.id, habit.completedToday)}
          className={`habit-checkin-btn ${habit.completedToday ? 'done' : 'pending'}`}
        >
          {habit.completedToday ? (
            <>
              <CheckCircle2 size={18} /> Completed for Today
            </>
          ) : (
            <>
              <Circle size={18} /> Check In Today
            </>
          )}
        </button>

        <button
          onClick={() => onDelete(habit.id)}
          className="habit-delete-btn"
          title="Delete habit routine"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
