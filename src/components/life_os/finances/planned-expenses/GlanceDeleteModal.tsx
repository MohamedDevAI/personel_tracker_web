import { Trash2 } from 'lucide-react';
import { PlannedExpense } from '../../../../types';
import { formatSAR } from './plannedExpenseSync';

interface GlanceDeleteModalProps {
  plan: PlannedExpense;
  calendarYear: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GlanceDeleteModal({
  plan,
  calendarYear,
  onConfirm,
  onCancel
}: GlanceDeleteModalProps) {
  return (
    <div className="glance-modal-overlay">
      <div className="glance-modal-delete-card glass-panel">
        <h4 className="glance-modal-delete-title">
          <Trash2 size={18} /> Delete Planned Expense
        </h4>
        <p className="glance-modal-delete-text">
          Are you sure you want to remove <strong>{plan.title}</strong> (
          {formatSAR(plan.plannedAmount)}) from {plan.month}{' '}
          {plan.year || calendarYear}?
        </p>
        <div className="glance-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger btn-sm glance-modal-delete-btn"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
