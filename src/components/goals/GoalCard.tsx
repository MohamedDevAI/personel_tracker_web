import React from 'react';
import { Target, CheckCircle2, Clock, Calendar, Trash2, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Goal } from '../../types';

interface GoalCardProps {
  goal: Goal;
  onUpdateProgress: (id: string, newProgress: number) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onUpdateProgress, onDelete }: GoalCardProps) {
  const isAchieved = (goal.progress || 0) >= 100;

  const getCategoryClass = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('car')) return 'goal-cat-career';
    if (cat.includes('fin')) return 'goal-cat-financial';
    if (cat.includes('fit')) return 'goal-cat-fitness';
    if (cat.includes('per')) return 'goal-cat-personal';
    if (cat.includes('learn')) return 'goal-cat-learning';
    return 'goal-cat-career';
  };

  // Calculate days remaining
  const getDeadlineText = () => {
    if (isAchieved) return { text: 'Achieved 🎉', isUrgent: false, isAchieved: true };
    if (!goal.targetDate) return { text: 'No Target Date', isUrgent: false, isAchieved: false };

    const target = new Date(goal.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d Overdue`, isUrgent: true, isAchieved: false };
    if (diffDays === 0) return { text: 'Due Today!', isUrgent: true, isAchieved: false };
    if (diffDays <= 14) return { text: `${diffDays} Days Left`, isUrgent: true, isAchieved: false };
    return { text: `${diffDays} Days Left`, isUrgent: false, isAchieved: false };
  };

  const deadlineInfo = getDeadlineText();

  const handleStep = (step: number) => {
    const nextVal = Math.min(100, Math.max(0, (goal.progress || 0) + step));
    onUpdateProgress(goal.id, nextVal);
    if (nextVal >= 100 && !isAchieved) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleComplete = () => {
    onUpdateProgress(goal.id, 100);
    if (!isAchieved) {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
    }
  };

  return (
    <div className={`glass-panel goal-card-container ${isAchieved ? 'achieved' : ''}`}>
      {/* Top Header */}
      <div>
        <div className="goal-card-header">
          <span className={`goal-cat-badge ${getCategoryClass(goal.category)}`}>
            {goal.category || 'General'}
          </span>

          <div
            className={`goal-date-badge ${
              deadlineInfo.isAchieved
                ? 'achieved'
                : deadlineInfo.isUrgent
                ? 'urgent'
                : ''
            }`}
          >
            {deadlineInfo.isAchieved ? (
              <CheckCircle2 size={13} color="#34d399" />
            ) : (
              <Clock size={13} />
            )}
            <span>{deadlineInfo.text}</span>
          </div>
        </div>

        <h3 className="goal-card-title">{goal.title}</h3>
      </div>

      {/* Progress Track Section */}
      <div className="goal-progress-section">
        <div className="goal-progress-meta">
          <span className="goal-progress-values">
            {goal.targetValue && goal.targetValue > 0 ? (
              <>
                Progress:{' '}
                <strong>
                  {goal.currentValue || Math.round((goal.progress / 100) * goal.targetValue)}{' '}
                  {goal.unit || '%'}
                </strong>{' '}
                / {goal.targetValue} {goal.unit || '%'}
              </>
            ) : (
              <>Strategic Target Metric</>
            )}
          </span>

          <span className={`goal-pct-number ${isAchieved ? 'complete' : ''}`}>
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

      {/* Action Stepper Footer */}
      <div className="goal-stepper-bar">
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={() => handleStep(-10)}
            className="goal-step-btn"
            title="Decrease 10%"
          >
            -10%
          </button>
          <button
            type="button"
            onClick={() => handleStep(5)}
            className="goal-step-btn"
            title="Increase 5%"
          >
            +5%
          </button>
          <button
            type="button"
            onClick={() => handleStep(10)}
            className="goal-step-btn"
            title="Increase 10%"
          >
            +10%
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isAchieved ? (
            <button
              type="button"
              onClick={handleComplete}
              className="goal-complete-btn"
            >
              <CheckCircle2 size={14} /> Complete
            </button>
          ) : (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Trophy size={14} /> Milestone Done!
            </span>
          )}

          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="goal-delete-btn"
            title="Delete goal milestone"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
