import React, { useState } from 'react';
import { Flame, X, Sparkles } from 'lucide-react';
import { HABIT_CATEGORIES } from '../../../utils/constants';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; category: string; targetFrequency: string }) => void;
}

interface HabitPreset {
  title: string;
  category: string;
  targetFrequency: string;
}

const PRESET_SUGGESTIONS: HabitPreset[] = [
  { title: '💧 Drink 2.5L Water', category: 'Health', targetFrequency: 'Daily' },
  { title: '🏃 30 Min Morning Workout', category: 'Fitness', targetFrequency: 'Daily' },
  { title: '📖 Read 20 Pages', category: 'Learning', targetFrequency: 'Daily' },
  { title: '🧘 10 Min Meditation', category: 'Mindset', targetFrequency: 'Daily' },
  { title: '💻 Code / Build Projects', category: 'Productivity', targetFrequency: 'Weekdays' },
  { title: '💰 Track Daily Expenses', category: 'Finance', targetFrequency: 'Daily' },
  { title: '🚶 10,000 Steps Walk', category: 'Fitness', targetFrequency: 'Daily' },
];

export default function HabitModal({ isOpen, onClose, onSubmit }: HabitModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Health',
    targetFrequency: 'Daily',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
    setFormData({ title: '', category: 'Health', targetFrequency: 'Daily' });
    onClose();
  };

  const handleApplyPreset = (preset: HabitPreset) => {
    setFormData({
      title: preset.title,
      category: preset.category,
      targetFrequency: preset.targetFrequency,
    });
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card modal-content-card-sm habit-modal-dialog">
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div
              className="modal-icon-badge planned"
              style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
            >
              <Flame size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">Build New Habit Routine</h3>
              <p className="modal-subtitle-text">
                Design a daily or recurring routine to build unbreakable consistency.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets Section */}
        <div className="habit-presets-section">
          <span className="habit-presets-label">
            <Sparkles size={12} color="#818cf8" /> Quick Inspiration Presets:
          </span>
          <div className="habit-presets-wrap">
            {PRESET_SUGGESTIONS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`habit-preset-chip ${formData.title === preset.title ? 'active' : ''}`}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          <div className="form-group-custom">
            <label className="modal-field-label">Habit Name / Routine</label>
            <input
              type="text"
              placeholder="e.g. Read 20 Pages, Morning Stretch..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="modal-input-field"
              autoFocus
            />
          </div>

          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="modal-field-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="modal-select-field"
              >
                {HABIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label className="modal-field-label">Target Cadence</label>
              <select
                value={formData.targetFrequency}
                onChange={(e) => setFormData({ ...formData, targetFrequency: e.target.value })}
                className="modal-select-field"
              >
                <option value="Daily">Daily (7 days / wk)</option>
                <option value="Weekdays">Weekdays (Mon-Fri)</option>
                <option value="3x Weekly">3x Weekly</option>
                <option value="Weekends">Weekends Only</option>
              </select>
            </div>
          </div>

          <div className="modal-footer-actions" style={{ marginTop: 24 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Flame size={15} /> Save Habit Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
