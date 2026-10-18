import React, { useState, useEffect } from 'react';
import { X, Sparkles, Link2, Zap, ShieldCheck, Tag } from 'lucide-react';
import { Habit } from '../../../interface/habit.interface';
import { HABIT_CATEGORIES } from '../../../utils/constants';
import './habits.css';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

const IDENTITY_SUGGESTIONS = [
  'Master Software Engineer',
  'Fluent English Communicator',
  'Deeply Focused Builder',
  'Healthy & Vital Person',
  'Resilient & Strong Athlete',
  'Lifelong Learner & Thinker',
  'Mindful & Grounded Stoic',
  'Disciplined Wealth Builder',
];

export default function HabitModal({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}: HabitModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Productivity');
  const [identity, setIdentity] = useState('');
  const [habitStack, setHabitStack] = useState('');
  const [twoMinuteRule, setTwoMinuteRule] = useState('');
  const [targetFrequency, setTargetFrequency] = useState('Daily');

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title || '');
      setCategory(editingHabit.category || 'Productivity');
      setIdentity(editingHabit.identity || '');
      setHabitStack(editingHabit.habitStack || '');
      setTwoMinuteRule(editingHabit.twoMinuteRule || '');
      setTargetFrequency(editingHabit.targetFrequency || 'Daily');
    } else {
      setTitle('');
      setCategory('Productivity');
      setIdentity('');
      setHabitStack('');
      setTwoMinuteRule('');
      setTargetFrequency('Daily');
    }
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...(editingHabit ? { id: editingHabit.id } : {}),
      title: title.trim(),
      category,
      identity: identity.trim() || undefined,
      habitStack: habitStack.trim() || undefined,
      twoMinuteRule: twoMinuteRule.trim() || undefined,
      targetFrequency,
    });

    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel habit-modal-card">
        {/* Modal Header */}
        <div className="habit-modal-header">
          <div className="habit-modal-title-group">
            <div className="habit-modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="habit-modal-title">
                {editingHabit ? 'Refine Atomic Habit' : 'Design New Atomic Habit'}
              </h2>
              <p className="habit-modal-subtitle">
                "You do not rise to the level of your goals. You fall to the level of your systems."
              </p>
            </div>
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
          {/* 1. Habit Title */}
          <div className="habit-form-group">
            <label className="habit-form-label">
              Habit Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Coding & Problem Solving, English Fluency Practice"
              className="habit-form-input"
              autoFocus
            />
          </div>

          {/* 2. Identity Statement (Who are you becoming?) */}
          <div className="habit-form-group">
            <div className="habit-form-label-row">
              <label className="habit-form-label">
                Identity Statement <span className="atomic-tag">Identity First</span>
              </label>
              <span className="habit-form-hint">Every rep is a vote for who you want to be</span>
            </div>
            <input
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="e.g. Master Software Engineer, Fluent English Communicator"
              className="habit-form-input"
            />
            {/* Quick Suggestion Chips with Coding & English */}
            <div className="habit-identity-chips">
              <span className="chips-label">Suggestions:</span>
              {IDENTITY_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setIdentity(sug)}
                  className={`habit-chip-btn ${identity === sug ? 'active' : ''}`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category & Target Frequency */}
          <div className="habit-form-row">
            <div className="habit-form-group flex-1">
              <label className="habit-form-label">Category</label>
              <div className="habit-select-wrapper">
                <Tag size={14} className="habit-select-icon" />
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
              <label className="habit-form-label">Target Frequency</label>
              <select
                value={targetFrequency}
                onChange={(e) => setTargetFrequency(e.target.value)}
                className="habit-form-select"
              >
                <option value="Daily">Daily</option>
                <option value="Weekdays">Weekdays (Mon-Fri)</option>
                <option value="3x per week">3x per week</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* 4. Habit Stacking (Law 1: Make it Obvious) */}
          <div className="habit-form-group atomic-field-box">
            <div className="habit-field-header">
              <div className="habit-field-icon teal">
                <Link2 size={15} />
              </div>
              <div>
                <label className="habit-form-label">
                  Habit Stacking Anchor <span className="law-tag">Law 1: Make it Obvious</span>
                </label>
                <p className="habit-field-subtext">
                  Formula: <em>"After [CURRENT HABIT], I will [NEW HABIT]"</em>
                </p>
              </div>
            </div>
            <input
              type="text"
              value={habitStack}
              onChange={(e) => setHabitStack(e.target.value)}
              placeholder="e.g. After I finish lunch, I will practice speaking English for 15 mins..."
              className="habit-form-input"
            />
          </div>

          {/* 5. 2-Minute Gateway Rule (Law 3: Make it Easy) */}
          <div className="habit-form-group atomic-field-box">
            <div className="habit-field-header">
              <div className="habit-field-icon emerald">
                <Zap size={15} />
              </div>
              <div>
                <label className="habit-form-label">
                  The 2-Minute Gateway Starter <span className="law-tag">Law 3: Make it Easy</span>
                </label>
                <p className="habit-field-subtext">
                  Scale it down to &lt;2 minutes so it's effortless to show up.
                </p>
              </div>
            </div>
            <input
              type="text"
              value={twoMinuteRule}
              onChange={(e) => setTwoMinuteRule(e.target.value)}
              placeholder="e.g. Read 1 English paragraph out loud, or write 1 line of code..."
              className="habit-form-input"
            />
          </div>

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
              <ShieldCheck size={16} />
              <span>{editingHabit ? 'Save Changes' : 'Create Atomic Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
