import React from 'react';
import { Flame, CheckCircle2, Circle, Sparkles, Trash2, CheckCheck } from 'lucide-react';
import { DAY_NAMES } from '../../utils/constants';
import type { Habit } from '../../types';

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
  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('health')) return 'habit-cat-health';
    if (cat.includes('fit')) return 'habit-cat-fitness';
    if (cat.includes('mind')) return 'habit-cat-mindset';
    if (cat.includes('prod')) return 'habit-cat-productivity';
    if (cat.includes('learn')) return 'habit-cat-learning';
    return 'habit-cat-productivity';
  };

  const pendingCount = habits.filter((h) => !h.completedToday).length;

  return (
    <div className="glass-panel habit-matrix-sheet-card">
      {/* Matrix Header */}
      <div className="habit-matrix-sheet-header">
        <div>
          <h3 className="habit-matrix-title">Habit Routine Tracker Sheet</h3>
          <p className="habit-matrix-subtitle">
            High-density bullet-journal matrix for seamless 1-click check-ins across all routines.
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
              <th style={{ width: '28%' }}>Habit & Category</th>
              <th style={{ width: '15%' }}>Streak</th>
              <th style={{ width: '22%' }}>Check In Today</th>
              <th style={{ width: '25%', textAlign: 'center' }}>7-Day Breakdown</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const completedCount = habit.history.filter((x) => x === 1).length;
              const consistency = Math.round(
                (completedCount / (habit.history.length || 1)) * 100
              );
              const isHotStreak = habit.streak >= 5;

              return (
                <tr key={habit.id} className={habit.completedToday ? 'row-done' : ''}>
                  {/* Habit Title & Cat */}
                  <td>
                    <div className="habit-matrix-cell-title">
                      <span className="habit-matrix-title-text">{habit.title}</span>
                      <span className={`habit-cat-badge ${getCategoryBadgeClass(habit.category)}`}>
                        {habit.category || 'General'}
                      </span>
                    </div>
                    <div className="habit-matrix-cell-sub">Freq: {habit.targetFrequency}</div>
                  </td>

                  {/* Streak */}
                  <td>
                    <div className={`habit-streak-badge ${isHotStreak ? 'fire' : ''}`}>
                      <Flame size={16} fill={isHotStreak ? '#f59e0b' : 'none'} color="#f59e0b" />
                      <span className="habit-streak-num">{habit.streak}</span>
                      <span className="habit-streak-days">days</span>
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
                          <CheckCircle2 size={17} color="#10b981" /> Completed
                        </>
                      ) : (
                        <>
                          <Circle size={17} /> Check In
                        </>
                      )}
                    </button>
                  </td>

                  {/* 7-Day History Strip */}
                  <td>
                    <div className="habit-matrix-days-strip">
                      {habit.history.map((val, idx) => (
                        <div
                          key={idx}
                          className={`habit-matrix-day-box ${val === 1 ? 'done' : 'missed'}`}
                          title={`${DAY_NAMES[idx]}: ${val === 1 ? 'Completed' : 'Missed'}`}
                        >
                          <span className="matrix-day-letter">{DAY_NAMES[idx].slice(0, 2)}</span>
                          {val === 1 && <Sparkles size={10} color="#ffffff" />}
                        </div>
                      ))}
                      <span className="habit-matrix-pct-tag">{consistency}%</span>
                    </div>
                  </td>

                  {/* Delete Action */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete(habit.id)}
                      className="habit-delete-btn"
                      title="Delete Habit"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
