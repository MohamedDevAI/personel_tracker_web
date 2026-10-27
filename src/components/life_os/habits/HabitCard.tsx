import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import './habits.css';

interface HabitCardProps {
  habit: Habit;
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
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  // Completed status
  const isCompleted = habit.completedToday;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.habit-dropdown-menu')) {
      return;
    }
    navigate(`/life-os/habits/${habit.id}`);
  };

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
      className={`habit-card-container ${isCompleted ? 'is-completed' : ''}`}
      onClick={handleCardClick}
      title="Click to view detailed analytics & consistency calendar"
    >
      {/* ─── Card Header: Category, Identity & Actions ────────────────── */}
      <div className="habit-card-header">
        <div className="habit-tags-group">
          {/* Category */}
          <span className="habit-category-pill">{habit.category || 'General'}</span>
          {habit.startDate && (
            <span className="habit-start-date-pill" title={`Started on ${habit.startDate}`}>
              Since {habit.startDate}
            </span>
          )}
        </div>

        {/* 3-dots Menu */}
        <div className="habit-menu-wrapper">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="habit-menu-btn"
            title="Options"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="habit-menu-backdrop"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="habit-dropdown-menu">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    navigate(`/life-os/habits/${habit.id}`);
                  }}
                  className="habit-dropdown-item"
                >
                  <BarChart2 size={13} />
                  <span>View Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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
                  onClick={(e) => {
                    e.stopPropagation();
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
          onClick={(e) => {
            e.stopPropagation();
            onToggle(habit.id, isCompleted);
          }}
          className={`habit-checkbox-btn ${isCompleted ? 'checked' : ''}`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isCompleted && <Check size={18} strokeWidth={3} />}
        </button>

        {/* Habit Title & Frequency */}
        <div
          className="habit-title-wrapper"
          onClick={() => navigate(`/life-os/habits/${habit.id}`)}
        >
          <h3 className={`habit-title ${isCompleted ? 'completed-text' : ''}`}>
            {habit.title}
          </h3>
          <span className="habit-target-frequency">
            {habit.targetFrequency || 'Daily'}
          </span>
        </div>
      </div>


      {/* ─── Card Footer: Streak + Consistency Dots + Analytics Link ──── */}
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

        {/* Quick Analytics Chip Link */}
        <div
          className="habit-analytics-chip"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/life-os/habits/${habit.id}`);
          }}
          title="Open complete analytics dashboard"
        >
          <BarChart2 size={12} />
          <span>Analytics</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}
