import React, { useState } from 'react';
import { X, Wallet, Flame, Target, CheckSquare, LucideIcon } from 'lucide-react';
import { Expense, Habit, Goal, TaskItem, ExpenseType, TaskPriority } from '../types';
import './QuickAddModal.css';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onAddHabit: (habit: Pick<Habit, 'title' | 'category' | 'targetFrequency'>) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed'>) => void;
}

type TabType = 'expense' | 'habit' | 'goal' | 'task';

interface TabConfig {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

export default function QuickAddModal({
  isOpen,
  onClose,
  onAddExpense,
  onAddHabit,
  onAddGoal,
  onAddTask
}: QuickAddModalProps) {
  const [tab, setTab] = useState<TabType>('expense');

  // Form states
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expType, setExpType] = useState<ExpenseType>('EXPENSE');

  const [habitTitle, setHabitTitle] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('HIGH');

  if (!isOpen) return null;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    onAddExpense({
      title: expTitle,
      amount: parseFloat(expAmount),
      type: expType,
      category: 'General',
      date: new Date().toISOString().split('T')[0]
    });
    setExpTitle('');
    setExpAmount('');
    onClose();
  };

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle) return;
    onAddHabit({
      title: habitTitle,
      category: 'Productivity',
      targetFrequency: 'Daily'
    });
    setHabitTitle('');
    onClose();
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle) return;
    onAddGoal({
      title: goalTitle,
      category: 'Personal',
      progress: 0,
      targetDate: ''
    });
    setGoalTitle('');
    onClose();
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    onAddTask({
      title: taskTitle,
      priority: taskPriority,
      category: 'General',
      dueDate: new Date().toISOString().split('T')[0]
    });
    setTaskTitle('');
    onClose();
  };

  const tabs: TabConfig[] = [
    { id: 'expense', label: 'Cash', icon: Wallet },
    { id: 'habit', label: 'Habit', icon: Flame },
    { id: 'goal', label: 'Goal', icon: Target },
    { id: 'task', label: 'Task', icon: CheckSquare }
  ];

  return (
    <div className="quickadd-overlay">
      <div className="glass-panel quickadd-card">
        <div className="quickadd-header">
          <h3 className="quickadd-title">Quick Log</h3>
          <button onClick={onClose} className="btn-icon quickadd-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="quickadd-tabs">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`quickadd-tab-btn ${active ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form per tab */}
        {tab === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="quickadd-form">
            <input
              type="text"
              placeholder="Expense title (e.g. Flight ticket)"
              value={expTitle}
              onChange={e => setExpTitle(e.target.value)}
              required
            />
            <div className="quickadd-grid-2">
              <input
                type="number"
                step="0.01"
                placeholder="Amount ($)"
                value={expAmount}
                onChange={e => setExpAmount(e.target.value)}
                required
              />
              <select value={expType} onChange={e => setExpType(e.target.value as ExpenseType)}>
                <option value="EXPENSE">Expense (-)</option>
                <option value="INCOME">Income (+)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary quickadd-submit-btn">
              Log Cash Flow
            </button>
          </form>
        )}

        {tab === 'habit' && (
          <form onSubmit={handleHabitSubmit} className="quickadd-form">
            <input
              type="text"
              placeholder="Habit name (e.g. 20min Meditation)"
              value={habitTitle}
              onChange={e => setHabitTitle(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary quickadd-submit-btn">
              Create Habit
            </button>
          </form>
        )}

        {tab === 'goal' && (
          <form onSubmit={handleGoalSubmit} className="quickadd-form">
            <input
              type="text"
              placeholder="Goal title (e.g. Launch Portfolio v2)"
              value={goalTitle}
              onChange={e => setGoalTitle(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary quickadd-submit-btn">
              Establish Goal
            </button>
          </form>
        )}

        {tab === 'task' && (
          <form onSubmit={handleTaskSubmit} className="quickadd-form">
            <input
              type="text"
              placeholder="Task name"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              required
            />
            <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)}>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
            <button type="submit" className="btn btn-primary quickadd-submit-btn">
              Add Task
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
