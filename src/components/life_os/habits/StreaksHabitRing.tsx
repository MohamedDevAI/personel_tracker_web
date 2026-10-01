import React from 'react';
import {
  Droplets,
  Dumbbell,
  BookOpen,
  Brain,
  Code,
  Wallet,
  Footprints,
  Heart,
  Moon,
  Target,
  Check,
  Flame,
  Trash2,
} from 'lucide-react';
import type { Habit } from '../../../types';
import {
  getRolling7Days,
  getHabit7DayStatuses,
  getStreaksColor,
  getStreaksIconType,
  getStreakTier,
} from './habitHelpers';

interface StreaksHabitRingProps {
  habit: Habit;
  index: number;
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
}

export default function StreaksHabitRing({
  habit,
  index,
  onToggle,
  onDelete,
}: StreaksHabitRingProps) {
  const isDone = habit.completedToday;
  const streakTheme = getStreaksColor(index, habit.category);
  const iconType = getStreaksIconType(habit.title, habit.category);
  const tier = getStreakTier(habit.streak);

  const rollingDays = getRolling7Days();
  const statuses = getHabit7DayStatuses(habit.history, habit.completedToday);

  // SVG circular ring geometry (Chunky 150px circle with 10px stroke)
  const radius = 62;
  const circumference = 2 * Math.PI * radius; // ~389.56
  const strokeDashoffset = isDone ? 0 : circumference;

  const renderIcon = () => {
    const iconProps = {
      size: 46,
      strokeWidth: 2.5,
      color: isDone ? '#ffffff' : streakTheme.color,
      className: 'streaks-ring-center-icon',
    };

    switch (iconType) {
      case 'Droplets':
        return <Droplets {...iconProps} />;
      case 'Dumbbell':
        return <Dumbbell {...iconProps} />;
      case 'BookOpen':
        return <BookOpen {...iconProps} />;
      case 'Brain':
        return <Brain {...iconProps} />;
      case 'Code':
        return <Code {...iconProps} />;
      case 'Wallet':
        return <Wallet {...iconProps} />;
      case 'Footprints':
        return <Footprints {...iconProps} />;
      case 'Heart':
        return <Heart {...iconProps} />;
      case 'Moon':
        return <Moon {...iconProps} />;
      default:
        return <Target {...iconProps} />;
    }
  };

  return (
    <div className={`streaks-habit-node ${isDone ? 'is-completed' : 'is-pending'}`}>
      {/* Delete trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(habit.id);
        }}
        className="streaks-delete-btn"
        title={`Delete "${habit.title}"`}
      >
        <Trash2 size={13} />
      </button>

      {/* Iconic Large Circular Tap Target (152px) */}
      <button
        type="button"
        onClick={() => onToggle(habit.id, isDone)}
        className="streaks-ring-button"
        aria-label={`Mark ${habit.title} as ${isDone ? 'incomplete' : 'done'}`}
        style={
          {
            '--ring-theme': streakTheme.color,
            '--ring-glow': streakTheme.glow,
          } as React.CSSProperties
        }
      >
        {/* SVG Progress Ring */}
        <svg className="streaks-ring-svg" viewBox="0 0 150 150">
          {/* Background track circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="streaks-ring-track"
          />
          {/* Animated active progress stroke */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            className="streaks-ring-fill"
            style={{
              stroke: streakTheme.color,
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Inner Circle Disc */}
        <div
          className={`streaks-ring-inner-disc ${isDone ? 'disc-active' : 'disc-idle'}`}
          style={{
            backgroundColor: isDone ? streakTheme.color : '#ffffff',
            boxShadow: isDone
              ? `0 12px 32px ${streakTheme.glow}, 0 2px 8px rgba(255, 85, 0, 0.2)`
              : '0 8px 24px rgba(255, 85, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04)',
          }}
        >
          {renderIcon()}

          {/* Glowing Checkmark Badge overlay when completed */}
          {isDone && (
            <div className="streaks-ring-check-overlay">
              <Check size={18} strokeWidth={3.5} color="#ffffff" />
            </div>
          )}
        </div>
      </button>

      {/* Habit Title */}
      <div className="streaks-habit-caption">
        <h4 className={`streaks-habit-title ${isDone ? 'title-done' : ''}`}>
          {habit.title}
        </h4>
        <span className="streaks-habit-freq">{habit.targetFrequency || 'Daily'}</span>
      </div>

      {/* Streak Badge with Tier Fire */}
      <div
        className={`streaks-pill-badge ${tier.badgeClass}`}
        title={`${tier.name}: ${tier.motto}`}
      >
        <Flame
          size={15}
          fill={habit.streak >= 3 ? streakTheme.color : 'none'}
          color={streakTheme.color}
          className={habit.streak >= 5 ? 'streak-fire-anim' : ''}
        />
        <span className="streaks-pill-num">{habit.streak}</span>
        <span className="streaks-pill-unit">DAYS</span>
      </div>

      {/* Apple Streaks 7-Day Mini Dots Strip */}
      <div className="streaks-mini-dots-row">
        {rollingDays.map((day, idx) => {
          const dayCompleted = statuses[idx] === 1;

          return (
            <div
              key={day.dateStr}
              className={`streaks-mini-dot ${dayCompleted ? 'dot-filled' : 'dot-missed'} ${
                day.isToday ? 'dot-today' : ''
              }`}
              style={{
                backgroundColor: dayCompleted ? streakTheme.color : 'transparent',
                borderColor: dayCompleted ? streakTheme.color : 'rgba(255, 107, 0, 0.28)',
                boxShadow: dayCompleted && day.isToday ? `0 0 8px ${streakTheme.color}` : 'none',
              }}
              title={`${day.displayDate}: ${dayCompleted ? 'Done' : 'Missed'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
