import React, { useState, useEffect, useMemo } from 'react';
import { Target, X, Repeat, ArrowRight } from 'lucide-react';
import { Category, PlannedExpense, PlannedExpenseStatus } from '../../../../types';
import {
  MONTH_NAMES,
  getCurrentMonth,
  getCurrentYear,
  getMonthIndex,
  computeRecurringMonths
} from '../../../../utils/dateHelpers';
import { formatSAR } from '../../../../utils/formatters';

interface PlannedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: Omit<PlannedExpense, 'id' | 'createdAt'> | Omit<PlannedExpense, 'id' | 'createdAt'>[]) => void;
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
  initialMonth = getCurrentMonth(),
  initialYear = getCurrentYear(),
  initialPlan = null
}: PlannedExpenseModalProps) {
  // Use categories from Expense Tracked (Debit / Expense categories)
  const expenseCategories = React.useMemo(() => {
    const debits = categories.filter(c => !c.type || String(c.type).toUpperCase() === 'DEBIT');
    return debits.length > 0 ? debits : categories;
  }, [categories]);

  const defaultCategory = expenseCategories[0]?.name || 'Grocery';

  const [form, setForm] = useState({
    title: '',
    category: defaultCategory,
    month: initialMonth,
    year: initialYear,
    plannedAmount: '',
    paidAmount: '0',
    isFulfilled: false,
    dueDate: '',
    notes: ''
  });

  // ── Recurring Payment Generator States ──────────────────────────────────────
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState<'count' | 'until'>('count');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(3);
  const [untilMonth, setUntilMonth] = useState<string>('Dec');
  const [untilYear, setUntilYear] = useState<number>(initialYear);
  const [installmentNaming, setInstallmentNaming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        const fulfilled = initialPlan.isFulfilled ?? (initialPlan.status === 'Fulfilled');
        setForm({
          title: initialPlan.title,
          category: initialPlan.category || defaultCategory,
          month: initialPlan.month,
          year: initialPlan.year,
          plannedAmount: String(initialPlan.plannedAmount),
          paidAmount: String(initialPlan.paidAmount ?? (fulfilled ? initialPlan.plannedAmount : 0)),
          isFulfilled: fulfilled,
          dueDate: initialPlan.dueDate || '',
          notes: initialPlan.notes || ''
        });
        setIsRecurring(false);
      } else {
        setForm({
          title: '',
          category: defaultCategory,
          month: initialMonth,
          year: initialYear,
          plannedAmount: '',
          paidAmount: '0',
          isFulfilled: false,
          dueDate: '',
          notes: ''
        });
        setIsRecurring(false);
        setRecurrenceMode('count');
        setRecurrenceCount(3);
        setUntilMonth('Dec');
        setUntilYear(initialYear);
        setInstallmentNaming(false);
      }
    }
  }, [isOpen, initialPlan, initialMonth, initialYear, defaultCategory]);

  // ── Compute Recurring Schedule ──────────────────────────────────────────────
  const recurringSchedule = useMemo(() => {
    if (!isRecurring) return [];

    let count = recurrenceCount;
    if (recurrenceMode === 'until') {
      const startIdx = getMonthIndex(form.month);
      const endIdx = getMonthIndex(untilMonth);
      if (startIdx >= 0 && endIdx >= 0) {
        const diff = (untilYear - Number(form.year)) * 12 + (endIdx - startIdx) + 1;
        count = Math.max(1, Math.min(48, diff));
      }
    }

    return computeRecurringMonths(
      form.month,
      Number(form.year),
      count,
      form.dueDate || undefined
    );
  }, [
    isRecurring,
    recurrenceMode,
    recurrenceCount,
    untilMonth,
    untilYear,
    form.month,
    form.year,
    form.dueDate
  ]);

  if (!isOpen) return null;

  const plannedNum = parseFloat(form.plannedAmount) || 0;
  const totalRecurringBudget = plannedNum * (recurringSchedule.length || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.plannedAmount || Number(form.plannedAmount) <= 0) return;

    const plannedAmt = Math.abs(parseFloat(form.plannedAmount));
    const paidAmt = Math.max(0, parseFloat(form.paidAmount) || 0);
    const finalFulfilled = form.isFulfilled || paidAmt >= plannedAmt;
    const finalStatus: PlannedExpenseStatus = finalFulfilled
      ? 'Fulfilled'
      : (paidAmt > 0 ? 'Partial' : 'Planned');

    // Multi-month Recurring Expense Batch Generation
    if (!initialPlan && isRecurring && recurringSchedule.length > 1) {
      const recurringGroupId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const batchPlans: Omit<PlannedExpense, 'id' | 'createdAt'>[] = recurringSchedule.map((item, idx) => {
        const isFirst = idx === 0;
        const currentPaid = isFirst ? paidAmt : 0;
        const currentFulfilled = isFirst && finalFulfilled;
        const currentStatus: PlannedExpenseStatus = currentFulfilled
          ? 'Fulfilled'
          : (currentPaid > 0 ? 'Partial' : 'Planned');

        const titleWithCounter = installmentNaming
          ? `${form.title.trim()} (${item.index}/${item.total})`
          : form.title.trim();

        const noteSuffix = `[Recurring ${item.index}/${item.total}]`;
        const fullNotes = form.notes.trim()
          ? `${form.notes.trim()} • ${noteSuffix}`
          : noteSuffix;

        return {
          title: titleWithCounter,
          category: form.category || undefined,
          month: item.month,
          year: item.year,
          plannedAmount: plannedAmt,
          paidAmount: currentPaid,
          isFulfilled: currentFulfilled,
          dueDate: item.dueDate || undefined,
          status: currentStatus,
          notes: fullNotes,
          isRecurring: true,
          recurringGroupId,
          installmentIndex: item.index,
          totalInstallments: item.total
        };
      });

      onSubmit(batchPlans);
    } else {
      onSubmit({
        title: form.title.trim(),
        category: form.category || undefined,
        month: form.month,
        year: Number(form.year),
        plannedAmount: plannedAmt,
        paidAmount: paidAmt,
        isFulfilled: finalFulfilled,
        dueDate: form.dueDate || undefined,
        status: finalStatus,
        notes: form.notes.trim()
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card modal-content-card-plan">

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
              placeholder="e.g. Laptop, Tabby, Bakala, Netflix..."
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
                required
              >
                {expenseCategories.map(c => (
                  <option key={c.id || c._id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Planned Amount</label>
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

          {/* Start Month & Year Grid */}
          <div className="form-grid-two-cols">
            <div className="form-group-custom">
              <label className="form-label-custom">
                {isRecurring ? 'Starting Month' : 'Target Month'}
              </label>
              <select
                value={form.month}
                onChange={e => setForm(prev => ({ ...prev, month: e.target.value }))}
                className="form-input-custom select-custom"
              >
                {MONTH_NAMES.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">
                {isRecurring ? 'Starting Year' : 'Year'}
              </label>
              <select
                value={form.year}
                onChange={e => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                className="form-input-custom select-custom"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
              </select>
            </div>
          </div>

          {/* Due Date (Optional) */}
          <div className="form-group-custom">
            <label className="form-label-custom">
              Expected Due Date {isRecurring ? '(Day will repeat each month)' : '(Optional)'}
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              className="form-input-custom"
            />
          </div>

          {/* ── Recurring Payment Generator Section (Only when creating) ── */}
          {!initialPlan && (
            <div className={`recurring-toggle-card ${isRecurring ? 'active' : ''}`}>
              <div
                className="recurring-toggle-header"
                onClick={() => setIsRecurring(prev => !prev)}
              >
                <div className="recurring-toggle-info">
                  <div className="recurring-icon-wrap">
                    <Repeat size={16} />
                  </div>
                  <div className="recurring-title-row">
                    <span className="recurring-title">Recurring Payment</span>
                    <span className="recurring-subtitle">
                      Schedule automatically across consecutive future months
                    </span>
                  </div>
                </div>
                <div
                  className={`recurring-switch ${isRecurring ? 'checked' : ''}`}
                  role="switch"
                  aria-checked={isRecurring}
                >
                  <div className="recurring-switch-handle" />
                </div>
              </div>

              {isRecurring && (
                <div className="recurring-options-panel">
                  {/* Mode Selector */}
                  <div className="recurring-mode-pills">
                    <button
                      type="button"
                      className={`recurring-mode-pill ${recurrenceMode === 'count' ? 'active' : ''}`}
                      onClick={() => setRecurrenceMode('count')}
                    >
                      Number of Months
                    </button>
                    <button
                      type="button"
                      className={`recurring-mode-pill ${recurrenceMode === 'until' ? 'active' : ''}`}
                      onClick={() => setRecurrenceMode('until')}
                    >
                      Until Specific Month
                    </button>
                  </div>

                  {/* Mode 1: Count Presets */}
                  {recurrenceMode === 'count' ? (
                    <div className="recurring-presets-section">
                      <div className="recurring-presets-row">
                        {[
                          { count: 3, label: '3 Months' },
                          { count: 4, label: '4 Months (Tabby/Tamara)' },
                          { count: 6, label: '6 Months' },
                          { count: 12, label: '12 Months (1 Year)' }
                        ].map(preset => (
                          <button
                            key={preset.count}
                            type="button"
                            onClick={() => setRecurrenceCount(preset.count)}
                            className={`recurring-preset-chip ${recurrenceCount === preset.count ? 'active' : ''}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="recurring-custom-count-row">
                        <label className="preset-label">Custom Duration:</label>
                        <input
                          type="number"
                          min={2}
                          max={36}
                          value={recurrenceCount}
                          onChange={e => setRecurrenceCount(Math.max(2, Math.min(36, parseInt(e.target.value) || 2)))}
                          className="form-input-custom input-sm-count"
                        />
                        <span className="preset-label">months</span>
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Until Month/Year */
                    <div className="form-grid-two-cols">
                      <div className="form-group-custom">
                        <label className="preset-label">End Month</label>
                        <select
                          value={untilMonth}
                          onChange={e => setUntilMonth(e.target.value)}
                          className="form-input-custom select-custom"
                        >
                          {MONTH_NAMES.map((m: string) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group-custom">
                        <label className="preset-label">End Year</label>
                        <select
                          value={untilYear}
                          onChange={e => setUntilYear(Number(e.target.value))}
                          className="form-input-custom select-custom"
                        >
                          <option value={2026}>2026</option>
                          <option value={2027}>2027</option>
                          <option value={2028}>2028</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Installment Numbering Suffix Option */}
                  <label className="recurring-checkbox-label">
                    <input
                      type="checkbox"
                      checked={installmentNaming}
                      onChange={e => setInstallmentNaming(e.target.checked)}
                    />
                    <span>Append installment numbers to title (e.g. &ldquo;{form.title.trim() || 'Tabby'} (1/{recurringSchedule.length || 3})&rdquo;)</span>
                  </label>

                  {/* Live Schedule Timeline Preview */}
                  {recurringSchedule.length > 0 && (
                    <div className="recurring-timeline-preview">
                      <div className="recurring-timeline-header">
                        <span>Generated Schedule ({recurringSchedule.length} Months):</span>
                        {plannedNum > 0 && (
                          <span className="recurring-timeline-header-total">
                            Total: {formatSAR(totalRecurringBudget)}
                          </span>
                        )}
                      </div>
                      <div className="recurring-chips-track">
                        {recurringSchedule.map((item, idx) => (
                          <React.Fragment key={`${item.month}-${item.year}`}>
                            <span className={`recurring-month-badge ${idx === 0 ? 'first' : ''}`}>
                              {item.month} {item.year}
                            </span>
                            {idx < recurringSchedule.length - 1 && (
                              <ArrowRight size={10} className="recurring-arrow" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="form-group-custom">
            <label className="form-label-custom">Notes (Optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Tabby installment, subscription billing, etc."
              className="form-input-custom"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialPlan
                ? 'Save Changes'
                : isRecurring && recurringSchedule.length > 1
                ? `Save ${recurringSchedule.length} Recurring Expenses (${formatSAR(totalRecurringBudget)})`
                : 'Save Planned Expense'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
