import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  BarChart2,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Zap,
  Clock,
  Tag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { api } from '../services/api';
import { QUERY_KEYS } from '../hooks/queryKeys';
import { Habit } from '../interface/habit.interface';
import HabitModal from '../components/life_os/habits/HabitModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
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
  const now = useMemo(() => new Date(), []);
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
          particleCount: 50,
          spread: 60,
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

  // ─── Real Analytics Engine (Zero Dummy Data) ───────────────────────────────
  const analytics = useMemo(() => {
    if (!habit) return null;

    const streak = habit.streak || 0;
    const history = habit.history || [];
    const isCompletedToday = habit.completedToday;

    // Normalize to 7 days
    const filled = [...history];
    while (filled.length < 7) {
      filled.unshift(0);
    }
    const last7 = filled.slice(-7);
    if (isCompletedToday) {
      last7[6] = 1;
    }

    // Real completion count in the tracked 7-day window
    const completedCount = last7.filter((v) => v > 0).length;
    const consistencyRate = Math.round((completedCount / 7) * 100);

    // Map the 7 elements directly to real calendar dates (index 6 = today)
    const sevenDayData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDateStr = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const isToday = i === 6;
      const isDone = last7[i] > 0;

      sevenDayData.push({
        dayIndex: i,
        day: dayName,
        date: fullDateStr,
        rawDate: d,
        isToday,
        isCompleted: isDone,
        rate: isDone ? 100 : 0,
      });
    }

    return {
      streak,
      isCompletedToday,
      completedCount,
      consistencyRate,
      sevenDayData,
      last7,
    };
  }, [habit, now]);

  // ─── Real Monthly Calendar Grid Generator ──────────────────────────────────
  const calendarDays = useMemo(() => {
    if (!habit || !analytics) return [];

    const firstDayOfMonth = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    // Monday is index 0: 0=Mon, 1=Tue... 6=Sun
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

    // Tracked dates map
    const trackedDatesMap = new Map<string, boolean>();
    analytics.sevenDayData.forEach((item) => {
      const key = `${item.rawDate.getFullYear()}-${item.rawDate.getMonth()}-${item.rawDate.getDate()}`;
      trackedDatesMap.set(key, item.isCompleted);
    });

    // Also check habit.completedDates if populated by backend
    if (habit.completedDates && Array.isArray(habit.completedDates)) {
      habit.completedDates.forEach((dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1; // 0-indexed month
          const d = parseInt(parts[2], 10);
          const key = `${y}-${m}-${d}`;
          trackedDatesMap.set(key, true);
        }
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        calYear === currentYear &&
        calMonth === currentMonth &&
        day === currentDay;
      const isFuture =
        calYear > currentYear ||
        (calYear === currentYear && calMonth > currentMonth) ||
        (calYear === currentYear && calMonth === currentMonth && day > currentDay);

      const cellDateKey = `${calYear}-${calMonth}-${day}`;
      const isTracked = trackedDatesMap.has(cellDateKey);
      const isCompleted = isTracked ? trackedDatesMap.get(cellDateKey) : false;

      cells.push({
        empty: false,
        key: `day-${day}`,
        day,
        isToday,
        isFuture,
        isTracked,
        isCompleted,
      });
    }

    return cells;
  }, [calYear, calMonth, habit, analytics, now]);

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
      {/* ─── Top Bar & Breadcrumb ────────────────────────────────────────── */}
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

      {/* ─── Hero Card: Title, Status & Primary Actions ───────────────────── */}
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
          </div>

          {/* Action Buttons */}
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

      {/* ─── 4 Real Metric Cards ─────────────────────────────────────────── */}
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
          <span className="single-habit-stat-label">Current Streak</span>
          <span className="single-habit-stat-subtext">
            {habit.completedToday
              ? 'Completed today'
              : 'Pending check-in for today'}
          </span>
        </div>

        {/* Metric 2: 7-Day Consistency Rate */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap rate">
              <CheckCircle2 size={20} />
            </div>
            <span className="single-habit-stat-badge emerald">Last 7 Days</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number">{analytics.consistencyRate}%</span>
            <span className="single-habit-stat-unit">completed</span>
          </div>
          <span className="single-habit-stat-label">7-Day Consistency</span>
          <span className="single-habit-stat-subtext">
            {analytics.completedCount} of 7 days completed
          </span>
        </div>

        {/* Metric 3: Target Frequency */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap best">
              <Clock size={20} />
            </div>
            <span className="single-habit-stat-badge gold">Schedule</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number" style={{ fontSize: '1.65rem' }}>
              {habit.targetFrequency || 'Daily'}
            </span>
          </div>
          <span className="single-habit-stat-label">Target Frequency</span>
          <span className="single-habit-stat-subtext">Configured frequency goal</span>
        </div>

        {/* Metric 4: Category */}
        <div className="single-habit-stat-card">
          <div className="single-habit-stat-header">
            <div className="single-habit-stat-icon-wrap total">
              <Tag size={20} />
            </div>
            <span className="single-habit-stat-badge indigo">Group</span>
          </div>
          <div className="single-habit-stat-value-row">
            <span className="single-habit-stat-number" style={{ fontSize: '1.65rem' }}>
              {habit.category || 'General'}
            </span>
          </div>
          <span className="single-habit-stat-label">Habit Category</span>
          <span className="single-habit-stat-subtext">Classification</span>
        </div>
      </div>

      {/* ─── 2-Column Section: Real 7-Day Bar Chart & Consistency Heatmap ─── */}
      <div className="single-habit-grid-2col">
        {/* Real 7-Day Check-in Bar Chart */}
        <div className="single-habit-analytics-card">
          <div className="single-habit-card-header">
            <div className="single-habit-card-title-group">
              <div className="single-habit-card-icon">
                <BarChart2 size={18} />
              </div>
              <div>
                <h3 className="single-habit-card-title">Last 7 Days Check-ins</h3>
                <p className="single-habit-card-subtitle">
                  Daily recorded status ({analytics.completedCount}/7 completed)
                </p>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.sevenDayData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="realBarGradDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.6} />
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
                  ticks={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={(val) => (val === 100 ? 'Done' : 'Missed')}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="single-habit-chart-tooltip">
                          <div className="tooltip-label">{data.date}</div>
                          <div
                            className="tooltip-value"
                            style={{ color: data.isCompleted ? '#34d399' : '#f87171' }}
                          >
                            Status: {data.isCompleted ? 'Completed' : 'Missed'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="rate"
                  fill="url(#realBarGradDone)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Consistency Heatmap Calendar */}
        <div className="single-habit-analytics-card">
          <div className="single-habit-card-header">
            <div className="single-habit-card-title-group">
              <div className="single-habit-card-icon">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 className="single-habit-card-title">Monthly Calendar Heatmap</h3>
                <p className="single-habit-card-subtitle">
                  {MONTH_NAMES[calMonth]} {calYear}
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
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="single-habit-cal-day-header">
                {name}
              </div>
            ))}

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
                    cell.isTracked && cell.isCompleted ? 'completed' : ''
                  } ${cell.isTracked && !cell.isCompleted ? 'missed' : ''} ${
                    cell.isFuture ? 'future' : ''
                  } ${cell.isToday ? 'today-ring' : ''}`}
                  title={`${MONTH_NAMES[calMonth]} ${cell.day}: ${
                    cell.isToday
                      ? cell.isCompleted
                        ? 'Completed Today (Click to toggle)'
                        : 'Pending Today (Click to mark done)'
                      : cell.isTracked
                      ? cell.isCompleted
                        ? 'Completed'
                        : 'Missed'
                      : cell.isFuture
                      ? 'Upcoming'
                      : 'No Record'
                  }`}
                >
                  <span className="cell-num">{cell.day}</span>
                  {cell.isTracked && cell.isCompleted && (
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
      </div>

      {/* ─── Real 7-Day Activity History Log ──────────────────────────────── */}
      <div className="single-habit-analytics-card">
        <div className="single-habit-card-header">
          <div className="single-habit-card-title-group">
            <div className="single-habit-card-icon">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className="single-habit-card-title">Recent 7-Day Check-in History</h3>
              <p className="single-habit-card-subtitle">
                Exact check-in records for the past 7 days
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
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sevenDayData
                .slice()
                .reverse()
                .map((log) => (
                  <tr key={log.dayIndex}>
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
                    <td style={{ textAlign: 'right' }}>
                      {log.isToday ? (
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(habit.id)}
                          disabled={toggleMutation.isPending}
                          className="single-habit-action-btn"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          {habit.completedToday ? 'Undo Today' : 'Mark Done'}
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                          Recorded
                        </span>
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
              targetDays: data.targetDays || [],
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
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Delete Habit"
        message="Are you sure you want to permanently delete this habit and all its streak history? This action cannot be undone."
        itemName={habit.title}
        confirmText="Yes, Delete Habit"
        cancelText="Cancel"
        onConfirm={() => deleteMutation.mutate(habit.id)}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
