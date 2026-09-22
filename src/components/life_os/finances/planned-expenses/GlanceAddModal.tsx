import React from 'react';
import { Plus } from 'lucide-react';
import { MONTH_NAMES } from '../../../../utils/dateHelpers';

interface GlanceAddModalProps {
  calendarYear: number;
  newTitle: string;
  setNewTitle: (val: string) => void;
  newAmount: string;
  setNewAmount: (val: string) => void;
  newMonth: string;
  setNewMonth: (val: string) => void;
  newYear: number;
  setNewYear: (val: number) => void;
  newNotes: string;
  setNewNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function GlanceAddModal({
  calendarYear,
  newTitle,
  setNewTitle,
  newAmount,
  setNewAmount,
  newMonth,
  setNewMonth,
  newYear,
  setNewYear,
  newNotes,
  setNewNotes,
  onSubmit,
  onClose
}: GlanceAddModalProps) {
  return (
    <div className="glance-modal-overlay">
      <div className="glance-modal-card glass-panel">
        <h4 className="glance-modal-header">
          <Plus size={18} color="#34d399" /> Add Planned Expense
        </h4>

        <form onSubmit={onSubmit} className="glance-modal-form">
          <div className="glance-modal-field">
            <label className="glance-modal-label">
              Expense Objective *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Apartment Rent, Groceries, WiFi..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="borrow-search-input glance-modal-input"
            />
          </div>

          <div className="glance-modal-field">
            <label className="glance-modal-label">
              Planned Budget (SAR) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="1"
              placeholder="0.00"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              className="borrow-search-input glance-modal-input"
            />
          </div>

          <div className="glance-modal-grid-2">
            <div className="glance-modal-field">
              <label className="glance-modal-label">
                Target Month
              </label>
              <select
                value={newMonth}
                onChange={e => setNewMonth(e.target.value)}
                className="borrow-select-filter glance-modal-select"
              >
                {MONTH_NAMES.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="glance-modal-field">
              <label className="glance-modal-label">
                Target Year
              </label>
              <select
                value={newYear}
                onChange={e => setNewYear(Number(e.target.value))}
                className="borrow-select-filter glance-modal-select"
              >
                <option value={calendarYear}>{calendarYear}</option>
                <option value={calendarYear + 1}>{calendarYear + 1} (Next Year)</option>
                <option value={calendarYear + 2}>{calendarYear + 2}</option>
              </select>
            </div>
          </div>

          <div className="glance-modal-field">
            <label className="glance-modal-label">
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via bank transfer..."
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              className="borrow-search-input glance-modal-input"
            />
          </div>

          <div className="glance-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              + Add Objective
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
