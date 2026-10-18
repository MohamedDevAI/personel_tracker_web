import React, { useState } from 'react';
import {
  Flame,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  Link2,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import './habits.css';

interface HabitCardProps {
  habit: Habit & { isCompletedOnSelectedDate?: boolean };
  selectedDate: string;
  isToday: boolean;
  onToggle: (id: string, wasCompleted: boolean) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string, title: string) => void;
}

export default function HabitCard({
  habit,
  selectedDate: _selectedDate,
  isToday,
  onToggle,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Completed status for the currently selected date
  const isCompleted =
    habit.isCompletedOnSelectedDate !== undefined
      ? habit.isCompletedOnSelectedDate
      : habit.completedToday;

  // Generate 7-day mini consistency dots from habit history
  const miniHistory = React.useMemo(() => {
    const raw = habit.history || [];
    // Ensure 7 items
    const filled = [...raw];
    while (filled.length < 7) {
      filled.unshift(0);
    }
    const last7 = filled.slice(-7);
    // If today is completed, make the last dot 1
    if (isToday && isCompleted) {
      last7[6] = 1;
    }
    return last7;
  }, [habit.history, isToday, isCompleted]);

  return (
    <div
      className={`habit-card-container ${isCompleted ? 'is-completed' : ''} ${
        habit.missedYesterday && !isCompleted ? 'is-never-miss-twice' : ''
      }`}
    >
      {/* ─── Card Header: Category, Identity & Actions ────────────────── */}
      <div className="habit-card-header">
        <div className="habit-tags-group">
          {/* Category */}
          <span className="habit-category-pill">{habit.category || 'General'}</span>

          {/* Identity Statement ("Who you are becoming") */}
          {habit.identity && (
            <span className="habit-identity-pill" title={`Identity: ${habit.identity}`}>
              ✨ {habit.identity}
            </span>
          )}
        </div>

        {/* 3-dots Menu */}
        <div className="habit-menu-wrapper">
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="habit-menu-btn"
            title="Options"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="habit-menu-backdrop"
                onClick={() => setShowMenu(false)}
              />
              <div className="habit-dropdown-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(habit);
                  }}
                  className="habit-dropdown-item"
                >
                  <Edit2 size={13} />
                  <span>Edit Habit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(habit.id, habit.title);
                  }}
                  className="habit-dropdown-item delete"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Card Main: Checkbox + Title ──────────────────────────────── */}
      <div className="habit-main-row">
        {/* Big Tactile Checkbox Button */}
        <button
          type="button"
          onClick={() => onToggle(habit.id, isCompleted)}
          className={`habit-checkbox-btn ${isCompleted ? 'checked' : ''}`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isCompleted && <Check size={18} strokeWidth={3} />}
        </button>

        {/* Habit Title & Frequency */}
        <div className="habit-title-wrapper" onClick={() => onToggle(habit.id, isCompleted)}>
          <h3 className={`habit-title ${isCompleted ? 'completed-text' : ''}`}>
            {habit.title}
          </h3>
          <span className="habit-target-frequency">
            {habit.targetFrequency || 'Daily'}
          </span>
        </div>
      </div>

      {/* ─── Atomic Habits Core Modules ─────────────────────────────────── */}

      {/* 1. Habit Stack Anchor Cue (Law 1: Make it Obvious) */}
      {habit.habitStack && (
        <div className="habit-atomic-cue-box" title="Habit Stacking Anchor">
          <div className="habit-cue-icon">
            <Link2 size={13} />
          </div>
          <div className="habit-cue-content">
            <span className="habit-cue-label">Anchor:</span>
            <span className="habit-cue-text">{habit.habitStack}</span>
          </div>
        </div>
      )}

      {/* 2. The 2-Minute Gateway Rule (Law 3: Make it Easy) */}
      {habit.twoMinuteRule && (
        <div className="habit-atomic-easy-box" title="The 2-Minute Gateway Starter">
          <div className="habit-easy-icon">
            <Zap size={13} />
          </div>
          <div className="habit-easy-content">
            <span className="habit-easy-label">2-Min Starter:</span>
            <span className="habit-easy-text">{habit.twoMinuteRule}</span>
          </div>
        </div>
      )}

      {/* 3. Never Miss Twice Alert (Law 4: Make it Satisfying / Resilience) */}
      {habit.missedYesterday && !isCompleted && (
        <div className="habit-never-miss-alert">
          <ShieldAlert size={14} className="alert-pulse-icon" />
          <span>
            <strong>Never Miss Twice!</strong> Yesterday slipped by — make today your comeback vote.
          </span>
        </div>
      )}

      {/* ─── Card Footer: Streak + Consistency Dots ───────────────────── */}
      <div className="habit-card-footer">
        {/* Streak Counter */}
        <div className="habit-streak-badge" title={`${habit.streak || 0} consecutive days`}>
          <Flame size={15} className={`streak-fire ${(habit.streak || 0) > 0 ? 'flame-lit' : ''}`} />
          <span className="streak-count">{habit.streak || 0}</span>
          <span className="streak-label">day streak</span>
        </div>

        {/* 7-Day Consistency Mini-dots */}
        <div className="habit-consistency-tracker" title="7-day consistency trail">
          <span className="tracker-label">Last 7d</span>
          <div className="tracker-dots">
            {miniHistory.map((val, idx) => (
              <span
                key={idx}
                className={`tracker-dot ${val > 0 ? 'active' : ''} ${
                  idx === 6 ? 'today-dot' : ''
                }`}
                title={`Day ${idx + 1}: ${val > 0 ? 'Completed' : 'Missed'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
