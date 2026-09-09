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
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', background: 'var(--bg-secondary)' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Ledger Category</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Name</label>
            <input 
              type="text" 
              placeholder="e.g. Investments, Consulting, Health..."
              value={catForm.name} 
              onChange={(e) => setCatForm({...catForm, name: e.target.value})} 
              required 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Type</label>
            <select 
              value={catForm.type} 
              onChange={(e) => setCatForm({...catForm, type: e.target.value as TransactionType})} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#101522', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value="Debit">Debit (Expense)</option>
              <option value="Credit">Credit (Income)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Category</button>
          </div>
        </form>
      </div>
    </div>
  );
}
