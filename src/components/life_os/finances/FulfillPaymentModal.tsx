import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  X,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { PlannedExpense } from '../../../types';

interface FulfillPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlannedExpense | null;
  onSave: (id: string, isFulfilled: boolean, paidAmount: number) => void;
}

export type PaymentMode = 'full' | 'custom' | 'unpaid';

export default function FulfillPaymentModal({
  isOpen,
  onClose,
  plan,
  onSave
}: FulfillPaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [isFulfilled, setIsFulfilled] = useState<boolean>(true);
  const [paidAmountStr, setPaidAmountStr] = useState<string>('0');

  useEffect(() => {
    if (plan && isOpen) {
      const planned = Number(plan.plannedAmount) || 0;
      const fulfilled = plan.isFulfilled ?? (plan.status === 'Fulfilled');
      const currentPaid =
        plan.paidAmount !== undefined && plan.paidAmount !== null
          ? plan.paidAmount
          : fulfilled
          ? planned
          : 0;

      if (currentPaid > 0 && currentPaid >= planned && fulfilled) {
        setPaymentMode('full');
        setPaidAmountStr(String(currentPaid));
        setIsFulfilled(true);
      } else if (currentPaid > 0) {
        setPaymentMode('custom');
        setPaidAmountStr(String(currentPaid));
        setIsFulfilled(fulfilled);
      } else if (fulfilled) {
        setPaymentMode('full');
        setPaidAmountStr(String(planned));
        setIsFulfilled(true);
      } else {
        // Default to 'full' for convenience when fulfilling from unpaid,
        // but user can easily switch to custom or unpaid
        setPaymentMode('full');
        setPaidAmountStr(String(planned));
        setIsFulfilled(true);
      }
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const planned = Number(plan.plannedAmount) || 0;
  const currentPaidNum = Math.max(0, parseFloat(paidAmountStr) || 0);
  const isOverpaid = currentPaidNum > planned;
  const extraAmount = Math.max(0, currentPaidNum - planned);
  const remaining = Math.max(0, planned - currentPaidNum);

  const handleSelectMode = (mode: PaymentMode) => {
    setPaymentMode(mode);
    if (mode === 'full') {
      setPaidAmountStr(String(planned));
      setIsFulfilled(true);
    } else if (mode === 'unpaid') {
      setPaidAmountStr('0');
      setIsFulfilled(false);
    } else {
      // Custom mode: keep existing or seed with planned if 0
      if (!paidAmountStr || paidAmountStr === '0') {
        setPaidAmountStr(String(planned));
      }
    }
  };

  const handleApplyPreset = (ratio: number) => {
    const calculated = (planned * ratio).toFixed(2);
    setPaidAmountStr(calculated);
    if (ratio >= 1) {
      setIsFulfilled(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalPaid = 0;
    let finalFulfilled = false;

    if (paymentMode === 'full') {
      finalPaid = planned;
      finalFulfilled = true;
    } else if (paymentMode === 'unpaid') {
      finalPaid = 0;
      finalFulfilled = false;
    } else {
      finalPaid = Math.max(0, parseFloat(paidAmountStr) || 0);
      finalFulfilled = isFulfilled || (finalPaid > 0 && finalPaid >= planned);
    }

    onSave(plan.id, finalFulfilled, finalPaid);
    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card modal-content-card-fulfill">
        {/* Modal Header */}
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div
              className={`modal-icon-badge ${
                paymentMode === 'unpaid'
                  ? 'pending-badge'
                  : isOverpaid
                  ? 'overpaid-badge'
                  : 'fulfilled-badge'
              }`}
            >
              {paymentMode === 'unpaid' ? (
                <RotateCcw size={22} />
              ) : isOverpaid ? (
                <AlertCircle size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
            </div>
            <div>
              <h3 className="modal-title-main">Record Expense Fulfillment</h3>
              <div className="modal-subtitle-schema">
                Choose Full Payment or specify a Customized Payment amount
              </div>
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
              {plan.category && (
                <span className="badge badge-category-soft">{plan.category}</span>
              )}
            </div>
            <div className="fulfill-summary-row">
              <span className="fulfill-summary-lbl">Planned Budget:</span>
              <span className="fulfill-summary-val font-semibold">
                SAR {planned.toFixed(2)}
              </span>
            </div>
            <div className="fulfill-summary-row">
              <span className="fulfill-summary-lbl">Target Period:</span>
              <span className="fulfill-summary-sub">
                {plan.month} {plan.year}
              </span>
            </div>
          </div>

          {/* Payment Type Selection: 3 Options */}
          <div className="form-group-custom">
            <label className="form-label-custom">
              How much did you pay for this expense?
            </label>
            <div className="fulfill-mode-selector-grid">
              {/* Option 1: Full Payment */}
              <button
                type="button"
                onClick={() => handleSelectMode('full')}
                className={`fulfill-mode-card ${
                  paymentMode === 'full' ? 'active-full' : ''
                }`}
              >
                <div className="fulfill-mode-icon-wrap emerald">
                  <CheckCircle2 size={20} />
                </div>
                <div className="fulfill-mode-details">
                  <div className="fulfill-mode-title-row">
                    <span className="fulfill-mode-title">Full Payment</span>
                    <span className="badge badge-emerald-subtle">100%</span>
                  </div>
                  <span className="fulfill-mode-amount">
                    SAR {planned.toFixed(2)}
                  </span>
                  <span className="fulfill-mode-desc">
                    Pay entire budgeted amount
                  </span>
                </div>
              </button>

              {/* Option 2: Customized Payment */}
              <button
                type="button"
                onClick={() => handleSelectMode('custom')}
                className={`fulfill-mode-card ${
                  paymentMode === 'custom' ? 'active-custom' : ''
                }`}
              >
                <div className="fulfill-mode-icon-wrap amber">
                  <SlidersHorizontal size={20} />
                </div>
                <div className="fulfill-mode-details">
                  <div className="fulfill-mode-title-row">
                    <span className="fulfill-mode-title">Customized Payment</span>
                    <span className="badge badge-amber-subtle">Custom</span>
                  </div>
                  <span className="fulfill-mode-amount">
                    {paymentMode === 'custom' && currentPaidNum > 0
                      ? `SAR ${currentPaidNum.toFixed(2)}`
                      : 'Any Amount'}
                  </span>
                  <span className="fulfill-mode-desc">
                    Partial or customized payment
                  </span>
                </div>
              </button>

              {/* Option 3: Unpaid / Reset */}
              <button
                type="button"
                onClick={() => handleSelectMode('unpaid')}
                className={`fulfill-mode-card ${
                  paymentMode === 'unpaid' ? 'active-unpaid' : ''
                }`}
              >
                <div className="fulfill-mode-icon-wrap rose">
                  <RotateCcw size={20} />
                </div>
                <div className="fulfill-mode-details">
                  <div className="fulfill-mode-title-row">
                    <span className="fulfill-mode-title">Unpaid / Reset</span>
                    <span className="badge badge-rose-subtle">SAR 0</span>
                  </div>
                  <span className="fulfill-mode-amount">SAR 0.00</span>
                  <span className="fulfill-mode-desc">
                    Mark as pending / not paid
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Mode 1: Full Payment Confirmation Banner */}
          {paymentMode === 'full' && (
            <div className="fulfill-complete-banner">
              <CheckCircle2 size={22} className="banner-icon" />
              <div>
                <strong>Full Payment of SAR {planned.toFixed(2)} Selected</strong>
                <p>
                  This expense will be recorded as 100% paid and marked as
                  Fulfilled on schedule.
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: Customized Payment Section */}
          {paymentMode === 'custom' && (
            <div className="fulfill-custom-section">
              <div className="form-group-custom">
                <div className="fulfill-paid-label-row">
                  <label className="form-label-custom">
                    Actual Amount Paid (SAR)
                  </label>
                  {isOverpaid ? (
                    <span className="fulfill-extra-hint">
                      +SAR {extraAmount.toFixed(2)} Extra (Over Budget)
                    </span>
                  ) : remaining > 0 ? (
                    <span className="fulfill-remaining-hint">
                      Remaining: <strong>SAR {remaining.toFixed(2)}</strong>
                    </span>
                  ) : (
                    <span className="fulfill-remaining-hint text-emerald">
                      ✓ Full Budget Paid
                    </span>
                  )}
                </div>

                <div className="input-prefix-container">
                  <span className="input-prefix-tag">SAR</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={paidAmountStr}
                    onChange={e => setPaidAmountStr(e.target.value)}
                    placeholder="0.00"
                    className={`form-input-custom input-with-prefix ${
                      isOverpaid ? 'input-overpaid' : ''
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Percentage Presets */}
              <div className="fulfill-preset-chips-row">
                <span className="preset-label">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.25)}
                  className="btn-preset"
                  title="25% of planned budget"
                >
                  25% (SAR {(planned * 0.25).toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.5)}
                  className="btn-preset"
                  title="50% of planned budget"
                >
                  50% (SAR {(planned * 0.5).toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.75)}
                  className="btn-preset"
                  title="75% of planned budget"
                >
                  75% (SAR {(planned * 0.75).toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1)}
                  className="btn-preset preset-full"
                  title="100% of planned budget"
                >
                  100% (SAR {planned.toFixed(0)})
                </button>
              </div>

              {/* Real-time Dynamic Feedback Banner */}
              {isOverpaid ? (
                <div className="fulfill-extra-banner">
                  <AlertCircle size={20} className="banner-icon text-amber" />
                  <div>
                    <strong>
                      Over Planned Budget by +SAR {extraAmount.toFixed(2)} Extra!
                    </strong>
                    <p>
                      You planned SAR {planned.toFixed(2)} and recorded SAR{' '}
                      {currentPaidNum.toFixed(2)}. The extra spending will be tracked
                      accurately.
                    </p>
                  </div>
                </div>
              ) : currentPaidNum > 0 && currentPaidNum < planned ? (
                <div className="fulfill-status-preview-box">
                  <div className="preview-row">
                    <span>Payment Progress:</span>
                    <span className="badge badge-amber">
                      Partially Paid ({Math.round((currentPaidNum / planned) * 100)}
                      %)
                    </span>
                  </div>
                  <div className="preview-row">
                    <span>Amount Paid:</span>
                    <span className="preview-val-paid">
                      SAR {currentPaidNum.toFixed(2)}
                    </span>
                  </div>
                  <div className="preview-row">
                    <span>Remaining Balance:</span>
                    <span className="preview-val-remaining">
                      SAR {remaining.toFixed(2)}
                    </span>
                  </div>

                  {/* Manual Mark Complete Option for partial settlements */}
                  <div className="fulfill-complete-toggle-row">
                    <label className="fulfill-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isFulfilled}
                        onChange={e => setIsFulfilled(e.target.checked)}
                      />
                      <span>
                        Mark status as complete / settled despite partial payment
                      </span>
                    </label>
                  </div>
                </div>
              ) : currentPaidNum === planned && planned > 0 ? (
                <div className="fulfill-complete-banner">
                  <CheckCircle2 size={20} className="banner-icon" />
                  <div>
                    <strong>Full Budget Paid (SAR {planned.toFixed(2)})</strong>
                    <p>Matches planned budget exactly.</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Mode 3: Unpaid / Reset Confirmation Banner */}
          {paymentMode === 'unpaid' && (
            <div className="fulfill-unpaid-banner">
              <RotateCcw size={20} className="banner-icon" />
              <div>
                <strong>Payment Reset to SAR 0.00</strong>
                <p>
                  This expense objective will be marked as Pending / Unfulfilled.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="modal-actions-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {paymentMode === 'full'
                ? `Save Full Payment (SAR ${planned.toFixed(2)})`
                : paymentMode === 'unpaid'
                ? 'Reset to Unpaid'
                : `Save Payment (SAR ${currentPaidNum.toFixed(2)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
