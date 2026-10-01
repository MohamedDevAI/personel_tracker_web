import { Award, CheckCheck, Flame, Plus, Sparkles } from 'lucide-react';
import type { Habit } from '../../../types';
import StreaksHabitRing from './StreaksHabitRing';

interface StreaksRingViewProps {
  habits: Habit[];
  onToggle: (id: string, currentlyDone: boolean) => void;
  onDelete: (id: string) => void;
  onBulkCheckIn?: () => void;
  onOpenAddModal: () => void;
}

export default function StreaksRingView({
  habits,
  onToggle,
  onDelete,
  onBulkCheckIn,
  onOpenAddModal,
}: StreaksRingViewProps) {
  const total = habits.length;
  const completed = habits.filter((h) => h.completedToday).length;
  const pending = total - completed;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isAllDone = total > 0 && pending === 0;

  // Best streak
  const bestStreak = habits.length > 0
    ? habits.reduce((max, h) => (h.streak > max.streak ? h : max), habits[0])
    : null;

  // Master circular ring SVG metrics
  const masterRadius = 40;
  const masterCircumference = 2 * Math.PI * masterRadius; // ~251.32
  const masterOffset = masterCircumference - (pct / 100) * masterCircumference;

  return (
    <div className={`streaks-iphone-container ${isAllDone ? 'iphone-victory' : ''}`}>
      {/* ─── Apple Watch Style Master Ring Hero Card ───────── */}
      <div className="streaks-master-hero-card">
        <div className="streaks-master-hero-content">
          {/* Master Circular Activity Ring */}
          <div className="streaks-master-ring-wrap">
            <svg className="streaks-master-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={masterRadius} className="streaks-master-track" />
              <circle
                cx="50"
                cy="50"
                r={masterRadius}
                className="streaks-master-fill"
                style={{
                  strokeDasharray: masterCircumference,
                  strokeDashoffset: masterOffset,
                }}
              />
            </svg>
            <div className="streaks-master-ring-center">
              <span className="streaks-master-pct">{pct}%</span>
              <span className="streaks-master-label">CLOSED</span>
            </div>
          </div>

          {/* Headline & Meta */}
          <div className="streaks-master-info">
            <span className="streaks-date-badge">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              }).toUpperCase()}
            </span>
            <h2 className="streaks-master-title">
              {isAllDone ? 'ALL RINGS CLOSED TODAY!' : `${completed} of ${total} RINGS CLOSED`}
            </h2>
            <p className="streaks-master-sub">
              {isAllDone ? (
                <span className="text-fire">
                  <Sparkles size={14} /> Flawless day! You defended every single streak.
                </span>
              ) : (
                `Tap any ring below to check it off. ${pending} ritual${pending === 1 ? '' : 's'} remaining.`
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="streaks-master-actions">
          {onBulkCheckIn && pending > 0 && (
            <button
              onClick={onBulkCheckIn}
              className="streaks-btn-orange-outline"
              title="Close all pending rings today"
            >
              <CheckCheck size={16} /> Close All ({pending})
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="streaks-btn-orange-solid"
            title="Create a new streak habit"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Habit
          </button>
        </div>
      </div>

      {/* Streaks Champion Highlight Bar if active */}
      {bestStreak && bestStreak.streak > 0 && (
        <div className="streaks-champion-ticker">
          <Flame size={18} color="#ff5500" fill="#ff5500" className="streak-fire-anim" />
          <span className="streaks-ticker-text">
            Longest active streak: <strong>{bestStreak.title}</strong> — {bestStreak.streak} days unbroken!
          </span>
        </div>
      )}

      {/* The Iconic Streaks Rings Canvas */}
      {habits.length > 0 ? (
        <div className="streaks-rings-canvas">
          {habits.map((habit, idx) => (
            <StreaksHabitRing
              key={habit.id}
              habit={habit}
              index={idx}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="streaks-empty-slate">
          <div className="streaks-empty-ring-placeholder">
            <Plus size={40} color="#ff5500" />
          </div>
          <h3 className="streaks-empty-title">Build Your First Daily Streak</h3>
          <p className="streaks-empty-sub">
            The secret to lasting habits is building an unbroken chain. Tap below to create your first daily ring.
          </p>
          <button onClick={onOpenAddModal} className="streaks-btn-orange-solid" style={{ marginTop: 12 }}>
            <Plus size={16} /> Add Your First Streak
          </button>
        </div>
      )}

      {/* Victory Footer Banner when 100% done */}
      {isAllDone && (
        <div className="streaks-victory-card">
          <Award size={32} color="#ff5500" className="all-done-trophy" />
          <div>
            <h4 className="streaks-victory-title">Mastery Level Discipline!</h4>
            <p className="streaks-victory-sub">100% of today's rings are closed. Rest up, champion.</p>
          </div>
        </div>
      )}
    </div>
  );
}
