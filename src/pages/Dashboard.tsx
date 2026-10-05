/**
 * Dashboard page — self-contained with react-query data fetching.
 * No props from parent; manages its own data lifecycle.
 */

import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame, CheckCircle2, Circle, Calendar, Target, Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { formatDateLong } from '../utils/formatters';
import { useHabitsQuery } from '../hooks/useHabitsQuery';
import { useGoalsQuery } from '../hooks/useGoalsQuery';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const { data: habits = [] } = useHabitsQuery();
  const { data: goals = [] } = useGoalsQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────

  const toggleHabitMutation = useMutation({
    mutationFn: api.toggleHabit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  // ── Computed Metrics ──────────────────────────────────────────────────────

  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;
  const habitsDoneToday = habits.filter((h) => h.completedToday).length;

  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
    : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleHabitCheck = (id: string, currentlyDone: boolean) => {
    toggleHabitMutation.mutate(id);
    if (!currentlyDone) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.75 } });
    }
  };

  const todayDate = formatDateLong(new Date());

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div className="page-header">
        <div>
          <div className="page-header-date">
            <Calendar size={14} />
            <span>{todayDate}</span>
          </div>
          <h1 className="page-header-title">
            Executive <span className="gradient-text">Overview</span>
          </h1>
          <p className="page-header-subtitle">
            Welcome back! You are maintaining an active {maxStreak}-day streak across your habit routines.
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={() => navigate('/life-os/habits')} className="btn btn-secondary">
            <Flame size={14} color="#cb6b08" /> Daily Habits
          </button>
          <button onClick={() => navigate('/life-os/goals')} className="btn btn-secondary">
            <Target size={14} color="#cb6b08" /> Strategic Goals
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="dashboard-kpi-grid">
        {/* Habit Momentum */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">HABIT MOMENTUM</span>
            <span className="badge badge-amber"><Flame size={12} fill="#eb7c0a" /> Active</span>
          </div>
          <div className="dashboard-kpi-value">
            {maxStreak} <span className="dashboard-kpi-unit">Days Streak</span>
          </div>
          <div className="dashboard-kpi-subtext">
            {habitsDoneToday} of {habits.length} habits completed for today
          </div>
        </div>

        {/* Strategic Goals Progress */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">STRATEGIC MILESTONES</span>
            <span className="badge badge-indigo">{goals.length} Active</span>
          </div>
          <div className="dashboard-kpi-value">
            {avgGoalProgress}% <span className="dashboard-kpi-unit">Achieved</span>
          </div>
          <div className="dashboard-progress-track">
            <div className="dashboard-progress-bar" style={{ width: `${avgGoalProgress}%` }} />
          </div>
        </div>

        {/* Habit Completion Ratio */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">DAILY COMPLETION</span>
            <span className="badge badge-emerald"><Sparkles size={12} /> Today</span>
          </div>
          <div className="dashboard-kpi-value">
            {habits.length > 0 ? Math.round((habitsDoneToday / habits.length) * 100) : 0}%
          </div>
          <div className="dashboard-kpi-subtext">
            {habitsDoneToday} done • {habits.length - habitsDoneToday} remaining
          </div>
        </div>
      </div>

      {/* Main Grid: Habits & Strategic Goals */}
      <div className="dashboard-split-grid">
        {/* Today's Habits Checklist */}
        <div className="glass-panel dashboard-card-section">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Today's Habit Checklist</h3>
              <p className="dashboard-card-subtitle">Check off habits to compound your streak</p>
            </div>
            <button onClick={() => navigate('/life-os/habits')} className="btn btn-secondary dashboard-btn-action">
              View All
            </button>
          </div>

          <div className="habits-list-vertical">
            {habits.slice(0, 5).map((habit) => (
              <div
                key={habit.id}
                onClick={() => handleHabitCheck(habit.id, habit.completedToday)}
                className={`habit-row-item ${habit.completedToday ? 'done' : ''}`}
              >
                <div className="habit-info-group">
                  {habit.completedToday ? (
                    <CheckCircle2 size={20} color="#b6550c" />
                  ) : (
                    <Circle size={20} color="var(--text-muted)" />
                  )}
                  <div>
                    <div className={`habit-title-text ${habit.completedToday ? 'done' : ''}`}>
                      {habit.title}
                    </div>
                    <div className="habit-meta-text">
                      {habit.category} • {habit.targetFrequency}
                    </div>
                  </div>
                </div>

                <div className="habit-streak-display">
                  <Flame size={14} color={habit.streak > 5 ? '#cb6b08' : 'var(--text-muted)'} fill={habit.streak > 5 ? '#eb7c0a' : 'none'} />
                  <span className={`habit-streak-count ${habit.streak > 5 ? 'active' : ''}`}>
                    {habit.streak}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Goals List */}
        <div className="glass-panel dashboard-card-section">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Active Goals</h3>
              <p className="dashboard-card-subtitle">Quarterly milestones & pursuits</p>
            </div>
            <button onClick={() => navigate('/life-os/goals')} className="btn btn-secondary dashboard-btn-action">
              View All
            </button>
          </div>

          <div className="dashboard-goals-list">
            {goals.slice(0, 5).map((goal) => (
              <div key={goal.id} style={{ marginBottom: 16 }}>
                <div className="dashboard-goal-row">
                  <span className="dashboard-goal-title">{goal.title}</span>
                  <span className="dashboard-goal-pct">{goal.progress}%</span>
                </div>
                <div className="dashboard-goal-track">
                  <div className="dashboard-progress-bar" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
