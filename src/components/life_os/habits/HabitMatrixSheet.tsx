import { useMemo } from 'react';
import { Flame, CheckCircle2, Circle, Sparkles, Trash2, CheckCheck, Check, Minus } from 'lucide-react';
import type { Habit } from '../../../types';
import {
  getRolling7Days,
  getHabit7DayStatuses,
  calculateConsistency,
  getCategoryBadgeClass,
  getStreakTier,
} from './habitHelpers';

interface HabitMatrixSheetProps {
  habits: Habit[];
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
  onBulkCheckIn?: () => void;
}

export default function HabitMatrixSheet({
  habits,
  onToggle,
  onDelete,
  onBulkCheckIn,
}: HabitMatrixSheetProps) {
  const rollingDays = useMemo(() => getRolling7Days(), []);

  const pendingCount = habits.filter((h) => !h.completedToday).length;

  // Compute daily completion summary across all habits for the footer row
  const daySummaries = useMemo(() => {
    if (habits.length === 0) return [];
    return rollingDays.map((_, dayIdx) => {
      let completedInDay = 0;
      habits.forEach((h) => {
        const statuses = getHabit7DayStatuses(h.history, h.completedToday);
        if (statuses[dayIdx] === 1) completedInDay++;
      });
      const pct = Math.round((completedInDay / habits.length) * 100);
      return { completed: completedInDay, total: habits.length, pct };
    });
  }, [habits, rollingDays]);

  return (
    <div className="glass-panel habit-matrix-sheet-card">
      {/* Matrix Header */}
      <div className="habit-matrix-sheet-header">
        <div>
          <div className="habit-matrix-title-badge-row">
            <h3 className="habit-matrix-title">Daily Habit Matrix Sheet</h3>
            <span className="habit-matrix-live-badge">
              <span className="live-dot" /> 7-Day Rolling View
            </span>
          </div>
          <p className="habit-matrix-subtitle">
            Bullet-journal grid. Tap any cell under <strong>Today</strong> or use the Check In button to record habits.
          </p>
        </div>

        {onBulkCheckIn && pendingCount > 0 && (
          <button onClick={onBulkCheckIn} className="btn btn-secondary habit-bulk-btn">
            <CheckCheck size={16} color="#34d399" /> Check Off All ({pendingCount} Pending)
          </button>
        )}
      </div>

      {/* Sheet Table */}
      <div className="habit-matrix-table-wrap">
        <table className="habit-matrix-table">
          <thead>
            <tr>
              <th className="th-habit-name">Habit Routine</th>
              <th className="th-streak">Streak Rank</th>
              {rollingDays.map((day) => (
                <th
                  key={day.dateStr}
                  className={`th-day-col ${day.isToday ? 'is-today-col-th' : ''}`}
                >
                  <div className="th-day-cell">
                    <span className="th-day-name">{day.dayName}</span>
                    <span className="th-day-num">{day.dayNumber}</span>
                    {day.isToday && <span className="today-badge-pill">TODAY</span>}
                  </div>
                </th>
              ))}
              <th className="th-consistency">7-Day Score</th>
              <th className="th-today-check">Today</th>
              <th className="th-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const statuses = getHabit7DayStatuses(habit.history, habit.completedToday);
              const consistency = calculateConsistency(statuses);
              const tier = getStreakTier(habit.streak);

              return (
                <tr key={habit.id} className={habit.completedToday ? 'row-done' : ''}>
                  {/* Habit Title & Category */}
                  <td className="td-habit-info">
                    <div className="habit-matrix-cell-title">
                      <span className={`habit-matrix-title-text ${habit.completedToday ? 'text-done' : ''}`}>
                        {habit.title}
                      </span>
                      <span className={`habit-cat-badge ${getCategoryBadgeClass(habit.category)}`}>
                        {habit.category || 'General'}
                      </span>
                    </div>
                    <div className="habit-matrix-cell-sub">
                      Target: <span className="freq-highlight">{habit.targetFrequency}</span>
                    </div>
                  </td>

                  {/* Gamified Streak Badge */}
                  <td>
                    <div
                      className={`habit-streak-badge ${tier.badgeClass}`}
                      title={`${tier.name}: ${tier.motto}`}
                    >
                      <span className="matrix-streak-emoji">{tier.emoji}</span>
                      <Flame
                        size={15}
                        fill={habit.streak >= 3 ? tier.color : 'none'}
                        color={tier.color}
                        className={habit.streak >= 7 ? 'streak-fire-anim' : ''}
                      />
                      <span className="habit-streak-num">{habit.streak}</span>
                      <span className="habit-streak-days">d</span>
                    </div>
                  </td>

                  {/* 7 Individual Day Columns */}
                  {rollingDays.map((day, idx) => {
                    const isDone = statuses[idx] === 1;

                    if (day.isToday) {
                      // Interactive Today Cell
                      return (
                        <td key={day.dateStr} className="td-day-col is-today-col-td">
                          <button
                            type="button"
                            onClick={() => onToggle(habit.id, habit.completedToday)}
                            className={`matrix-today-cell-btn ${habit.completedToday ? 'checked' : 'empty'}`}
                            title={`Today (${day.displayDate}): Click to ${habit.completedToday ? 'mark incomplete' : 'check off'}`}
                          >
                            {habit.completedToday ? (
                              <Check size={18} strokeWidth={3} className="matrix-check-icon" />
                            ) : (
                              <span className="matrix-empty-ring" />
                            )}
                          </button>
                        </td>
                      );
                    }

                    // Historical Past Days
                    return (
                      <td key={day.dateStr} className="td-day-col">
                        <div
                          className={`matrix-history-cell ${isDone ? 'done' : 'missed'}`}
                          title={`${day.displayDate} (${day.dayName}): ${isDone ? 'Completed' : 'Not Done'}`}
                        >
                          {isDone ? (
                            <Check size={13} strokeWidth={2.5} />
                          ) : (
                            <Minus size={11} className="matrix-miss-dash" />
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* 7-Day Consistency Score */}
                  <td>
                    <div className="habit-matrix-score-cell">
                      <div className="habit-matrix-score-top">
                        <span
                          className={`habit-matrix-pct-text ${
                            consistency >= 80 ? 'high' : consistency >= 50 ? 'med' : 'low'
                          }`}
                        >
                          {consistency}%
                        </span>
                        <span className="habit-matrix-score-count">
                          {statuses.filter((s) => s === 1).length}/7d
                        </span>
                      </div>
                      <div className="habit-matrix-mini-track">
                        <div
                          className={`habit-matrix-mini-fill ${
                            consistency >= 80 ? 'high' : consistency >= 50 ? 'med' : 'low'
                          }`}
                          style={{ width: `${consistency}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Check In Action Button */}
                  <td>
                    <button
                      onClick={() => onToggle(habit.id, habit.completedToday)}
                      className={`habit-matrix-check-btn ${habit.completedToday ? 'done' : 'pending'}`}
                    >
                      {habit.completedToday ? (
                        <>
                          <CheckCircle2 size={16} color="#10b981" /> Done
                        </>
                      ) : (
                        <>
                          <Circle size={16} /> Check In
                        </>
                      )}
                    </button>
                  </td>

                  {/* Delete Action */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete(habit.id)}
                      className="habit-delete-btn"
                      title="Delete Routine"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Matrix Footer: Daily Velocity Summary Row */}
          {habits.length > 0 && (
            <tfoot>
              <tr className="habit-matrix-footer-row">
                <td colSpan={2} className="footer-label-cell">
                  <div className="footer-summary-title">
                    <Sparkles size={14} color="#6366f1" /> Daily Completion Velocity
                  </div>
                </td>
                {daySummaries.map((summary, idx) => (
                  <td
                    key={rollingDays[idx].dateStr}
                    className={`footer-day-summary ${rollingDays[idx].isToday ? 'is-today-footer' : ''}`}
                  >
                    <div className="footer-day-pct">{summary.pct}%</div>
                    <div className="footer-day-ratio">
                      {summary.completed}/{summary.total}
                    </div>
                  </td>
                ))}
                <td colSpan={3} className="footer-closing-cell">
                  <span className="footer-active-count">
                    {habits.filter((h) => h.completedToday).length} of {habits.length} habits done today
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
