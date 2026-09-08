import React from 'react';
import { ArrowUpRight, ArrowDownRight, Flame, Target, CheckCircle2, Circle, TrendingUp, Sparkles, Plus, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dashboard({ expenses, habits, goals, tasks, onToggleHabit, onToggleTask, onNavigate }) {
  // Financial computations
  const totalIncome = expenses
    .filter(e => e.type === 'INCOME')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = expenses
    .filter(e => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

  // Habit metrics
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const habitsDoneToday = habits.filter(h => h.completedToday).length;

  // Goal metrics
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
    : 0;

  // Task metrics
  const completedTasks = tasks.filter(t => t.completed).length;

  const handleHabitCheck = (id, currentlyDone) => {
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
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
            <Calendar size={14} />
            <span>{todayDate}</span>
          </div>
          <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>
            Executive <span className="gradient-text">Overview</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Welcome back! You are maintaining an active {maxStreak}-day streak and {savingsRate}% net savings rate.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate('habits')} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
            <Flame size={14} color="#f59e0b" /> Daily Habits
          </button>
          <button onClick={() => onNavigate('finances')} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
            <TrendingUp size={14} color="#10b981" /> Financial Ledger
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {/* Net Cash Flow */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NET CASH FLOW</span>
            <span className="badge badge-emerald">+{savingsRate}% Saved</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            ${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
              <ArrowUpRight size={14} /> In: ${totalIncome.toLocaleString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e' }}>
              <ArrowDownRight size={14} /> Out: ${totalExpense.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>HABIT MOMENTUM</span>
            <span className="badge badge-amber"><Flame size={12} fill="#f59e0b" /> Active</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            {maxStreak} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Days Streak</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {habitsDoneToday} of {habits.length} habits completed for today
          </div>
        </div>

        {/* Strategic Goals Progress */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>STRATEGIC MILESTONES</span>
            <span className="badge badge-indigo">{goals.length} Active</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            {avgGoalProgress}% <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Achieved</span>
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '8px'
          }}>
            <div style={{
              width: `${avgGoalProgress}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              borderRadius: '999px'
            }} />
          </div>
        </div>

        {/* Daily Tasks */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TODAY'S EXECUTION</span>
            <span className="badge badge-emerald">{completedTasks}/{tasks.length} Completed</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {tasks.filter(t => !t.completed && t.priority === 'HIGH').length} high-priority tasks pending
          </div>
        </div>
      </div>

      {/* Main Grid: Habits & Cash Flow Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Today's Habits Checklist */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Today's Habit Checklist</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Check off habits to compound your streak</p>
            </div>
            <button onClick={() => onNavigate('habits')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {habits.slice(0, 4).map(habit => (
              <div
                key={habit.id}
                onClick={() => handleHabitCheck(habit.id, habit.completedToday)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: habit.completedToday ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: habit.completedToday ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {habit.completedToday ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : (
                    <Circle size={20} color="var(--text-muted)" />
                  )}
                  <div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textDecoration: habit.completedToday ? 'line-through' : 'none',
                      color: habit.completedToday ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>
                      {habit.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {habit.category} • {habit.targetFrequency}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={14} color={habit.streak > 5 ? '#f59e0b' : 'var(--text-muted)'} fill={habit.streak > 5 ? '#f59e0b' : 'none'} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: habit.streak > 5 ? '#fbbf24' : 'var(--text-secondary)' }}>
                    {habit.streak}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Flow & Recent Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Financial Cash Flow</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Recent transactions and inflows</p>
            </div>
            <button onClick={() => onNavigate('finances')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Ledger
            </button>
          </div>

          {/* Cashflow Visual Progress Ratio */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Monthly Burn Rate</span>
              <span>${totalExpense.toFixed(0)} of ${totalIncome.toFixed(0)}</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0}%`,
                background: 'var(--rose-gradient)',
                height: '100%'
              }} />
              <div style={{
                width: `${totalIncome > 0 ? Math.max(0, 100 - (totalExpense / totalIncome) * 100) : 100}%`,
                background: 'var(--emerald-gradient)',
                height: '100%'
              }} />
            </div>
          </div>

          {/* Transaction items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expenses.slice(0, 4).map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.category} • {item.date}</div>
                </div>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: item.type === 'INCOME' ? '#10b981' : '#f43f5e'
                }}>
                  {item.type === 'INCOME' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Strategic Goals & High Priority Tasks Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Goals Progress */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Strategic Milestones</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Quarterly and annual pursuits</p>
            </div>
            <button onClick={() => onNavigate('goals')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Manage
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {goals.slice(0, 3).map(goal => (
              <div key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{goal.title}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{goal.progress}%</span>
                </div>
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${goal.progress}%`,
                    height: '100%',
                    background: 'var(--accent-gradient)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Priority Tasks */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>High Priority Action Items</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Key deliverables for today</p>
            </div>
            <button onClick={() => onNavigate('tasks')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              Task Board
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.filter(t => t.priority === 'HIGH').slice(0, 4).map(task => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: task.completed ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {task.completed ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} color="#6366f1" />}
                  <span style={{
                    fontSize: '0.88rem',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}>
                    {task.title}
                  </span>
                </div>
                <span className="badge badge-rose" style={{ fontSize: '0.68rem' }}>HIGH</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
