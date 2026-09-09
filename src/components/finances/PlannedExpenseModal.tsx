import React, { useState, useEffect } from 'react';
import { Target, X, CheckCircle2, Clock } from 'lucide-react';
import { Category, PlannedExpense, PlannedExpenseStatus } from '../../types';
import { MONTH_NAMES } from '../../services/expenseApi';

interface PlannedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: Omit<PlannedExpense, 'id' | 'createdAt'>) => void;
  categories?: Category[];
  initialMonth?: string;
  initialYear?: number;
  initialPlan?: PlannedExpense | null;
}

export default function PlannedExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  initialMonth = 'Jul',
  initialYear = 2026,
  initialPlan = null
}: PlannedExpenseModalProps) {
  const [form, setForm] = useState({
    title: '',
    category: categories[0]?.name || 'Grocery',
    month: initialMonth,
    year: initialYear,
    plannedAmount: '',
    paidAmount: '0',
    isFulfilled: false,
    dueDate: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        const fulfilled = initialPlan.isFulfilled ?? (initialPlan.status === 'Fulfilled');
        setForm({
          title: initialPlan.title,
          category: initialPlan.category,
          month: initialPlan.month,
          year: initialPlan.year,
          plannedAmount: String(initialPlan.plannedAmount),
          paidAmount: String(initialPlan.paidAmount ?? (fulfilled ? initialPlan.plannedAmount : 0)),
          isFulfilled: fulfilled,
          dueDate: initialPlan.dueDate || '',
          notes: initialPlan.notes || ''
        });
      } else {
        setForm({
          title: '',
          category: categories[0]?.name || 'Grocery',
          month: initialMonth,
          year: initialYear,
          plannedAmount: '',
          paidAmount: '0',
          isFulfilled: false,
          dueDate: '',
          notes: ''
        });
      }
    }
  }, [isOpen, initialPlan, initialMonth, initialYear, categories]);

  if (!isOpen) return null;

  const plannedNum = Math.max(0, parseFloat(form.plannedAmount) || 0);
  const paidNum = Math.max(0, parseFloat(form.paidAmount) || 0);
  const remaining = Math.max(0, plannedNum - (form.isFulfilled ? plannedNum : paidNum));

  const handleToggleFulfilled = (fulfilled: boolean) => {
    setForm(prev => ({
      ...prev,
      isFulfilled: fulfilled,
      paidAmount: fulfilled ? prev.plannedAmount : (paidNum >= plannedNum ? '0' : prev.paidAmount)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category || !form.plannedAmount || Number(form.plannedAmount) <= 0) return;

    const plannedAmt = Math.abs(parseFloat(form.plannedAmount));
    const paidAmt = form.isFulfilled ? plannedAmt : Math.max(0, parseFloat(form.paidAmount) || 0);
    const finalFulfilled = form.isFulfilled || paidAmt >= plannedAmt;
    const finalStatus: PlannedExpenseStatus = finalFulfilled 
      ? 'Fulfilled' 
      : (paidAmt > 0 ? 'Partial' : 'Planned');

    onSubmit({
      title: form.title.trim(),
      category: form.category,
      month: form.month,
      year: Number(form.year),
      plannedAmount: plannedAmt,
      paidAmount: paidAmt,
      isFulfilled: finalFulfilled,
      dueDate: form.dueDate || undefined,
      status: finalStatus,
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
              <h3 className="modal-title-main">
                {initialPlan ? 'Edit Planned Expense' : 'Add Planned Expense'}
              </h3>
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
            <label className="form-label-custom">Expense Title / Item</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Laptop, Tabby, Bakala..."
              className="form-input-custom"
              required
              autoFocus
            />
          </div>

          {/* Category & Planned Amount */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="form-input-custom select-custom"
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
                  min="0.01"
                  value={form.plannedAmount}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      plannedAmount: val,
                      paidAmount: prev.isFulfilled ? val : prev.paidAmount
                    }));
                  }}
                  placeholder="748.17"
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

          {/* Fulfillment Option */}
          <div className="fulfill-section-box">
            <label className="form-label-custom">Is this expense fulfilled?</label>
            <div className="fulfill-toggle-buttons">
              <button
                type="button"
                onClick={() => handleToggleFulfilled(false)}
                className={`fulfill-toggle-btn ${!form.isFulfilled ? 'active-no' : ''}`}
              >
                <Clock size={16} />
                <span>No, Not Fulfilled</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleFulfilled(true)}
                className={`fulfill-toggle-btn ${form.isFulfilled ? 'active-yes' : ''}`}
              >
                <CheckCircle2 size={16} />
                <span>Yes, Complete / Fulfilled</span>
              </button>
            </div>

            {/* If Not Fulfilled: How much I paid */}
            {!form.isFulfilled ? (
              <div className="fulfill-partial-input-wrap">
                <div className="fulfill-paid-label-row">
                  <label className="form-label-custom">If not, how much did you pay? (SAR)</label>
                  <span className="fulfill-remaining-hint">
                    Remaining: <strong>SAR {remaining.toFixed(2)}</strong>
                  </span>
                </div>
                <div className="currency-input-wrap">
                  <span className="currency-symbol-prefix">SAR</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={plannedNum || undefined}
                    value={form.paidAmount}
                    onChange={e => setForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                    placeholder="0.00"
                    className="form-input-custom input-with-prefix"
                  />
                </div>
              </div>
            ) : (
              <div className="fulfill-quick-note">
                ✓ Recorded as 100% complete (Paid SAR {plannedNum.toFixed(2)})
              </div>
            )}
          </div>

          {/* Due Date (Optional) */}
          <div className="form-group-custom">
            <label className="form-label-custom">Expected Due Date (Optional)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              className="form-input-custom"
            />
          </div>

          {/* Notes */}
          <div className="form-group-custom">
            <label className="form-label-custom">Notes (Optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Tabby installment, Bakala groceries, etc."
              className="form-input-custom"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialPlan ? 'Save Changes' : 'Save Planned Expense'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
