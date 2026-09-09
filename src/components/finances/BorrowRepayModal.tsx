import React, { useState, useEffect } from 'react';
import { HandCoins, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { BorrowRepayRecord, BorrowRepayType } from '../../types';

interface BorrowRepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>) => void;
  existingCreditors?: string[];
  initialType?: BorrowRepayType;
  initialCreditor?: string;
}

export default function BorrowRepayModal({
  isOpen,
  onClose,
  onSubmit,
  existingCreditors = [],
  initialType = 'Borrow',
  initialCreditor = ''
}: BorrowRepayModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    creditorName: initialCreditor,
    date: today,
    type: initialType,
    amount: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        creditorName: initialCreditor || '',
        date: today,
        type: initialType,
        amount: '',
        notes: ''
      });
    }
  }, [isOpen, initialType, initialCreditor, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.creditorName.trim() || !form.amount || Number(form.amount) <= 0) return;

    onSubmit({
      creditorName: form.creditorName.trim(),
      date: form.date || today,
      type: form.type,
      amount: Math.abs(parseFloat(form.amount)),
      currency: 'INR',
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
            <div className={`modal-icon-badge ${form.type === 'Borrow' ? 'borrow' : 'repaid'}`}>
              <HandCoins size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">
                {form.type === 'Borrow' ? 'Log Borrowed Money' : 'Log Debt Repayment'}
              </h3>
              <div className="modal-subtitle-schema">Currency: Indian Rupee (INR ₹)</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          
          {/* Type Toggle: Borrow vs Repaid */}
          <div className="borrow-type-toggle-grid">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'Borrow' }))}
              className={`borrow-type-btn ${form.type === 'Borrow' ? 'active-borrow' : ''}`}
            >
              <ArrowDownLeft size={16} />
              <span>Borrow (Money Received)</span>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'Repaid' }))}
              className={`borrow-type-btn ${form.type === 'Repaid' ? 'active-repaid' : ''}`}
            >
              <ArrowUpRight size={16} />
              <span>Repaid (Money Returned)</span>
            </button>
          </div>

          {/* Creditor Name with Datalist Suggestions */}
          <div className="form-group-custom">
            <label className="form-label-custom">Creditor / Person Name</label>
            <input
              type="text"
              list="creditor-suggestions"
              value={form.creditorName}
              onChange={e => setForm(prev => ({ ...prev, creditorName: e.target.value }))}
              placeholder="e.g. Akash"
              className="form-input-custom"
              required
              autoFocus
            />
            {existingCreditors.length > 0 && (
              <datalist id="creditor-suggestions">
                {existingCreditors.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            )}
          </div>

          {/* Amount (INR ₹) & Date Grid */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">Amount (₹ INR)</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol-prefix">₹</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={form.amount}
                  onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="100.00"
                  className="form-input-custom input-with-prefix"
                  required
                />
              </div>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="form-input-custom"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group-custom">
            <label className="form-label-custom">Notes / Purpose (Optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. UPI transfer, personal short loan, dinner share"
              className="form-input-custom"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn ${form.type === 'Borrow' ? 'btn-primary' : 'btn-emerald-solid'}`}
            >
              Save {form.type === 'Borrow' ? 'Borrow Record' : 'Repayment'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
