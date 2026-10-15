/**
 * Executive Dashboard — Tailored Single-Glance Control Center
 * Displays strictly:
 * 1. Financial Details: How much I Have in Hand, Total Credit, Expense Tracked, How Much did I Repay
 * 2. Today's Reminders
 * 3. Today's Tasks
 * 4. Habits Momentum
 * 5. Next Month Commitments
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  ArrowDownRight,
  RotateCcw,
  Flame,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  CheckSquare,
  Bell,
  Plus,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { notesRemindersService } from '../services/notesRemindersService';
import { borrowRepayApi } from '../services/borrowRepayApi';
import { formatDateLong } from '../utils/formatters';
import { MONTH_NAMES, getLocalDateISO, parseTxDate } from '../utils/dateHelpers';
import {
  useTransactionsQuery,
  useHabitsQuery,
  useTasksQuery,
  useRemindersQuery,
  usePlannedExpensesQuery,
  useBorrowRepayRecordsQuery,
  QUERY_KEYS,
} from '../hooks';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Financial Timeframe Toggle: Current Month vs Lifetime ────────────────
  const [timeframe, setTimeframe] = useState<'month' | 'all'>('month');

  // Inline quick task title state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // 60-second ticker to ensure reactive rollover across midnight and month boundaries
  const [currentDate, setCurrentDate] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = MONTH_NAMES[currentDate.getMonth()];
  const todayDateStr = getLocalDateISO(currentDate);

  // Compute next month dynamically (e.g., Oct -> Nov)
  const { nextMonth, nextMonthYear } = useMemo(() => {
    const curIdx = MONTH_NAMES.indexOf(currentMonth as any);
    const nextIdx = curIdx >= 0 ? (curIdx + 1) % 12 : 10;
    const nMonth = MONTH_NAMES[nextIdx];
    const nYear = currentMonth === 'Dec' ? currentYear + 1 : currentYear;
    return { nextMonth: nMonth, nextMonthYear: nYear };
  }, [currentMonth, currentYear]);

  // ── Live Data Queries ────────────────────────────────────────────────────
  const { data: transactions = [] } = useTransactionsQuery();
  const { data: habits = [] } = useHabitsQuery();
  const { data: tasks = [] } = useTasksQuery();
  const { data: reminders = [] } = useRemindersQuery();
  const { data: plannedExpenses = [] } = usePlannedExpensesQuery('ALL');
  const { data: borrowRecords = [] } = useBorrowRepayRecordsQuery();

  // ── Mutations ────────────────────────────────────────────────────────────

  // 1. Habit Toggle
  const toggleHabitMutation = useMutation({
    mutationFn: ({ id }: { id: string; wasDone: boolean }) => api.toggleHabit(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      if (!variables.wasDone) {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'],
        });
      }
    },
    onError: (err: any) => {
      console.error('Failed to toggle habit:', err);
      alert('Failed to update habit: ' + (err.message || 'Unknown error'));
    },
  });

  const handleHabitCheck = (id: string, currentlyDone: boolean) => {
    toggleHabitMutation.mutate({ id, wasDone: currentlyDone });
  };

  // 2. Task Toggle
  const toggleTaskMutation = useMutation({
    mutationFn: api.toggleTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS }),
    onError: (err: any) => {
      console.error('Failed to toggle task:', err);
      alert('Failed to update task: ' + (err.message || 'Unknown error'));
    },
  });

  // 3. Quick Create Task
  const createTaskMutation = useMutation({
    mutationFn: (title: string) =>
      api.createTask({
        title,
        category: 'General',
        priority: 'MEDIUM',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS });
      setQuickTaskTitle('');
    },
    onError: (err: any) => {
      console.error('Failed to create task:', err);
      alert('Failed to create task: ' + (err.message || 'Unknown error'));
    },
  });

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    createTaskMutation.mutate(quickTaskTitle.trim());
  };

  // 4. Reminder Toggle
  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      notesRemindersService.toggleReminder(id, isCompleted),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REMINDERS }),
    onError: (err: any) => {
      console.error('Failed to toggle reminder:', err);
      alert('Failed to update reminder: ' + (err.message || 'Unknown error'));
    },
  });

  // ── 1. Financial Details At A Glance ─────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    if (timeframe === 'all') return transactions;
    return transactions.filter((tx) => {
      const { year, month } = parseTxDate(tx);
      return (
        year === currentYear &&
        month.toLowerCase() === currentMonth.toLowerCase()
      );
    });
  }, [transactions, timeframe, currentYear, currentMonth]);

  const financialGlance = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    let creditPaybackDebit = 0;

    filteredTransactions.forEach((tx) => {
      const amt = Math.abs(Number(tx.amount || tx.amountSar || 0));
      const isCredit = String(tx.type).toUpperCase() === 'CREDIT';
      if (isCredit) {
        totalCredit += amt;
      } else {
        totalDebit += amt;
        const cat = (tx.category || tx.categoryName || '').toLowerCase();
        const desc = (tx.description || tx.note || '').toLowerCase();
        if (cat.includes('payback') || desc.includes('payback') || desc.includes('installment')) {
          creditPaybackDebit += amt;
        }
      }
    });

    const cashInHand = totalCredit - totalDebit;

    // Debt repayment from borrow/repay records
    const creditorSummaries = borrowRepayApi.getCreditorSummaries(borrowRecords);
    const totalDebtRepaid = borrowRecords
      .filter((r) => r.type === 'Repaid')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return {
      totalCredit,
      totalDebit,
      cashInHand,
      creditPaybackDebit,
      totalDebtRepaid,
      creditorCount: creditorSummaries.length,
      txCount: filteredTransactions.length,
    };
  }, [filteredTransactions, borrowRecords]);

  // ── 2. Today's Reminders ─────────────────────────────────────────────────
  const todaysReminders = useMemo(() => {
    // Show active reminders due today or overdue, and reminders completed today
    return reminders
      .filter((r) => {
        if (!r.dueDate) return false;
        if (!r.isCompleted && r.dueDate <= todayDateStr) return true;
        if (r.isCompleted && (r.dueDate === todayDateStr || (r.completedAt && r.completedAt.startsWith(todayDateStr)))) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const dateA = a.dueDate || '';
        const dateB = b.dueDate || '';
        return dateA.localeCompare(dateB);
      });
  }, [reminders, todayDateStr]);

  // ── 3. Today's Tasks ─────────────────────────────────────────────────────
  const todaysTasks = useMemo(() => {
    // Show tasks pending, or completed today
    return tasks
      .filter((t) => {
        if (!t.completed) return true;
        if (t.dueDate === todayDateStr) return true;
        return false;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [tasks, todayDateStr]);

  // ── 4. Habits Momentum (Later We change) ──────────────────────────────────
  const habitsTotal = habits.length;
  const habitsDoneToday = habits.filter((h) => h.completedToday).length;
  const habitsCompletionPct =
    habitsTotal > 0 ? Math.round((habitsDoneToday / habitsTotal) * 100) : 0;
  const maxStreak =
    habitsTotal > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;

  // ── 5. Next Month Commitments ────────────────────────────────────────────
  const nextMonthCommitments = useMemo(() => {
    return plannedExpenses.filter(
      (p) =>
        p.month.toLowerCase() === nextMonth.toLowerCase() &&
        p.year === nextMonthYear
    );
  }, [plannedExpenses, nextMonth, nextMonthYear]);

  const nextMonthTotalAmount = useMemo(() => {
    return nextMonthCommitments.reduce(
      (sum, p) => sum + (Number(p.plannedAmount) || 0),
      0
    );
  }, [nextMonthCommitments]);

  const todayDate = formatDateLong(new Date());

  return (
    <div className="page-container">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
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
            Financial snapshot & daily operations command center.
          </p>
        </div>

        <div className="page-header-actions" style={{ alignItems: 'center' }}>
          {/* Timeframe switch: Current Month vs Lifetime */}
          <div className="dashboard-timeframe-selector">
            <button
              onClick={() => setTimeframe('month')}
              className={`dashboard-timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
            >
              {currentMonth} {currentYear}
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`dashboard-timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
            >
              All-Time
            </button>
          </div>

          <button onClick={() => navigate('/life-os/finances')} className="btn btn-secondary">
            <TrendingUp size={14} color="#f97316" /> Ledger
          </button>
        </div>
      </div>

      {/* ── 1. Financial Details At A Single Glance (4 Core Cards) ──────── */}
      <div className="dashboard-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* Card 1: How much I Have in My hand */}
        <div className="glass-panel dashboard-kpi-card" style={{ borderColor: 'rgba(20, 184, 166, 0.35)' }}>
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">
              {timeframe === 'month' ? 'MONTHLY NET CASH FLOW' : 'CASH BALANCE (ALL-TIME LEDGER)'}
            </span>
            <span className={`badge ${financialGlance.cashInHand >= 0 ? 'badge-emerald' : 'badge-amber'}`}>
              <Wallet size={12} /> {financialGlance.cashInHand >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div
            className="dashboard-kpi-value"
            style={{ color: financialGlance.cashInHand >= 0 ? '#ffffff' : '#fb923c' }}
          >
            SAR {financialGlance.cashInHand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="dashboard-kpi-subtext">
            {timeframe === 'month'
              ? `Net income minus expenses in ${currentMonth} ${currentYear}`
              : 'Cumulative credit minus debit across entire ledger'}
          </div>
        </div>



        {/* Card 2: Expense Tracked */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">EXPENSE TRACKED (OUTFLOW)</span>
            <span className="badge badge-amber">
              <ArrowDownRight size={12} /> Spent
            </span>
          </div>
          <div className="dashboard-kpi-value" style={{ color: '#fdba74' }}>
            SAR {financialGlance.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="dashboard-kpi-subtext">
            Total debit transactions recorded ({financialGlance.txCount} entries)
          </div>
        </div>

        {/* Card 3: How Much did I repay */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">HOW MUCH I REPAID</span>
            <span className="badge badge-emerald">
              <RotateCcw size={12} /> {timeframe === 'month' ? 'SAR (Paybacks)' : 'INR (Loans)'}
            </span>
          </div>
          <div className="dashboard-kpi-value" style={{ color: '#ffffff' }}>
            {timeframe === 'month' ? (
              <>
                SAR {financialGlance.creditPaybackDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </>
            ) : (
              <>
                INR {financialGlance.totalDebtRepaid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </>
            )}
          </div>
          <div className="dashboard-kpi-subtext">
            {timeframe === 'month'
              ? `Installments & paybacks settled in ${currentMonth}`
              : `Total loans & credit debt repaid across accounts`}
          </div>
        </div>

        {/* Card 4: Next Month Commitments */}
        <div className="glass-panel dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">NEXT MONTH COMMITMENTS</span>
            <span className="badge badge-indigo">
              <Calendar size={12} /> {nextMonthCommitments.length} Items
            </span>
          </div>
          <div className="dashboard-kpi-value" style={{ color: '#fed7aa' }}>
            SAR {Math.round(nextMonthTotalAmount).toLocaleString('en-US')}
          </div>
          <div className="dashboard-kpi-subtext">
            Scheduled obligations for {nextMonth} {nextMonthYear}
          </div>
        </div>
      </div>




      {/* ── Operational Grid: 4 Core Sections ──────────────────────────── */}
      <div className="dashboard-split-grid" style={{ marginBottom: 28 }}>
        {/* ── Column 1: Today's Reminders & Today's Tasks ───────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 2: Today's Reminders */}
          <div className="glass-panel dashboard-card-section">
            <div className="dashboard-card-header">
              <div>
                <h3 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} color="#f97316" /> Today's Reminders
                </h3>
                <p className="dashboard-card-subtitle">
                  Scheduled notifications and priority alerts
                </p>
              </div>
              <button
                onClick={() => navigate('/life-os/notes')}
                className="btn btn-secondary dashboard-btn-action"
              >
                Reminders Hub
              </button>
            </div>

            <div className="habits-list-vertical">
              {todaysReminders.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No reminders due today. All caught up!
                </div>
              ) : (
                todaysReminders.slice(0, 5).map((reminder) => (
                  <div
                    key={reminder.id}
                    onClick={() =>
                      toggleReminderMutation.mutate({
                        id: reminder.id,
                        isCompleted: !reminder.isCompleted,
                      })
                    }
                    className={`dashboard-reminder-item ${reminder.isCompleted ? 'completed' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {reminder.isCompleted ? (
                        <CheckCircle2 size={18} color="#f97316" />
                      ) : (
                        <Circle size={18} color="var(--text-muted)" />
                      )}
                      <div>
                        <div className={`dashboard-reminder-title ${reminder.isCompleted ? 'completed' : ''}`}>
                          {reminder.title}
                        </div>
                        <div className="dashboard-reminder-meta">
                          {reminder.dueTime && <span><Clock size={12} /> {reminder.dueTime}</span>}
                          {reminder.dueDate && <span>Due: {reminder.dueDate}</span>}
                          {reminder.category && <span>• {reminder.category}</span>}
                        </div>
                      </div>
                    </div>

                    {reminder.priority && (
                      <span
                        className={`badge ${reminder.priority === 'HIGH'
                          ? 'badge-amber'
                          : 'badge-emerald'
                          }`}
                        style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                      >
                        {reminder.priority}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Today's Tasks */}
          <div className="glass-panel dashboard-card-section">
            <div className="dashboard-card-header">
              <div>
                <h3 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckSquare size={18} color="#f97316" /> Today's Tasks
                </h3>
                <p className="dashboard-card-subtitle">
                  Key daily execution action items
                </p>
              </div>
              <span className="badge badge-amber">
                {tasks.filter((t) => !t.completed).length} Pending
              </span>
            </div>

            <div className="habits-list-vertical">
              {todaysTasks.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No active tasks for today. Add one below!
                </div>
              ) : (
                todaysTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskMutation.mutate(task.id)}
                    className={`dashboard-task-item ${task.completed ? 'completed' : 'pending'}`}
                  >
                    <div className="dashboard-task-left">
                      {task.completed ? (
                        <CheckCircle2 size={18} color="#f97316" />
                      ) : (
                        <Circle size={18} color="var(--text-muted)" />
                      )}
                      <div>
                        <span className={`dashboard-task-title ${task.completed ? 'completed' : ''}`}>
                          {task.title}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {task.category || 'General'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`badge ${task.priority === 'HIGH'
                        ? 'badge-amber'
                        : 'badge-emerald'
                        } badge-priority-sm`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Quick Add Task Input */}
            <form onSubmit={handleQuickTaskSubmit} className="dashboard-quick-add-row">
              <input
                type="text"
                placeholder="+ Add a quick task for today..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="dashboard-quick-add-input"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </div>
        </div>

        {/* ── Column 2: Habits Momentum & Next Month Commitments ────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 4: Habits Momentum (Later We change) */}
          <div className="glass-panel dashboard-card-section">
            <div className="dashboard-card-header">
              <div>
                <h3 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={18} color="#f97316" /> Habits Momentum
                </h3>
                <p className="dashboard-card-subtitle">
                  Routines & daily discipline tracking (Later We change)
                </p>
              </div>
              <button
                onClick={() => navigate('/life-os/habits')}
                className="btn btn-secondary dashboard-btn-action"
              >
                Routines ({habits.length})
              </button>
            </div>

            {/* Momentum Strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={16} color="#f97316" fill="#f97316" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  {maxStreak} Days Streak
                </span>
              </div>
              <span className="badge badge-amber">
                {habitsDoneToday} of {habitsTotal} Done Today ({habitsCompletionPct}%)
              </span>
            </div>

            <div className="dashboard-progress-track" style={{ marginBottom: 14 }}>
              <div className="dashboard-progress-bar" style={{ width: `${habitsCompletionPct}%` }} />
            </div>

            {/* Habits Checklist */}
            <div className="habits-list-vertical">
              {habits.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No habits logged. Click "Routines" to define daily habits.
                </div>
              ) : (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => handleHabitCheck(habit.id, habit.completedToday)}
                    className={`habit-row-item ${habit.completedToday ? 'done' : ''}`}
                  >
                    <div className="habit-info-group">
                      {habit.completedToday ? (
                        <CheckCircle2 size={18} color="#f97316" />
                      ) : (
                        <Circle size={18} color="var(--text-muted)" />
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
                      <Flame
                        size={14}
                        color={habit.streak >= 1 ? '#cb6b08' : 'var(--text-muted)'}
                        fill={habit.streak >= 1 ? '#eb7c0a' : 'none'}
                      />
                      <span className={`habit-streak-count ${habit.streak >= 1 ? 'active' : ''}`}>
                        {habit.streak}d
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
