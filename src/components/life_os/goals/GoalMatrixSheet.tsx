import { CheckCircle2, Clock, Trash2, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Goal } from '../../../types';

interface GoalMatrixSheetProps {
  goals: Goal[];
  onUpdateProgress: (id: string, newProgress: number) => void;
  onDelete: (id: string) => void;
  onEdit?: (goal: Goal) => void;
}

export default function GoalMatrixSheet({
  goals,
  onUpdateProgress,
  onDelete,
  onEdit,
}: GoalMatrixSheetProps) {
  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('car')) return 'goal-cat-career';
    if (cat.includes('fin')) return 'goal-cat-financial';
    if (cat.includes('fit')) return 'goal-cat-fitness';
    if (cat.includes('per')) return 'goal-cat-personal';
    if (cat.includes('learn')) return 'goal-cat-learning';
    return 'goal-cat-career';
  };

  return (
    <div className="glass-panel goal-matrix-card">
      <div className="goal-matrix-header">
        <div>
          <h3 className="goal-matrix-title">Strategic Milestone Matrix</h3>
          <p className="goal-matrix-subtitle">
            High-density spreadsheet layout for executive tracking and rapid progress updates.
          </p>
        </div>
      </div>

      <div className="goal-matrix-table-wrap">
        <table className="goal-matrix-table">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Milestone & Category</th>
              <th style={{ width: '15%' }}>Target Date</th>
              <th style={{ width: '25%' }}>Progress Track</th>
              <th style={{ width: '20%' }}>Quick Stepper</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const isAchieved = (goal.progress || 0) >= 100;

              return (
                <tr key={goal.id} className={isAchieved ? 'row-achieved' : ''}>
                  {/* Goal Name & Cat */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="goal-matrix-title-text" style={{ fontWeight: 700 }}>
                        {goal.title.replace(/\(\$([0-9,]+)/g, '(SAR $1')}
                      </span>
                      <span className={`goal-cat-badge ${getCategoryBadgeClass(goal.category)}`}>
                        {goal.category || 'General'}
                      </span>
                    </div>
                  </td>

                  {/* Target Date */}
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Clock size={14} color="var(--text-muted)" />
                      <span>{goal.targetDate || 'No Date'}</span>
                    </div>
                  </td>

                  {/* Progress Bar & Value */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          {goal.currentValue || Math.round((goal.progress / 100) * (goal.targetValue || 100))}{' '}
                          / {goal.targetValue || 100}{' '}
                          {(() => {
                            const rawUnit = goal.unit?.trim();
                            return (!rawUnit || rawUnit === '$' || rawUnit === 'USD')
                              ? 'SAR'
                              : rawUnit === 'INR'
                              ? '₹ INR'
                              : rawUnit;
                          })()}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isAchieved ? '#34d399' : '#a5b4fc',
                          }}
                        >
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="goal-bar-track">
                        <div
                          className={`goal-bar-fill ${isAchieved ? 'complete' : ''}`}
                          style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Quick Stepper */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => onUpdateProgress(goal.id, Math.max(0, goal.progress - 10))}
                        className="goal-step-btn"
                        title="-10%"
                      >
                        -10%
                      </button>
                      <button
                        onClick={() => {
                          const nextVal = Math.min(100, goal.progress + 10);
                          onUpdateProgress(goal.id, nextVal);
                          if (nextVal >= 100 && !isAchieved) {
                            confetti({ particleCount: 80, spread: 80 });
                          }
                        }}
                        className="goal-step-btn"
                        title="+10%"
                      >
                        +10%
                      </button>
                      {!isAchieved && (
                        <button
                          onClick={() => {
                            onUpdateProgress(goal.id, 100);
                            confetti({ particleCount: 100, spread: 100 });
                          }}
                          className="goal-complete-btn"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <CheckCircle2 size={13} /> 100%
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(goal)}
                          className="goal-edit-btn"
                          title="Edit Goal Milestone"
                          aria-label="Edit Goal"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(goal.id)}
                        className="goal-delete-btn"
                        title="Delete Goal"
                        aria-label="Delete Goal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
