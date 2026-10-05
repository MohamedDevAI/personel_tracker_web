import React from 'react';
import { CalendarClock, RefreshCw, Check, X } from 'lucide-react';

interface AddFormState {
  creditorName: string;
  targetDate: string;
  plannedAmount: string;
  status: 'Completed' | 'In-Completed';
  notes: string;
}

interface GlanceAddModalProps {
  isOpen: boolean;
  addForm: AddFormState;
  uniqueCreditors: string[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: AddFormState) => AddFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function GlanceAddModal({
  isOpen, addForm, uniqueCreditors, isSaving, onClose, onFormChange, onSubmit
}: GlanceAddModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card" style={{ maxWidth: 480 }}>
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div className="modal-icon-badge borrow"><CalendarClock size={20} /></div>
            <div>
              <h3 className="modal-title-main">Add Planned Repayment</h3>
              <div className="modal-subtitle-schema">Add a new scheduled repayment item</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-form-vertical">
          <div className="form-group-custom">
            <label className="form-label-custom">Creditor / Person Name</label>
            <input
              type="text"
              list="glance-creditor-suggestions"
              value={addForm.creditorName}
              onChange={e => onFormChange(prev => ({ ...prev, creditorName: e.target.value }))}
              placeholder="e.g. Credit Card, Dad, Fazeeth, Akash"
              className="form-input-custom"
              required
              autoFocus
            />
            {uniqueCreditors.length > 0 && (
              <datalist id="glance-creditor-suggestions">
                {uniqueCreditors.map(c => <option key={c} value={c} />)}
              </datalist>
            )}
          </div>

          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Planned Amount (₹ INR)</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol-prefix">₹</span>
                <input
                  type="number" step="any" min="1"
                  value={addForm.plannedAmount}
                  onChange={e => onFormChange(prev => ({ ...prev, plannedAmount: e.target.value }))}
                  placeholder="10000.00"
                  className="form-input-custom input-with-prefix"
                  required
                />
              </div>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Scheduled Target Date</label>
              <input
                type="date"
                value={addForm.targetDate}
                onChange={e => onFormChange(prev => ({ ...prev, targetDate: e.target.value }))}
                className="form-input-custom"
                required
              />
            </div>
          </div>

          <div className="form-group-custom">
            <label className="form-label-custom">Initial Repayment Status</label>
            <select
              value={addForm.status}
              onChange={e => onFormChange(prev => ({ ...prev, status: e.target.value as any }))}
              className="form-input-custom select-custom"
            >
              <option value="In-Completed">In-Completed (Pending Schedule)</option>
              <option value="Completed">Completed (Already Fulfilled)</option>
            </select>
          </div>

          <div className="form-group-custom">
            <label className="form-label-custom">Notes / Installment Details (Optional)</label>
            <input
              type="text"
              value={addForm.notes}
              onChange={e => onFormChange(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. 2nd installment, UPI transfer, salary day settlement"
              className="form-input-custom"
            />
          </div>

          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSaving ? <RefreshCw size={14} className="spin-icon" /> : <Check size={14} />}
              <span>Save to Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
