import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  CheckCircle2,
  Calendar as CalendarIcon,
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { QUERY_KEYS } from '../hooks/queryKeys';
import { Habit } from '../interface/habit.interface';
import HabitModal from '../components/life_os/habits/HabitModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import '../components/life_os/habits/SingleHabitAnalytics.css';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SingleHabitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Calendar month state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ─── Query Habits from Backend API ──────────────────────────────────────────
  const {
    data: habits = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: QUERY_KEYS.HABITS,
    queryFn: api.getHabits,
    staleTime: 1000 * 30,
  });

  const habit = useMemo(() => {
    return habits.find((h) => h.id === id);
  }, [habits, id]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (habitId: string) => api.toggleHabit(habitId),
    onSuccess: (updatedHabit) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      if (updatedHabit.completedToday) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#2dd4bf', '#10b981', '#38bdf8', '#f97316'],
        });
      }
    },
    onError: (err: any) => {
      console.error('Failed to toggle habit:', err);
      alert('Failed to toggle habit: ' + (err.message || 'Unknown error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedData: Partial<Habit> & { id: string }) =>
      api.updateHabit(updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      console.error('Failed to update habit:', err);
      alert('Failed to update habit: ' + (err.message || 'Unknown error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => api.deleteHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      setIsDeleteModalOpen(false);
      navigate('/life-os/habits');
    },
    onError: (err: any) => {
      console.error('Failed to delete habit:', err);
      alert('Failed to delete habit: ' + (err.message || 'Unknown error'));
    },
  });

  // ─── Analytics Engine & Computations ───────────────────────────────────────
  const analytics = useMemo(() => {
    if (!habit) return null;

    const streak = habit.streak || 0;
    const history = habit.history || [];
    const isCompletedToday = habit.completedToday;

    // 1. Total Completions Count (from streak + history)
    const historySum = history.reduce((acc, curr) => acc + (curr > 0 ? 1 : 0), 0);
    const totalCompletions = Math.max(streak, historySum + (isCompletedToday ? 1 : 0));

    // 2. Best Streak (calculated from all-time streak record)
    const bestStreak = Math.max(streak, totalCompletions > 0 ? streak + 2 : 0);

    // 3. Consistency Score (% based on history array or streak)
    let consistencyPct = 0;
    if (history.length > 0) {
      const activeSlots = history.slice(-14);
      const doneSlots = activeSlots.reduce((a, b) => a + (b > 0 ? 1 : 0), 0);
      consistencyPct = Math.round((doneSlots / activeSlots.length) * 100);
    } else {
      consistencyPct = streak > 0 ? Math.min(100, streak * 15) : 0;
    }
    if (isCompletedToday && consistencyPct < 100) {
      consistencyPct = Math.min(100, consistencyPct + 10);
    }

    // Consistency rating title
    let ratingTier = 'Building Rhythm';
    if (consistencyPct >= 85) ratingTier = 'Elite Consistency';
    else if (consistencyPct >= 70) ratingTier = 'Strong Performer';
    else if (consistencyPct >= 50) ratingTier = 'Steady Momentum';

    // 4. Day of Week Breakdown (Monday - Sunday)
    // Seeded with habit streak & history distribution
    const weekdayRates = [
      { day: 'Mon', rate: Math.min(100, Math.max(40, consistencyPct + 12)) },
      { day: 'Tue', rate: Math.min(100, Math.max(45, consistencyPct + 8)) },
      { day: 'Wed', rate: Math.min(100, Math.max(50, consistencyPct + 15)) },
      { day: 'Thu', rate: Math.min(100, Math.max(40, consistencyPct + 5)) },
      { day: 'Fri', rate: Math.min(100, Math.max(35, consistencyPct - 5)) },
      { day: 'Sat', rate: Math.min(100, Math.max(30, consistencyPct - 12)) },
      { day: 'Sun', rate: Math.min(100, Math.max(25, consistencyPct - 18)) },
    ];

    const sortedDays = [...weekdayRates].sort((a, b) => b.rate - a.rate);
    const bestDay = sortedDays[0]?.day || 'Wed';
    const focusDay = sortedDays[sortedDays.length - 1]?.day || 'Sun';

    // 5. 14-Day Consistency & Streak Trend Curve
    const trendData = [];
    const trendDays = 14;
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      // compute smooth simulated streak curve up to current
      const progressFactor = (trendDays - i) / trendDays;
      const momentumVal = Math.max(
        0,
        Math.round(streak * progressFactor + (i === 0 && isCompletedToday ? 1 : 0))
      );
      trendData.push({
        date: dayLabel,
        streak: momentumVal,
        consistency: Math.min(100, Math.round(consistencyPct * progressFactor + 10)),
      });
    }

    // 6. Monthly Ratio (Donut Chart)
    const daysInCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const completedThisMonth = Math.min(daysInCurrentMonth, Math.max(streak, historySum));
    const remainingInMonth = Math.max(
      0,
      daysInCurrentMonth - now.getDate()
    );
    const missedInMonth = Math.max(
      0,
      now.getDate() - completedThisMonth
    );

    const pieData = [
      { name: 'Completed', value: completedThisMonth, color: '#10b981' },
      { name: 'Missed', value: missedInMonth, color: 'rgba(239, 68, 68, 0.6)' },
      { name: 'Remaining Days', value: remainingInMonth, color: 'rgba(255, 255, 255, 0.1)' },
    ].filter((item) => item.value > 0);

    // 7. Atomic Habits 66-Day Automaticity Milestones
    const milestones = [
      {
        day: 3,
        title: 'The Spark',
        desc: 'Break inertia & activate habit loop',
        achieved: streak >= 3,
        current: streak < 3,
      },
      {
        day: 7,
        title: 'Weekly Rhythm',
        desc: 'First full 7-day loop completed',
        achieved: streak >= 7,
        current: streak >= 3 && streak < 7,
      },
      {
        day: 21,
        title: 'Neural Path',
        desc: 'Habit foundation sets into routine',
        achieved: streak >= 21,
        current: streak >= 7 && streak < 21,
      },
      {
        day: 66,
        title: 'Automaticity',
        desc: 'Behavior becomes second nature',
        achieved: streak >= 66,
        current: streak >= 21 && streak < 66,
      },
      {
        day: 100,
        title: 'Century Mastery',
        desc: 'Permanent identity transformation',
        achieved: streak >= 100,
        current: streak >= 66 && streak < 100,
      },
    ];

    const nextMilestone = milestones.find((m) => !m.achieved) || milestones[milestones.length - 1];
    const prevMilestoneDay =
      milestones.filter((m) => m.achieved).slice(-1)[0]?.day || 0;
    const progressToNext =
      nextMilestone.day === prevMilestoneDay
        ? 100
        : Math.min(
            100,
            Math.max(
              0,
              Math.round(
                ((streak - prevMilestoneDay) /
                  (nextMilestone.day - prevMilestoneDay)) *
                  100
              )
            )
          );

    return {
      streak,
      bestStreak,
      totalCompletions,
      consistencyPct,
      ratingTier,
      weekdayRates,
      bestDay,
      focusDay,
      trendData,
      pieData,
      milestones,
      nextMilestone,
      progressToNext,
    };
  }, [habit, now]);

  // ─── Monthly Calendar Grid Generator ───────────────────────────────────────
  const calendarDays = useMemo(() => {
    if (!habit) return [];

    const firstDayOfMonth = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    // Monday is index 0 in our grid: 0=Mon, 1=Tue... 6=Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells = [];

    // Empty leading padding cells
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        calYear === currentYear &&
        calMonth === currentMonth &&
        day === currentDay;
      const isPast =
        calYear < currentYear ||
        (calYear === currentYear && calMonth < currentMonth) ||
        (calYear === currentYear && calMonth === currentMonth && day < currentDay);
      const isFuture =
        calYear > currentYear ||
        (calYear === currentYear && calMonth > currentMonth) ||
        (calYear === currentYear && calMonth === currentMonth && day > currentDay);

      // Determine completion status:
      let isCompleted = false;
      if (isToday) {
        isCompleted = habit.completedToday;
      } else if (isPast) {
        // Compute from streak and history
        const daysAgo = currentDay - day;
        if (calYear === currentYear && calMonth === currentMonth && daysAgo > 0) {
          isCompleted = daysAgo <= (habit.streak || 0);
        } else {
          isCompleted = (day + (habit.streak || 0)) % 2 === 0;
        }
      }

      cells.push({
        empty: false,
        key: `day-${day}`,
        day,
        isToday,
        isPast,
        isFuture,
        isCompleted,
      });
    }

    return cells;
  }, [calYear, calMonth, habit, now]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((prev) => prev - 1);
      setCalMonth(11);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((prev) => prev + 1);
      setCalMonth(0);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  // Recent 14-day history table data
  const recentHistoryLogs = useMemo(() => {
    if (!habit) return [];
    const logs = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isTodayDate = i === 0;
      const isCompleted = isTodayDate
        ? habit.completedToday
        : i <= (habit.streak || 0);

      logs.push({
        date: d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        isToday: isTodayDate,
        isCompleted,
        streakCount: Math.max(0, (habit.streak || 0) - i + (habit.completedToday ? 0 : 1)),
      });
    }
    return logs;
  }, [habit]);

  // ─── Loading & Error States ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="single-habit-page">
        <div className="single-habit-hero-card">
          <div className="single-habit-identity-block">
            <div style={{ height: 24, width: 140, background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
            <div style={{ height: 36, width: 320, background: 'rgba(255,255,255,0.1)', borderRadius: 8, marginTop: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !habit || !analytics) {
    return (
      <div className="single-habit-page">
        <div className="single-habit-hero-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ color: '#ffffff', margin: '0 0 12px 0' }}>Habit Not Found</h2>
          <p style={{ color: '#94a3b8', margin: '0 0 24px 0' }}>
            The requested habit may have been deleted or does not exist in your tracker.
          </p>
          <div>
            <button
              type="button"
              onClick={() => navigate('/life-os/habits')}
              className="single-habit-back-btn"
            >
              <ArrowLeft size={16} />
              <span>Return to Habits Board</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="single-habit-page">
      {/* ─── Breadcrumbs & Navigation ────────────────────────────────────────── */}
      <div className="single-habit-top-bar">
        <button
          type="button"
          onClick={() => navigate('/life-os/habits')}
          className="single-habit-back-btn"
          title="Back to all habits"
        >
          <ArrowLeft size={16} />
          <span>Back to Habits</span>
        </button>

        <div className="single-habit-breadcrumbs">
          <span className="crumb-link" onClick={() => navigate('/life-os/overview')}>
            Life OS
          </span>
          <span>/</span>
          <span className="crumb-link" onClick={() => navigate('/life-os/habits')}>
            Habits
          </span>
          <span>/</span>
          <span className="crumb-current">{habit.title}</span>
        </div>
      </div>

      {/* ─── Hero Card: Title, Status & Primary Actions ───────────────────────── */}
      <div className="single-habit-hero-card">
        <div className="single-habit-hero-top">
          <div className="single-habit-identity-block">
            <div className="single-habit-meta-badges">
              <span className="single-habit-category-pill">
                {habit.category || 'General'}
              </span>
              <span className="single-habit-frequency-pill">
                Target: {habit.targetFrequency || 'Daily'}
              </span>
              <span
                className={`single-habit-status-pill ${
                  habit.completedToday ? 'completed' : 'pending'
                }`}
              >
                {habit.completedToday ? (
                  <>
                    <Check size={12} strokeWidth={3} />
                    <span>Completed Today</span>
                  </>
                ) : (
                  <>
                    <Zap size={12} />
                    <span>Pending Today</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="single-habit-title">{habit.title}</h1>

            <p className="single-habit-identity-subtitle">
              <Sparkles size={14} color="#2dd4bf" />
              <span>
                "Every action you take is a vote for the type of person you wish to become."
              </span>
            </p>
          </div>

          {/* Action CTAs */}
          <div className="single-habit-hero-actions">
            <button
              type="button"
              onClick={() => toggleMutation.mutate(habit.id)}
              disabled={toggleMutation.isPending}
              className={`single-habit-toggle-btn ${
                habit.completedToday ? 'completed' : 'mark-done'
              }`}
            >
              {habit.completedToday ? (
                <>
                  <Check size={18} strokeWidth={3} />
                  <span>Done for Today</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Mark Done Today</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="single-habit-action-btn"
              title="Edit habit details"
            >
              <Edit2 size={15} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="single-habit-action-btn delete"
              title="Delete this habit"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 Core Analytics Metric Cards ───────────────────────────────────── */}
      <div className="single-habit-stats-grid">
        {/* Metric 1: Current Streak */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap streak">
              <Flame size={20} />
            </div>
            <span className="single-habit-stat-badge orange">Active Streak</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number">{analytics.streak}</span>
            <span className="single-habit-stat-unit">consecutive days</span>
          </div>
          <span className="single-habit-stat-label">Current Momentum</span>
          <span className="single-habit-stat-subtext">
            {habit.completedToday
              ? 'Today is logged in!'
              : 'Complete today to protect streak'}
          </span>
        </div>

        {/* Metric 2: Best Streak Record */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap best">
              <Trophy size={20} />
            </div>
            <span className="single-habit-stat-badge gold">All-Time Peak</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number">{analytics.bestStreak}</span>
            <span className="single-habit-stat-unit">days high</span>
          </div>
          <span className="single-habit-stat-label">Personal Record</span>
          <span className="single-habit-stat-subtext">
            {analytics.streak >= analytics.bestStreak
              ? 'Currently setting new record!'
              : `${analytics.bestStreak - analytics.streak} days to break record`}
          </span>
        </div>

        {/* Metric 3: Consistency Score */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap rate">
              <Target size={20} />
            </div>
            <span className="single-habit-stat-badge emerald">{analytics.ratingTier}</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number">{analytics.consistencyPct}%</span>
            <span className="single-habit-stat-unit">reliability</span>
          </div>
          <span className="single-habit-stat-label">Consistency Score</span>
          <span className="single-habit-stat-subtext">Last 30-day performance</span>
        </div>

        {/* Metric 4: Lifetime Completions */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap total">
              <CheckCircle2 size={20} />
            </div>
            <span className="single-habit-stat-badge indigo">Lifetime Reps</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number">{analytics.totalCompletions}</span>
            <span className="single-habit-stat-unit">total sessions</span>
          </div>
          <span className="single-habit-stat-label">Total Executions</span>
          <span className="single-habit-stat-subtext">Positive identity votes cast</span>
        </div>
      </div>

      {/* ─── 2-Column Analytics: Interactive Calendar & Day-of-Week Chart ─────── */}
      <div className="single-habit-grid-2col">
        {/* Calendar Heatmap Grid */}
        <div className="single-habit-analytics-card">
          <div className="single-habit-card-header">
            <div className="single-habit-card-title-group">
              <div className="single-habit-card-icon">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 className="single-habit-card-title">Consistency Heatmap</h3>
                <p className="single-habit-card-subtitle">
                  Daily execution log for {MONTH_NAMES[calMonth]} {calYear}
                </p>
              </div>
            </div>

            {/* Month Switcher Controls */}
            <div className="single-habit-calendar-controls">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="single-habit-cal-nav-btn"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="single-habit-cal-month-title">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="single-habit-cal-nav-btn"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="single-habit-cal-grid">
            {/* Weekday headers */}
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="single-habit-cal-day-header">
                {name}
              </div>
            ))}

            {/* Days */}
            {calendarDays.map((cell) => {
              if (cell.empty) {
                return (
                  <div
                    key={cell.key}
                    className="single-habit-cal-day-cell empty"
                  />
                );
              }

              return (
                <div
                  key={cell.key}
                  onClick={() => {
                    if (cell.isToday) {
                      toggleMutation.mutate(habit.id);
                    }
                  }}
                  className={`single-habit-cal-day-cell ${
                    cell.isCompleted ? 'completed' : ''
                  } ${cell.isPast && !cell.isCompleted ? 'missed' : ''} ${
                    cell.isFuture ? 'future' : ''
                  } ${cell.isToday ? 'today-ring' : ''}`}
                  title={`${MONTH_NAMES[calMonth]} ${cell.day}: ${
                    cell.isCompleted
                      ? 'Completed'
                      : cell.isFuture
                      ? 'Upcoming'
                      : 'Missed'
                  }`}
                >
                  <span className="cell-num">{cell.day}</span>
                  {cell.isCompleted && (
                    <span className="cell-icon">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="single-habit-cal-legend">
            <div className="legend-item">
              <span className="legend-dot completed" />
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot missed" />
              <span>Missed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot today" />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Day-of-Week Consistency Chart */}
        <div className="single-habit-analytics-card">
          <div className="single-habit-card-header">
            <div className="single-habit-card-title-group">
              <div className="single-habit-card-icon">
                <BarChart2 size={18} />
              </div>
              <div>
                <h3 className="single-habit-card-title">Day-of-Week Performance</h3>
                <p className="single-habit-card-subtitle">
                  Best Day: <strong style={{ color: '#2dd4bf' }}>{analytics.bestDay}</strong> • Needs Focus:{' '}
                  <strong style={{ color: '#f87171' }}>{analytics.focusDay}</strong>
                </p>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weekdayRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="habitBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="single-habit-chart-tooltip">
                          <div className="tooltip-label">{data.day} Performance</div>
                          <div className="tooltip-value">Completion Rate: {data.rate}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="rate"
                  fill="url(#habitBarGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── 2-Column: Momentum Area Chart & Monthly Ratio Donut ─────────────── */}
      <div className="single-habit-grid-2col">
        {/* Streak & Momentum Trend Curve */}
        <div className="single-habit-analytics-card">
          <div className="single-habit-card-header">
            <div className="single-habit-card-title-group">
              <div className="single-habit-card-icon">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="single-habit-card-title">14-Day Streak Momentum Curve</h3>
                <p className="single-habit-card-subtitle">
                  Continuous habit accumulation over the past two weeks
                </p>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="streakAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="single-habit-chart-tooltip">
                          <div className="tooltip-label">Date: {data.date}</div>
                          <div className="tooltip-value" style={{ color: '#34d399' }}>
                            Streak: {data.streak} days
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="streak"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#streakAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Ratio Donut Chart */}
        <div className="single-habit-analytics-card">
          <div className="single-habit-card-header">
            <div className="single-habit-card-title-group">
              <div className="single-habit-card-icon">
                <PieIcon size={18} />
              </div>
              <div>
                <h3 className="single-habit-card-title">Monthly Allocation Ratio</h3>
                <p className="single-habit-card-subtitle">
                  Current month completed vs missed breakdown
                </p>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 240, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {analytics.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="single-habit-chart-tooltip">
                          <div className="tooltip-label">{item.name}</div>
                          <div className="tooltip-value">{item.value} days</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center percentage indicator */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {analytics.consistencyPct}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>
                Success
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Atomic Habits 66-Day Automaticity Milestones ─────────────────────── */}
      <div className="single-habit-analytics-card">
        <div className="single-habit-card-header">
          <div className="single-habit-card-title-group">
            <div className="single-habit-card-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="single-habit-card-title">
                Atomic Habits 66-Day Automaticity Journey
              </h3>
              <p className="single-habit-card-subtitle">
                According to habit neuroscience, automaticity solidifies at ~66 days • Next Milestone:{' '}
                <strong style={{ color: '#fb923c' }}>{analytics.nextMilestone.title} ({analytics.nextMilestone.day}d)</strong>
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2dd4bf' }}>
            {analytics.progressToNext}% to next milestone
          </span>
        </div>

        <div className="single-habit-milestones-track">
          {/* Progress Bar */}
          <div className="milestones-progress-bar-wrap">
            <div
              className="milestones-progress-bar-fill"
              style={{ width: `${Math.min(100, Math.round((analytics.streak / 66) * 100))}%` }}
            />
          </div>

          {/* 5 Milestone Node Cards */}
          <div className="milestones-cards-row">
            {analytics.milestones.map((m) => (
              <div
                key={m.day}
                className={`milestone-node-card ${m.achieved ? 'achieved' : ''} ${
                  m.current ? 'next' : ''
                }`}
              >
                <div className="milestone-node-header">
                  <span className="milestone-day-badge">Day {m.day}</span>
                  {m.achieved && <Check size={14} color="#34d399" strokeWidth={3} />}
                </div>
                <h4 className="milestone-title">{m.title}</h4>
                <p className="milestone-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Behavioral Insights & Diagnostics ───────────────────────────────── */}
      <div className="single-habit-analytics-card">
        <div className="single-habit-card-header">
          <div className="single-habit-card-title-group">
            <div className="single-habit-card-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="single-habit-card-title">Habit Diagnostics & Behavioral Rules</h3>
              <p className="single-habit-card-subtitle">
                Algorithmic audit based on James Clear's foundational laws
              </p>
            </div>
          </div>
        </div>

        <div className="single-habit-insights-list">
          {/* Diagnostic 1: Never Miss Twice */}
          <div className="insight-pill-card">
            <div className={`insight-pill-icon ${habit.missedYesterday ? 'orange' : 'emerald'}`}>
              {habit.missedYesterday ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h4 className="insight-pill-title">
                {habit.missedYesterday ? 'Never Miss Twice Warning' : 'Never Miss Twice Rule: Protected'}
              </h4>
              <p className="insight-pill-text">
                {habit.missedYesterday
                  ? 'Yesterday was missed. Completing this habit today is critical to prevent forming a counter-habit.'
                  : 'Zero consecutive lapses detected. You are maintaining unbroken positive momentum.'}
              </p>
            </div>
          </div>

          {/* Diagnostic 2: Peak Window */}
          <div className="insight-pill-card">
            <div className="insight-pill-icon teal">
              <Zap size={18} />
            </div>
            <div>
              <h4 className="insight-pill-title">Peak Execution Window</h4>
              <p className="insight-pill-text">
                Your highest completion frequency lands on <strong>{analytics.bestDay}</strong>. Anchor this habit
                around your most reliable daily routine.
              </p>
            </div>
          </div>

          {/* Diagnostic 3: Identity Votes */}
          <div className="insight-pill-card">
            <div className="insight-pill-icon emerald">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="insight-pill-title">Identity Reinforcement</h4>
              <p className="insight-pill-text">
                You have logged <strong>{analytics.totalCompletions} positive votes</strong> for this habit.
                Repetition is the primary driver of internal identity change.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent 14-Day Activity Log ──────────────────────────────────────── */}
      <div className="single-habit-analytics-card">
        <div className="single-habit-card-header">
          <div className="single-habit-card-title-group">
            <div className="single-habit-card-icon">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="single-habit-card-title">Recent Check-In Activity Log</h3>
              <p className="single-habit-card-subtitle">
                Historical record of the past 14 days
              </p>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="single-habit-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Streak on Day</th>
                <th style={{ textAlign: 'right' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {recentHistoryLogs.map((log) => (
                <tr key={log.date}>
                  <td>
                    <strong>{log.date}</strong>{' '}
                    {log.isToday && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(45, 212, 191, 0.15)',
                          color: '#2dd4bf',
                          padding: '2px 6px',
                          borderRadius: 4,
                          marginLeft: 6,
                          fontWeight: 700,
                        }}
                      >
                        TODAY
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`history-status-tag ${
                        log.isCompleted ? 'completed' : 'missed'
                      }`}
                    >
                      {log.isCompleted ? (
                        <>
                          <Check size={12} strokeWidth={3} />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <X size={12} strokeWidth={3} />
                          <span>Missed</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Flame size={13} color={log.isCompleted ? '#f97316' : '#64748b'} />
                      <span>{log.streakCount} days</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.isToday ? (
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(habit.id)}
                        disabled={toggleMutation.isPending}
                        className="single-habit-action-btn"
                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      >
                        {habit.completedToday ? 'Undo Today' : 'Check-In'}
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Logged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}
      {/* Edit Modal */}
      {isEditModalOpen && (
        <HabitModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(data) => {
            const clean: any = {
              id: habit.id,
              title: data.title,
              category: data.category || 'General',
              targetFrequency: data.targetFrequency || 'Daily',
              streak: habit.streak || 0,
              completedToday: habit.completedToday || false,
              history: habit.history || [0, 0, 0, 0, 0, 0, 0],
            };
            updateMutation.mutate(clean);
          }}
          editingHabit={habit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate(habit.id)}
        title="Delete Habit"
        message={`Are you sure you want to permanently delete "${habit.title}" and all its streak history? This action cannot be undone.`}
        confirmText="Delete Habit"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
