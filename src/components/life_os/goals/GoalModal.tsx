import React, { useState } from 'react';
import { Target, X, Sparkles } from 'lucide-react';
import { GOAL_CATEGORIES } from '../../../utils/constants';
import type { Goal } from '../../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, 'id'>) => void;
}

const PRESETS = [
  { title: 'Save $10,000 Emergency Fund', category: 'Financial', targetValue: 10000, currentValue: 2500, unit: '$', progress: 25 },
  { title: 'Read 24 Leadership Books', category: 'Learning', targetValue: 24, currentValue: 6, unit: 'books', progress: 25 },
  { title: 'Run 100km Total Distance', category: 'Fitness', targetValue: 100, currentValue: 40, unit: 'km', progress: 40 },
  { title: 'Promote to Tech Lead', category: 'Career', targetValue: 100, currentValue: 60, unit: '%', progress: 60 },
  { title: 'Launch Side SaaS MVP', category: 'Personal', targetValue: 100, currentValue: 30, unit: '%', progress: 30 },
];

export default function GoalModal({ isOpen, onClose, onSubmit }: GoalModalProps) {
  const defaultDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // +90 days default

  const [formData, setFormData] = useState({
    title: '',
    category: 'Career',
    targetDate: defaultDate,
    progress: 0,
    targetValue: 100,
    currentValue: 0,
    unit: '%',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    // Calculate progress automatically from current / target if provided
    let calculatedProgress = formData.progress;
    if (formData.targetValue > 0 && formData.currentValue > 0) {
      calculatedProgress = Math.min(100, Math.round((formData.currentValue / formData.targetValue) * 100));
    }

    onSubmit({
      title: formData.title.trim(),
      category: formData.category,
      targetDate: formData.targetDate,
      progress: calculatedProgress,
      targetValue: Number(formData.targetValue),
      currentValue: Number(formData.currentValue),
      unit: formData.unit,
      status: calculatedProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
    });

    onClose();
  };

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setFormData({
      title: p.title,
      category: p.category,
      targetDate: defaultDate,
      progress: p.progress,
      targetValue: p.targetValue,
      currentValue: p.currentValue,
      unit: p.unit,
    });
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card">
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div
              className="modal-icon-badge planned"
              style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}
            >
              <Target size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">Set Strategic Milestone</h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: 16 }}>
          <label className="modal-field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} color="#6366f1" /> Preset Goal Inspiration
          </label>
          <div className="goal-presets-grid">
            {PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="goal-preset-chip"
              >
                + {p.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          {/* Title */}
          <div className="form-group-custom">
            <label className="modal-field-label">Milestone / Goal Title</label>
            <input
              type="text"
              placeholder="e.g. Save $10,000 Emergency Fund, Master System Architecture..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="modal-input-field"
              autoFocus
            />
          </div>

          {/* Category & Target Date */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="modal-field-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="modal-select-field"
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label className="modal-field-label">Target Completion Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="modal-input-field"
              />
            </div>
          </div>

          {/* Target Value, Current Value & Unit */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="modal-field-label">Target Goal Value</label>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="100"
                value={formData.targetValue}
                onChange={(e) =>
                  setFormData({ ...formData, targetValue: Number(e.target.value) })
                }
                className="modal-input-field"
              />
            </div>

            <div className="form-group-custom">
              <label className="modal-field-label">Unit of Measure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="modal-select-field"
              >
                <option value="%">% Percentage</option>
                <option value="$">$ USD / SAR</option>
                <option value="books">Books / Lessons</option>
                <option value="km">km Distance</option>
                <option value="hrs">Hours</option>
                <option value="items">Items / Deliverables</option>
              </select>
            </div>
          </div>

          <div className="modal-footer-actions" style={{ marginTop: 24 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Strategic Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
