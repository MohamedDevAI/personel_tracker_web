import React, { useState } from 'react';
import { X, Wallet, Flame, Target, CheckSquare } from 'lucide-react';

export default function QuickAddModal({ isOpen, onClose, onAddExpense, onAddHabit, onAddGoal, onAddTask }) {
  const [tab, setTab] = useState('expense');

  // Form states
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expType, setExpType] = useState('EXPENSE');

  const [habitTitle, setHabitTitle] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');

  if (!isOpen) return null;

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    onAddExpense({
      title: expTitle,
      amount: parseFloat(expAmount),
      type: expType,
      category: 'General',
      date: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  const handleHabitSubmit = (e) => {
    e.preventDefault();
    if (!habitTitle) return;
    onAddHabit({
      title: habitTitle,
      category: 'Productivity',
      targetFrequency: 'Daily'
    });
    onClose();
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!goalTitle) return;
    onAddGoal({
      title: goalTitle,
      category: 'Personal',
      progress: 0,
      targetDate: ''
    });
    onClose();
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle) return;
    onAddTask({
      title: taskTitle,
      priority: taskPriority,
      category: 'General',
      dueDate: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '24px', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Quick Log</h3>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Quick Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '20px' }}>
          {[
            { id: 'expense', label: 'Cash', icon: Wallet },
            { id: 'habit', label: 'Habit', icon: Flame },
            { id: 'goal', label: 'Goal', icon: Target },
            { id: 'task', label: 'Task', icon: CheckSquare }
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 4px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: active ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.02)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form per tab */}
        {tab === 'expense' && (
          <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Expense title (e.g. Flight ticket)"
              value={expTitle}
              onChange={e => setExpTitle(e.target.value)}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                step="0.01"
                placeholder="Amount ($)"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                required
              />
              <select value={expType} onChange={e => setExpType(e.target.value)}>
                <option value="EXPENSE">Expense (-)</option>
                <option value="INCOME">Income (+)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
              Log Cash Flow
            </button>
          </form>
        )}

        {tab === 'habit' && (
          <form onSubmit={handleHabitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Habit name (e.g. 20min Meditation)"
              value={habitTitle}
              onChange={e => setHabitTitle(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
              Create Habit
            </button>
          </form>
        )}

        {tab === 'goal' && (
          <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Goal title (e.g. Launch Portfolio v2)"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
              Establish Goal
            </button>
          </form>
        )}

        {tab === 'task' && (
          <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Task name"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              required
            />
            <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>
              Add Task
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
