import React, { useState, useEffect } from 'react';
import { Target, X } from 'lucide-react';
import { Category, PlannedExpense, PlannedExpenseStatus } from '../../types';
import { MONTH_NAMES } from '../../services/expenseApi';

interface PlannedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: Omit<PlannedExpense, 'id' | 'createdAt'>) => void;
  categories?: Category[];
  initialMonth?: string;
  initialYear?: number;
}

export default function PlannedExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  initialMonth = 'Mar',
  initialYear = 2026
}: PlannedExpenseModalProps) {
  const [form, setForm] = useState({
    title: '',
    category: categories[0]?.name || 'Grocery',
    month: initialMonth,
    year: initialYear,
    plannedAmount: '',
    dueDate: '',
    status: 'Planned' as PlannedExpenseStatus,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: '',
        category: categories[0]?.name || 'Grocery',
        month: initialMonth,
        year: initialYear,
        plannedAmount: '',
        dueDate: '',
        status: 'Planned',
        notes: ''
      });
    }
  }, [isOpen, initialMonth, initialYear, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category || !form.plannedAmount || Number(form.plannedAmount) <= 0) return;

    onSubmit({
      title: form.title.trim(),
      category: form.category,
      month: form.month,
      year: Number(form.year),
      plannedAmount: Math.abs(parseFloat(form.plannedAmount)),
      dueDate: form.dueDate || undefined,
      status: form.status,
      notes: form.notes.trim()
    });

    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card">
        
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div className="modal-icon-badge planned">
              <Target size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">Add Planned Expense</h3>
              <div className="modal-subtitle-schema">Budget Planning in Saudi Riyals (SAR)</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          
          {/* Title */}
          <div className="form-group-custom">
            <label className="form-label-custom">Expense Title / Objective</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Monthly Grocery & Provisions"
              className="form-input-custom"
              required
              autoFocus
            />
          </div>

          {/* Category & Planned Amount */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Category (MongoDB)</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="form-input-custom select-custom"
                required
              >
                {categories.map(c => (
                  <option key={c.id || c._id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Planned Amount (SAR)</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol-prefix">SAR</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={form.plannedAmount}
                  onChange={e => setForm(prev => ({ ...prev, plannedAmount: e.target.value }))}
                  placeholder="1500"
                  className="form-input-custom input-with-prefix"
                  required
                />
              </div>
            </div>
          </div>

          {/* Month & Year Grid */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Target Month</label>
              <select
                value={form.month}
                onChange={e => setForm(prev => ({ ...prev, month: e.target.value }))}
                className="form-input-custom select-custom"
              >
                {MONTH_NAMES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Year</label>
              <select
                value={form.year}
                onChange={e => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                className="form-input-custom select-custom"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* Due Date & Status */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Expected Due Date (Optional)</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                className="form-input-custom"
              />
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as PlannedExpenseStatus }))}
                className="form-input-custom select-custom"
              >
                <option value="Planned">Planned</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group-custom">
            <label className="form-label-custom">Notes (Optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Needs approval or quarterly allocation"
              className="form-input-custom"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Planned Expense
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
