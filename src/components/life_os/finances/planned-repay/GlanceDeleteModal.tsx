import React from 'react';
import { Trash2, RefreshCw, X } from 'lucide-react';

interface GlanceDeleteModalProps {
  isOpen: boolean;
  creditorName: string;
  amount: number;
  month: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formatINR: (val: number) => string;
}

export default function GlanceDeleteModal({
  isOpen, creditorName, amount, month, isDeleting, onClose, onConfirm, formatINR
}: GlanceDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card" style={{ maxWidth: 440 }}>
        <div className="modal-header-row">
          <div className="modal-header-with-icon">
            <div className="modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="modal-title-main">Delete Planned Repayment?</h3>
              <div className="modal-subtitle-schema">This will remove the item from the schedule</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Are you sure you want to delete the scheduled repayment for{' '}
          <strong style={{ color: '#ffffff' }}>{creditorName}</strong> ({formatINR(amount)}) in{' '}
          <strong style={{ color: '#ffffff' }}>{month}</strong>?
        </div>

        <div className="modal-actions-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">No, Keep</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-danger"
            style={{ background: '#ef4444', borderColor: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isDeleting ? <RefreshCw size={14} className="spin-icon" /> : <Trash2 size={14} />}
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
