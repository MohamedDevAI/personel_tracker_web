import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Check, AlertCircle } from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import { HABIT_CATEGORIES } from '../../../utils/constants';
import { getLocalDateISO } from '../../../utils/dateHelpers';
import './habits.css';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

const DAYS_OF_WEEK = [
  { key: 'Sun', label: 'Sun', full: 'Sunday' },
  { key: 'Mon', label: 'Mon', full: 'Monday' },
  { key: 'Tue', label: 'Tue', full: 'Tuesday' },
  { key: 'Wed', label: 'Wed', full: 'Wednesday' },
  { key: 'Thu', label: 'Thu', full: 'Thursday' },
  { key: 'Fri', label: 'Fri', full: 'Friday' },
  { key: 'Sat', label: 'Sat', full: 'Saturday' },
];

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const WEEKEND_KEYS = ['Fri', 'Sat'];
const ALL_DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitModal({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}: HabitModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Productivity');
  const [startDate, setStartDate] = useState<string>(getLocalDateISO());
  const [frequencyType, setFrequencyType] = useState<string>('Daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setCategory(editingHabit.category || 'Productivity');
      setStartDate(
        editingHabit.startDate ||
          (editingHabit.createdAt ? editingHabit.createdAt.split('T')[0] : getLocalDateISO())
      );
      setErrorMessage('');

      const rawFreq = editingHabit.targetFrequency || 'Daily';
      const existingDays = editingHabit.targetDays;

      if (existingDays && existingDays.length > 0 && (rawFreq.startsWith('Specific Days') || rawFreq.includes('Specific'))) {
        setFrequencyType('Specific Days');
        setSelectedDays(existingDays);
      } else if (rawFreq.startsWith('Specific Days')) {
        setFrequencyType('Specific Days');
        const match = rawFreq.match(/\(([^)]+)\)/) || rawFreq.match(/:\s*(.+)$/);
        if (match && match[1]) {
          const parsed = match[1]
            .split(',')
            .map((s) => s.trim())
            .filter((s) => ALL_DAY_KEYS.includes(s));
          setSelectedDays(parsed.length > 0 ? parsed : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
        } else {
          setSelectedDays(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
        }
      } else if (
        rawFreq === 'Weekdays (Sun - Thu)' ||
        rawFreq === 'Weekdays' ||
        rawFreq.toLowerCase().includes('sun') ||
        rawFreq.toLowerCase().includes('weekday')
      ) {
        setFrequencyType('Weekdays (Sun - Thu)');
        setSelectedDays(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
      } else {
        setFrequencyType('Daily');
        setSelectedDays(ALL_DAY_KEYS);
      }
    } else {
      setTitle('');
      setCategory('Productivity');
      setStartDate(getLocalDateISO());
      setFrequencyType('Daily');
      setSelectedDays(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
      setErrorMessage('');
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayKey: string) => {
    setErrorMessage('');
    setSelectedDays((prev) => {
      const next = prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey];
      return next.sort(
        (a, b) => ALL_DAY_KEYS.indexOf(a) - ALL_DAY_KEYS.indexOf(b)
      );
    });
  };

  const handleSelectPreset = (days: string[]) => {
    setErrorMessage('');
    setSelectedDays(days);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (frequencyType === 'Specific Days' && selectedDays.length === 0) {
      setErrorMessage('Please select at least one day for your habit.');
      return;
    }

    let targetFrequency = 'Daily';
    let targetDays: string[] = ALL_DAY_KEYS;

    if (frequencyType === 'Weekdays (Sun - Thu)') {
      targetFrequency = 'Weekdays (Sun - Thu)';
      targetDays = WEEKDAY_KEYS;
    } else if (frequencyType === 'Specific Days') {
      targetFrequency = `Specific Days (${selectedDays.join(', ')})`;
      targetDays = selectedDays;
    }

    onSave({
      ...(editingHabit ? { id: editingHabit.id } : {}),
      title: title.trim(),
      category,
      startDate: startDate || getLocalDateISO(),
      targetFrequency,
      targetDays,
    });

    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel habit-modal-card" style={{ maxWidth: 500 }}>
        {/* Modal Header */}
        <div className="habit-modal-header">
          <div className="habit-modal-title-group">
            <h2 className="habit-modal-title">
              {editingHabit ? 'Edit Habit' : 'New Habit'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="habit-modal-close-btn"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="habit-modal-form">
          {/* 1. Habit Name */}
          <div className="habit-form-group">
            <label className="habit-form-label">
              Habit Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Coding, Gym Workout, Read Books"
              className="habit-form-input"
              autoFocus
            />
          </div>

          {/* 2. Category & Start Date */}
          <div className="habit-form-row">
            <div className="habit-form-group flex-1">
              <label className="habit-form-label">Category</label>
              <div className="habit-select-wrapper">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="habit-form-select"
                >
                  {HABIT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="habit-form-group flex-1">
              <label className="habit-form-label">
                Start Date <span className="required-star">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="habit-form-input habit-date-input"
              />
            </div>
          </div>

          {/* 3. Frequency */}
          <div className="habit-form-group">
            <label className="habit-form-label">Frequency</label>
            <div className="habit-select-wrapper">
              <select
                value={frequencyType}
                onChange={(e) => {
                  setFrequencyType(e.target.value);
                  setErrorMessage('');
                }}
                className="habit-form-select"
              >
                <option value="Daily">Daily</option>
                <option value="Weekdays (Sun - Thu)">Weekdays (Sun - Thu)</option>
                <option value="Specific Days">Specific Days of the Week</option>
              </select>
            </div>
          </div>

          {/* 4. Conditional: Weekdays (Sunday - Thursday) Timeline Preview */}
          {frequencyType === 'Weekdays (Sun - Thu)' && (
            <div className="habit-timeline-box">
              <div className="habit-timeline-header">
                <div className="habit-timeline-badge-title">
                  <Calendar size={14} className="timeline-icon" />
                  <span>Timeline: Sunday – Thursday</span>
                </div>
                <span className="timeline-subtitle-chip">5 days/wk</span>
              </div>
              <div className="habit-timeline-days-strip">
                {ALL_DAY_KEYS.map((d) => {
                  const isWeekday = WEEKDAY_KEYS.includes(d);
                  return (
                    <div
                      key={d}
                      className={`timeline-day-chip ${isWeekday ? 'active' : 'weekend'}`}
                      title={isWeekday ? `${d}: Active Weekday` : `${d}: Weekend`}
                    >
                      <span className="chip-day-text">{d}</span>
                      {isWeekday && <Check size={11} className="chip-check" />}
                    </div>
                  );
                })}
              </div>
              <p className="habit-timeline-hint">
                Habit is active on Sunday, Monday, Tuesday, Wednesday, and Thursday.
              </p>
            </div>
          )}

          {/* 5. Conditional: Specific Days of the Week Picker */}
          {frequencyType === 'Specific Days' && (
            <div className="habit-specific-days-box">
              <div className="habit-days-header-row">
                <label className="habit-form-label">
                  Specific Days of the Week <span className="required-star">*</span>
                </label>
                <div className="habit-days-quick-links">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(WEEKDAY_KEYS)}
                    className="habit-quick-link-btn"
                  >
                    Sun–Thu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(WEEKEND_KEYS)}
                    className="habit-quick-link-btn"
                  >
                    Fri–Sat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(ALL_DAY_KEYS)}
                    className="habit-quick-link-btn"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset([])}
                    className="habit-quick-link-btn"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Day Pills Grid */}
              <div className="habit-days-grid">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`habit-day-pill ${isSelected ? 'selected' : ''}`}
                      title={`${day.full} (${isSelected ? 'Selected' : 'Unselected'})`}
                    >
                      <span className="day-pill-short">{day.label}</span>
                      {isSelected && <Check size={12} className="day-pill-check" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>

              {/* Validation / Summary */}
              {errorMessage ? (
                <div className="habit-days-error">
                  <AlertCircle size={13} />
                  <span>{errorMessage}</span>
                </div>
              ) : selectedDays.length === 0 ? (
                <p className="habit-days-warning">
                  Select at least one day for this habit schedule.
                </p>
              ) : (
                <p className="habit-days-summary">
                  Active on{' '}
                  <span className="habit-days-highlight">
                    {selectedDays.length === 7
                      ? 'Every Day'
                      : selectedDays.join(', ')}
                  </span>{' '}
                  ({selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'}/week)
                </p>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="habit-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary habit-modal-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary habit-modal-btn submit"
            >
              <Plus size={16} />
              <span>{editingHabit ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
