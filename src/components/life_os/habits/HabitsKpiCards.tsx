import { Flame, CheckCircle2, TrendingUp, Sparkles, Activity } from 'lucide-react';
import type { Habit } from '../../../types';
import { getHabit7DayStatuses, calculateConsistency, getStreakTier } from './habitHelpers';

interface HabitsKpiCardsProps {
  habits: Habit[];
}

export default function HabitsKpiCards({ habits }: HabitsKpiCardsProps) {
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) => h.completedToday).length;
  const completionRate = totalHabits > 0
    ? Math.round((completedTodayCount / totalHabits) * 100)
    : 0;

  // Streak leader
  const streakLeader = habits.length > 0
    ? habits.reduce((max, h) => (h.streak > max.streak ? h : max), habits[0])
    : null;

  const leaderTier = streakLeader ? getStreakTier(streakLeader.streak) : null;

  // Overall average consistency across 7-day rolling window
  const avgConsistency = habits.length > 0
    ? Math.round(
        habits.reduce((sum, h) => {
          const statuses = getHabit7DayStatuses(h.history, h.completedToday);
          return sum + calculateConsistency(statuses);
        }, 0) / habits.length
      )
    : 0;

  const pendingCount = totalHabits - completedTodayCount;

  return (
    <div className="habits-kpi-grid">
      {/* Card 1: Today's Progress */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Today's Execution</span>
          <span className={`badge ${completionRate === 100 && totalHabits > 0 ? 'badge-emerald' : 'badge-indigo'}`}>
            <CheckCircle2 size={12} /> {completedTodayCount}/{totalHabits} Done
          </span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{completionRate}%</span>
          <span className="habits-kpi-unit">Target</span>
        </div>
        <div>
          <div className="habits-progress-track">
            <div
              className={`habits-progress-bar ${completionRate === 100 ? 'bar-gold' : ''}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="habits-kpi-subtext" style={{ marginTop: 8 }}>
            {pendingCount === 0 && totalHabits > 0
              ? '🎉 All routines complete for today!'
              : `${pendingCount} routine${pendingCount === 1 ? '' : 's'} pending for today`}
          </div>
        </div>
      </div>

      {/* Card 2: Streak Leader */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Streak Champion</span>
          <span className={`badge ${leaderTier ? leaderTier.badgeClass : 'badge-amber'}`}>
            <Flame size={13} fill="#f59e0b" color="#f59e0b" style={{ marginRight: 4 }} />
            {leaderTier?.name || 'Best Streak'}
          </span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{streakLeader ? streakLeader.streak : 0}</span>
          <span className="habits-kpi-unit">Days</span>
        </div>
        <div className="habits-kpi-subtext streak-champion-sub">
          {streakLeader && streakLeader.streak > 0 ? (
            <>
              <span className="streak-champion-name">{streakLeader.title}</span> ({leaderTier?.motto})
            </>
          ) : (
            'Build your first 3-day consistency streak'
          )}
        </div>
      </div>

      {/* Card 3: 7-Day Consistency Index */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Weekly Consistency</span>
          <span className={`badge ${avgConsistency >= 80 ? 'badge-emerald' : avgConsistency >= 50 ? 'badge-cyan' : 'badge-amber'}`}>
            <TrendingUp size={12} /> {avgConsistency >= 80 ? 'Exceptional' : avgConsistency >= 50 ? 'Steady' : 'Building'}
          </span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{avgConsistency}%</span>
          <span className="habits-kpi-unit">7-Day Index</span>
        </div>
        <div className="habits-kpi-subtext">
          Average check-in rate across all routines over the past 7 days
        </div>
      </div>

      {/* Card 4: Active Habit Routines */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Total Routines</span>
          <span className="badge badge-indigo">
            <Activity size={12} /> {totalHabits} Active
          </span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{totalHabits}</span>
          <span className="habits-kpi-unit">Habits</span>
        </div>
        <div className="habits-kpi-subtext">
          {totalHabits > 0 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="#818cf8" /> High-frequency personal discipline system
            </span>
          ) : (
            'Create your first routine to activate tracking'
          )}
        </div>
      </div>
    </div>
  );
}
