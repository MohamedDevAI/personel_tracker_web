import React from 'react';
import { Flame, CheckCircle2, Trophy, TrendingUp } from 'lucide-react';
import type { Habit } from '../../types';

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

  // Overall average consistency across last 7 days history
  const avgConsistency = habits.length > 0
    ? Math.round(
        habits.reduce((sum, h) => {
          const done = h.history.filter((x) => x === 1).length;
          return sum + (done / (h.history.length || 1)) * 100;
        }, 0) / habits.length
      )
    : 0;

  return (
    <div className="habits-kpi-grid">
      {/* Card 1: Today's Completion */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Today's Progress</span>
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} /> {completedTodayCount}/{totalHabits} Done
          </span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{completionRate}%</span>
          <span className="habits-kpi-unit">Completed</span>
        </div>
        <div>
          <div className="habits-progress-track">
            <div
              className="habits-progress-bar"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="habits-kpi-subtext" style={{ marginTop: 6 }}>
            {totalHabits - completedTodayCount} routines pending for today
          </div>
        </div>
      </div>

      {/* Card 2: Streak Leader */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Streak Champion</span>
          <span className="badge badge-amber">
            <Flame size={12} fill="#f59e0b" /> Best
          </span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{streakLeader ? streakLeader.streak : 0}</span>
          <span className="habits-kpi-unit">Days Streak</span>
        </div>
        <div className="habits-kpi-subtext">
          {streakLeader ? streakLeader.title : 'No active streak'}
        </div>
      </div>

      {/* Card 3: Active Routines */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Total Routines</span>
          <span className="badge badge-indigo">Active</span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{totalHabits}</span>
          <span className="habits-kpi-unit">Habits</span>
        </div>
        <div className="habits-kpi-subtext">
          Tracked across daily & weekly schedules
        </div>
      </div>

      {/* Card 4: Average Consistency */}
      <div className="glass-panel habits-kpi-card">
        <div className="habits-kpi-top">
          <span className="habits-kpi-label">Weekly Consistency</span>
          <span className="badge badge-cyan">7-Day Index</span>
        </div>
        <div className="habits-kpi-value-row">
          <span className="habits-kpi-value">{avgConsistency}%</span>
          <span className="habits-kpi-unit">Avg Score</span>
        </div>
        <div className="habits-kpi-subtext">
          Overall check-in rate for the past 7 days
        </div>
      </div>
    </div>
  );
}
