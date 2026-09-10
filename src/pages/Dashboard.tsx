import React from 'react';
import { ArrowUpRight, ArrowDownRight, Flame, CheckCircle2, Circle, TrendingUp, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Expense, Habit, Goal, TaskItem } from '../types';

interface DashboardProps {
  expenses: Expense[];
  habits: Habit[];
  goals: Goal[];
  tasks: TaskItem[];
  onToggleHabit: (id: string) => void;
  onToggleTask: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({
  expenses,
  habits,
  goals,
  tasks,
  onToggleHabit,
  onToggleTask,
  onNavigate
}: DashboardProps) {
  // Financial computations
  const totalIncome = expenses
    .filter(e => e.type === 'INCOME')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = expenses
    .filter(e => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

  // Habit metrics
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const habitsDoneToday = habits.filter(h => h.completedToday).length;

  // Goal metrics
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
    : 0;

  // Task metrics
  const completedTasks = tasks.filter(t => t.completed).length;

  const handleHabitCheck = (id: string, currentlyDone: boolean) => {
    onToggleHabit(id);
    if (!currentlyDone) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.75 } });
    }
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

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
            Welcome back! You are maintaining an active {maxStreak}-day streak and {savingsRate}% net savings rate.
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={() => onNavigate('habits')} className="btn btn-secondary">
            <Flame size={14} color="#f59e0b" /> Daily Habits
          </button>
          <button onClick={() => onNavigate('finances')} className="btn btn-secondary">
            <TrendingUp size={14} color="#10b981" /> Financial Ledger
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="dashboard-kpi-grid">
        {/* Net Cash Flow */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">NET CASH FLOW</span>
            <span className="badge badge-emerald">+{savingsRate}% Saved</span>
          </div>
          <div className="dashboard-kpi-value">
            ${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="dashboard-cashflow-row">
            <span className="dashboard-cashflow-in">
              <ArrowUpRight size={14} /> In: ${totalIncome.toLocaleString()}
            </span>
            <span className="dashboard-cashflow-out">
              <ArrowDownRight size={14} /> Out: ${totalExpense.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">HABIT MOMENTUM</span>
            <span className="badge badge-amber"><Flame size={12} fill="#f59e0b" /> Active</span>
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
            <div 
              className="dashboard-progress-bar"
              style={{ width: `${avgGoalProgress}%` }} 
            />
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">TODAY'S EXECUTION</span>
            <span className="badge badge-emerald">{completedTasks}/{tasks.length} Completed</span>
          </div>
          <div className="dashboard-kpi-value">
            {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
          </div>
          <div className="dashboard-kpi-subtext">
            {tasks.filter(t => !t.completed && t.priority === 'HIGH').length} high-priority tasks pending
          </div>
        </div>
      </div>

      {/* Main Grid: Habits & Cash Flow Breakdown */}
      <div className="dashboard-split-grid">
        
        {/* Today's Habits Checklist */}
        <div className="glass-panel dashboard-card-section">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Today's Habit Checklist</h3>
              <p className="dashboard-card-subtitle">Check off habits to compound your streak</p>
            </div>
            <button onClick={() => onNavigate('habits')} className="btn btn-secondary dashboard-btn-action">
              View All
            </button>
          </div>

          <div className="habits-list-vertical">
            {habits.slice(0, 4).map(habit => (
              <div
                key={habit.id}
                onClick={() => handleHabitCheck(habit.id, habit.completedToday)}
                className={`habit-row-item ${habit.completedToday ? 'done' : ''}`}
              >
                <div className="habit-info-group">
                  {habit.completedToday ? (
                    <CheckCircle2 size={20} color="#10b981" />
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
                  <Flame size={14} color={habit.streak > 5 ? '#f59e0b' : 'var(--text-muted)'} fill={habit.streak > 5 ? '#f59e0b' : 'none'} />
                  <span className={`habit-streak-count ${habit.streak > 5 ? 'active' : ''}`}>
                    {habit.streak}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Flow & Recent Ledger */}
        <div className="glass-panel dashboard-card-section">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Financial Cash Flow</h3>
              <p className="dashboard-card-subtitle">Recent transactions and inflows</p>
            </div>
            <button onClick={() => onNavigate('finances')} className="btn btn-secondary dashboard-btn-action">
              Ledger
            </button>
          </div>

          {/* Cashflow Visual Progress Ratio */}
          <div className="dashboard-cashflow-container">
            <div className="dashboard-burn-rate-header">
              <span>Monthly Burn Rate</span>
              <span>${totalExpense.toFixed(0)} of ${totalIncome.toFixed(0)}</span>
            </div>
            <div className="dashboard-burn-rate-track">
              <div 
                className="burn-rate-expense-bar"
                style={{
                  width: `${totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0}%`
                }} 
              />
              <div 
                className="burn-rate-savings-bar"
                style={{
                  width: `${totalIncome > 0 ? Math.max(0, 100 - (totalExpense / totalIncome) * 100) : 100}%`
                }} 
              />
            </div>
          </div>

          {/* Transaction items */}
          <div className="habits-list-vertical">
            {expenses.slice(0, 4).map(item => (
              <div key={item.id} className="dashboard-tx-item">
                <div>
                  <div className="dashboard-tx-title">{item.title}</div>
                  <div className="dashboard-tx-meta">{item.category} • {item.date}</div>
                </div>
                <div className={`dashboard-tx-amount ${item.type === 'INCOME' ? 'dashboard-tx-income' : 'dashboard-tx-expense'}`}>
                  {item.type === 'INCOME' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Strategic Goals & High Priority Tasks Row */}
      <div className="dashboard-split-grid">
        
        {/* Goals Progress */}
        <div className="glass-panel dashboard-card-section">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Strategic Milestones</h3>
              <p className="dashboard-card-subtitle">Quarterly and annual pursuits</p>
            </div>
            <button onClick={() => onNavigate('goals')} className="btn btn-secondary dashboard-btn-action">
              Manage
            </button>
          </div>

          <div className="dashboard-goals-list">
            {goals.slice(0, 3).map(goal => (
              <div key={goal.id}>
                <div className="dashboard-goal-row">
                  <span className="dashboard-goal-title">{goal.title}</span>
                  <span className="dashboard-goal-pct">{goal.progress}%</span>
                </div>
                <div className="dashboard-goal-track">
                  <div 
                    className="dashboard-progress-bar"
                    style={{ width: `${goal.progress}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Priority Tasks */}
        <div className="glass-panel dashboard-card-section">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">High Priority Action Items</h3>
              <p className="dashboard-card-subtitle">Key deliverables for today</p>
            </div>
            <button onClick={() => onNavigate('tasks')} className="btn btn-secondary dashboard-btn-action">
              Task Board
            </button>
          </div>

          <div className="habits-list-vertical">
            {tasks.filter(t => t.priority === 'HIGH').slice(0, 4).map(task => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`dashboard-task-item ${task.completed ? 'completed' : 'pending'}`}
              >
                <div className="dashboard-task-left">
                  {task.completed ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} color="#6366f1" />}
                  <span className={`dashboard-task-title ${task.completed ? 'completed' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <span className="badge badge-rose badge-priority-sm">HIGH</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
