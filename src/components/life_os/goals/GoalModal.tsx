import React, { useState, useEffect } from 'react';
import { Target, X, Edit3 } from 'lucide-react';
import { GOAL_CATEGORIES } from '../../../utils/constants';
import type { Goal } from '../../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, 'id'> | Goal) => void;
  initialGoal?: Goal | null;
}

export default function GoalModal({ isOpen, onClose, onSubmit, initialGoal }: GoalModalProps) {
  const isEditing = Boolean(initialGoal);

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

  useEffect(() => {
    if (initialGoal) {
      const tgt = (initialGoal.targetValue !== undefined && initialGoal.targetValue > 0)
        ? initialGoal.targetValue
        : 100;
      const cur = (initialGoal.currentValue !== undefined && initialGoal.currentValue > 0)
        ? initialGoal.currentValue
        : (tgt > 0 ? Math.round(((initialGoal.progress || 0) / 100) * tgt) : 0);

      setFormData({
        title: initialGoal.title || '',
        category: initialGoal.category || 'Career',
        targetDate: initialGoal.targetDate || defaultDate,
        progress: initialGoal.progress ?? 0,
        targetValue: tgt,
        currentValue: cur,
        unit: initialGoal.unit || '%',
      });
    } else {
      setFormData({
        title: '',
        category: 'Career',
        targetDate: defaultDate,
        progress: 0,
        targetValue: 100,
        currentValue: 0,
        unit: '%',
      });
    }
  }, [initialGoal, isOpen, defaultDate]);

  if (!isOpen) return null;

  // Handlers for bidirectional synchronization
  const handleTargetChange = (val: number) => {
    const newTarget = Math.max(0, val);
    const newCurrent = Math.round(((formData.progress || 0) / 100) * newTarget);
    setFormData((prev) => ({
      ...prev,
      targetValue: newTarget,
      currentValue: newCurrent,
    }));
  };

  const handleCurrentChange = (val: number) => {
    const newCurrent = Math.max(0, val);
    let newProgress = formData.progress;
    if (formData.targetValue > 0) {
      newProgress = Math.min(100, Math.max(0, Math.round((newCurrent / formData.targetValue) * 100)));
    }
    setFormData((prev) => ({
      ...prev,
      currentValue: newCurrent,
      progress: newProgress,
    }));
  };

  const handleProgressChange = (val: number) => {
    const newProgress = Math.min(100, Math.max(0, val));
    const newCurrent = formData.targetValue > 0
      ? Math.round((newProgress / 100) * formData.targetValue)
      : formData.currentValue;

    setFormData((prev) => ({
      ...prev,
      progress: newProgress,
      currentValue: newCurrent,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const progress = Math.min(100, Math.max(0, Number(formData.progress) || 0));
    const status = progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

    const goalPayload = {
      ...(initialGoal ? initialGoal : {}),
      title: formData.title.trim(),
      category: formData.category,
      targetDate: formData.targetDate,
      progress,
      targetValue: Number(formData.targetValue) || 0,
      currentValue: Number(formData.currentValue) || 0,
      unit: formData.unit,
      status,
    };

    onSubmit(goalPayload);
    onClose();
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
              {isEditing ? <Edit3 size={20} /> : <Target size={20} />}
            </div>
            <div>
              <h3 className="modal-title-main">
                {isEditing ? 'Edit Strategic Milestone' : 'Set Strategic Milestone'}
              </h3>
              <p className="modal-subtitle-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {isEditing ? 'Modify parameters, target deadlines, and progress metrics.' : 'Define measurable executive goals and tracking milestones.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          {/* Title */}
          <div className="form-group-custom">
            <label className="modal-field-label">Milestone / Goal Title</label>
            <input
              type="text"
              placeholder="e.g. Save SAR 10,000 Emergency Fund, ₹5,00,000 Portfolio, Master System Architecture..."
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
                {!GOAL_CATEGORIES.includes(formData.category as any) && formData.category && (
                  <option value={formData.category}>{formData.category}</option>
                )}
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

          {/* Target Value, Current Value */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="modal-field-label">Target Goal Value</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="100"
                value={formData.targetValue}
                onChange={(e) => handleTargetChange(parseFloat(e.target.value) || 0)}
                className="modal-input-field"
              />
            </div>

            <div className="form-group-custom">
              <label className="modal-field-label">Current Progress Value</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={formData.currentValue}
                onChange={(e) => handleCurrentChange(parseFloat(e.target.value) || 0)}
                className="modal-input-field"
              />
            </div>
          </div>

          {/* Unit & Progress % Slider Row */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="modal-field-label">Unit of Measure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="modal-select-field"
              >
                <option value="%">% Percentage</option>
                <option value="SAR">SAR (Saudi Riyal)</option>
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="books">Books / Lessons</option>
                <option value="km">km Distance</option>
                <option value="hrs">Hours</option>
                <option value="items">Items / Deliverables</option>
                {formData.unit && !['%', 'SAR', 'INR', 'books', 'km', 'hrs', 'items'].includes(formData.unit) && (
                  <option value={formData.unit}>{formData.unit}</option>
                )}
              </select>
            </div>

            <div className="form-group-custom">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="modal-field-label">Completion Progress</label>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: formData.progress >= 100 ? '#34d399' : '#818cf8' }}>
                  {formData.progress}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: '#6366f1',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => handleProgressChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="modal-input-field"
                    style={{ width: 60, padding: '4px 6px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer-actions" style={{ marginTop: 24 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update Strategic Milestone' : 'Save Strategic Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
