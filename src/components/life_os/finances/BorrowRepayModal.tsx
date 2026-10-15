import React, { useState, useEffect } from 'react';
import { HandCoins, ArrowDownLeft, ArrowUpRight, CheckCircle2, X } from 'lucide-react';
import { BorrowRepayRecord, BorrowRepayType } from '../../../types';
import { getLocalDateISO } from '../../../utils/dateHelpers';

interface BorrowRepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>, id?: string) => void;
  existingCreditors?: string[];
  initialType?: BorrowRepayType;
  initialCreditor?: string;
  initialRecord?: BorrowRepayRecord | null;
}

export default function BorrowRepayModal({
  isOpen,
  onClose,
  onSubmit,
  existingCreditors = [],
  initialType = 'Borrow',
  initialCreditor = '',
  initialRecord = null
}: BorrowRepayModalProps) {
  const today = getLocalDateISO();

  const [form, setForm] = useState({
    creditorName: initialCreditor,
    date: today,
    type: initialType,
    amount: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        setForm({
          creditorName: initialRecord.creditorName || '',
          date: initialRecord.date || today,
          type: initialRecord.type,
          amount: String(initialRecord.amount || ''),
          notes: initialRecord.notes || ''
        });
      } else {
        setForm({
          creditorName: initialCreditor || '',
          date: today,
          type: initialType,
          amount: '',
          notes: ''
        });
      }
    }
  }, [isOpen, initialType, initialCreditor, initialRecord, today]);

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
    }, initialRecord?.id);

    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card">

        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div className={`modal-icon-badge ${form.type === 'Borrow'
                ? 'borrow'
                : form.type === 'Credit Given'
                  ? 'credit-given'
                  : form.type === 'Credit Repaid'
                    ? 'credit-repaid'
                    : 'repaid'
              }`}>
              <HandCoins size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">
                {initialRecord ? (
                  form.type === 'Borrow'
                    ? 'Edit Borrowed Money'
                    : form.type === 'Credit Given'
                      ? 'Edit Credit Given'
                      : form.type === 'Credit Repaid'
                        ? 'Edit Repayment Received'
                        : 'Edit Debt Repayment'
                ) : (
                  form.type === 'Borrow'
                    ? 'Log Borrowed Money'
                    : form.type === 'Credit Given'
                      ? 'Log Credit Given (Money Lent)'
                      : form.type === 'Credit Repaid'
                        ? 'Log Repayment Received (He Repaid Me)'
                        : 'Log Debt Repayment '
                )}
              </h3>
              <div className="modal-subtitle-schema">Currency: Indian Rupee (INR ₹)</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">

          {/* Type Toggle: 4-Way Grid (Borrow vs I Repaid vs Credit Given vs Repaid to Me) */}
          <div className="borrow-type-toggle-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'Borrow' }))}
              className={`borrow-type-btn ${form.type === 'Borrow' ? 'active-borrow' : ''}`}
            >
              <ArrowDownLeft size={16} />
              <span>Borrow</span>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'Repaid' }))}
              className={`borrow-type-btn ${form.type === 'Repaid' ? 'active-repaid' : ''}`}
            >
              <ArrowUpRight size={16} />
              <span>I Repaid</span>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'Credit Given' }))}
              className={`borrow-type-btn ${form.type === 'Credit Given' ? 'active-credit' : ''}`}
            >
              <HandCoins size={16} />
              <span>Credit Given </span>
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, type: 'Credit Repaid' }))}
              className={`borrow-type-btn ${form.type === 'Credit Repaid' ? 'active-credit-repaid' : ''}`}
            >
              <CheckCircle2 size={16} />
              <span>Repaid to Me </span>
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

          {/* Action Buttons */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${form.type === 'Borrow'
                  ? 'btn-primary'
                  : form.type === 'Credit Given'
                    ? 'btn-credit-given-action'
                    : 'btn-emerald-solid'
                }`}
              style={
                form.type === 'Credit Given'
                  ? {
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                    fontWeight: 600
                  }
                  : form.type === 'Credit Repaid'
                    ? {
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      fontWeight: 600
                    }
                    : undefined
              }
            >
              {initialRecord ? 'Update' : 'Save'} {
                form.type === 'Borrow'
                  ? 'Borrow Record'
                  : form.type === 'Credit Given'
                    ? 'Credit Record'
                    : form.type === 'Credit Repaid'
                      ? 'Repayment Received'
                      : 'Repayment'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
