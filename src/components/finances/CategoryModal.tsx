import React, { useState } from 'react';
import { TransactionType } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryData: { name: string; type: TransactionType }) => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit
}: CategoryModalProps) {
  const [catForm, setCatForm] = useState({
    name: '',
    type: 'Debit' as TransactionType
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    onSubmit({
      name: catForm.name.trim(),
      type: catForm.type
    });
    setCatForm({ name: '', type: 'Debit' });
    onClose();
  };

  return (
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card modal-content-card-sm">
        <h3 className="modal-title-main">Add Ledger Category</h3>
        <form onSubmit={handleSubmit} className="modal-form-vertical">
          <div>
            <label className="modal-field-label">Name</label>
            <input 
              type="text" 
              placeholder="e.g. Investments, Consulting, Health..."
              value={catForm.name} 
              onChange={(e) => setCatForm({...catForm, name: e.target.value})} 
              required 
              className="modal-input-field" 
            />
          </div>
          <div>
            <label className="modal-field-label">Type</label>
            <select 
              value={catForm.type} 
              onChange={(e) => setCatForm({...catForm, type: e.target.value as TransactionType})} 
              className="modal-select-field"
            >
              <option value="Debit">Debit (Expense)</option>
              <option value="Credit">Credit (Income)</option>
            </select>
          </div>
          <div className="modal-footer-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Category</button>
          </div>
        </form>
      </div>
    </div>
  );
}
