import React, { useState, useEffect } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { PlannedRepayment, PlannedRepaymentStatus } from '../../types';

interface PlannedRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => void;
  existingCreditors?: string[];
  initialCreditor?: string;
}

export default function PlannedRepaymentModal({
  isOpen,
  onClose,
  onSubmit,
  existingCreditors = [],
  initialCreditor = ''
}: PlannedRepaymentModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    creditorName: initialCreditor,
    targetDate: today,
    plannedAmount: '',
    status: 'Scheduled' as PlannedRepaymentStatus,
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        creditorName: initialCreditor || '',
        targetDate: today,
        plannedAmount: '',
        status: 'Scheduled',
        notes: ''
      });
    }
  }, [isOpen, initialCreditor, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.creditorName.trim() || !form.plannedAmount || Number(form.plannedAmount) <= 0) return;

    onSubmit({
      creditorName: form.creditorName.trim(),
      targetDate: form.targetDate || today,
      plannedAmount: Math.abs(parseFloat(form.plannedAmount)),
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
            <div className="modal-icon-badge borrow">
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">Schedule Planned Repayment</h3>
              <div className="modal-subtitle-schema">Planned Debt Repayment in Indian Rupees (₹)</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          
          {/* Creditor Name with Suggestions */}
          <div className="form-group-custom">
            <label className="form-label-custom">Creditor / Person Name</label>
            <input
              type="text"
              list="repayment-creditor-suggestions"
              value={form.creditorName}
              onChange={e => setForm(prev => ({ ...prev, creditorName: e.target.value }))}
              placeholder="e.g. Akash"
              className="form-input-custom"
              required
              autoFocus
            />
            {existingCreditors.length > 0 && (
              <datalist id="repayment-creditor-suggestions">
                {existingCreditors.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
          </div>

          {/* Amount (₹ INR) & Target Date */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Planned Repayment (₹ INR)</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol-prefix">₹</span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={form.plannedAmount}
                  onChange={e => setForm(prev => ({ ...prev, plannedAmount: e.target.value }))}
                  placeholder="100.00"
                  className="form-input-custom input-with-prefix"
                  required
                />
              </div>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Target Repayment Date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={e => setForm(prev => ({ ...prev, targetDate: e.target.value }))}
                className="form-input-custom"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-group-custom">
            <label className="form-label-custom">Repayment Status</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as PlannedRepaymentStatus }))}
              className="form-input-custom select-custom"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid (Completed)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group-custom">
            <label className="form-label-custom">Notes / Installment Details (Optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. 1st installment, UPI payoff, salary day settlement"
              className="form-input-custom"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Planned Repayment
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
