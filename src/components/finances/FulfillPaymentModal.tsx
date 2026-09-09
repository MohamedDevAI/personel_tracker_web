import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, X, DollarSign, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { PlannedExpense } from '../../types';

interface FulfillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlannedExpense | null;
  onSave: (id: string, isFulfilled: boolean, paidAmount: number) => void;
}

export default function FulfillPaymentModal({
  isOpen,
  onClose,
  plan,
  onSave
}: FulfillPaymentModalProps) {
  const [isFulfilled, setIsFulfilled] = useState<boolean>(false);
  const [paidAmountStr, setPaidAmountStr] = useState<string>('0');

  useEffect(() => {
    if (plan) {
      const fulfilled = plan.isFulfilled ?? (plan.status === 'Fulfilled');
      setIsFulfilled(fulfilled);
      const currentPaid = plan.paidAmount !== undefined 
        ? plan.paidAmount 
        : (fulfilled ? plan.plannedAmount : 0);
      setPaidAmountStr(String(currentPaid));
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const planned = Number(plan.plannedAmount) || 0;
  const currentPaidNum = Math.max(0, parseFloat(paidAmountStr) || 0);
  const remaining = Math.max(0, planned - currentPaidNum);

  const handleToggleFulfilled = (fulfilled: boolean) => {
    setIsFulfilled(fulfilled);
    if (fulfilled) {
      setPaidAmountStr(String(planned));
    } else {
      // If was full, reset to 0 or keep partial
      if (currentPaidNum >= planned) {
        setPaidAmountStr('0');
      }
    }
  };

  const handlePresetPercentage = (pct: number) => {
    const amt = Math.round((planned * pct) * 100) / 100;
    setPaidAmountStr(String(amt));
    if (pct >= 1) {
      setIsFulfilled(true);
    } else {
      setIsFulfilled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPaid = isFulfilled ? planned : Math.min(planned, currentPaidNum);
    const finalFulfilled = isFulfilled || finalPaid >= planned;
    onSave(plan.id, finalFulfilled, finalPaid);
    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card modal-content-card-fulfill">
        
        {/* Modal Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div className={`modal-icon-badge ${isFulfilled ? 'fulfilled-badge' : 'pending-badge'}`}>
              {isFulfilled ? <CheckCircle2 size={22} /> : <Clock size={22} />}
            </div>
            <div>
              <h3 className="modal-title-main">Fulfillment & Payment</h3>
              <div className="modal-subtitle-schema">Track if fulfilled or how much you paid (in SAR)</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          
          {/* Plan Summary Card */}
          <div className="fulfill-summary-card">
            <div className="fulfill-summary-top">
              <div className="fulfill-item-title">{plan.title}</div>
              <span className="badge badge-category-soft">{plan.category}</span>
            </div>
            <div className="fulfill-summary-row">
              <span className="fulfill-summary-lbl">Planned Budget:</span>
              <span className="fulfill-summary-val">SAR {planned.toFixed(2)}</span>
            </div>
            <div className="fulfill-summary-row">
              <span className="fulfill-summary-lbl">Target Period:</span>
              <span className="fulfill-summary-sub">{plan.month} {plan.year}</span>
            </div>
          </div>

          {/* Question 1: Fulfilled or Not? */}
          <div className="form-group-custom">
            <label className="form-label-custom">Is this expense fulfilled?</label>
            <div className="fulfill-toggle-buttons">
              <button
                type="button"
                onClick={() => handleToggleFulfilled(true)}
                className={`fulfill-toggle-btn ${isFulfilled ? 'active-yes' : ''}`}
              >
                <CheckCircle2 size={18} />
                <span>Yes, Fulfilled</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleFulfilled(false)}
                className={`fulfill-toggle-btn ${!isFulfilled ? 'active-no' : ''}`}
              >
                <Clock size={18} />
                <span>No, Not Fulfilled</span>
              </button>
            </div>
          </div>

          {/* Question 2: If not fulfilled, How much I paid? */}
          {!isFulfilled && (
            <div className="fulfill-unfulfilled-section">
              <div className="form-group-custom">
                <div className="fulfill-paid-label-row">
                  <label className="form-label-custom">How much did you pay so far?</label>
                  <span className="fulfill-remaining-hint">
                    Remaining: <strong>SAR {remaining.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="input-prefix-container">
                  <span className="input-prefix-tag">SAR</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={planned}
                    value={paidAmountStr}
                    onChange={e => setPaidAmountStr(e.target.value)}
                    placeholder="0.00"
                    className="form-input-custom input-with-prefix"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="fulfill-presets-row">
                <button
                  type="button"
                  onClick={() => handlePresetPercentage(0)}
                  className="btn-preset"
                >
                  Unpaid (0)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPercentage(0.25)}
                  className="btn-preset"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPercentage(0.5)}
                  className="btn-preset"
                >
                  50% (Half)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetPercentage(0.75)}
                  className="btn-preset"
                >
                  75%
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleFulfilled(true)}
                  className="btn-preset preset-full"
                >
                  100% (Full)
                </button>
              </div>

              {/* Live Status Preview */}
              <div className="fulfill-status-preview-box">
                <div className="preview-row">
                  <span>Status:</span>
                  <span className={`badge ${currentPaidNum > 0 ? 'badge-amber' : 'badge-subtle'}`}>
                    {currentPaidNum > 0 ? `Partially Paid (${Math.round((currentPaidNum / planned) * 100)}%)` : 'Not Fulfilled (Unpaid)'}
                  </span>
                </div>
                <div className="preview-row">
                  <span>Paid so far:</span>
                  <span className="preview-val-paid">SAR {currentPaidNum.toFixed(2)}</span>
                </div>
                <div className="preview-row">
                  <span>Balance Due:</span>
                  <span className="preview-val-remaining">SAR {remaining.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {isFulfilled && (
            <div className="fulfill-complete-banner">
              <CheckCircle2 size={20} className="banner-icon" />
              <div>
                <strong>Marked as Complete!</strong>
                <p>All SAR {planned.toFixed(2)} has been recorded as paid in full.</p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Fulfillment
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
