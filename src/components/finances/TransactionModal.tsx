import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TransactionType } from '../../types';
import { MONTH_NAMES } from '../../services/expenseApi';
import { PAYMENT_METHODS } from './financeConstants';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionData: {
    date: string;
    month: string;
    category: string;
    description: string;
    paymentMethod: string;
    amount: number;
    type: TransactionType;
  }) => void;
  initialDate: string;
  initialMonth: string;
  initialType: TransactionType;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialMonth,
  initialType
}: TransactionModalProps) {
  const [txForm, setTxForm] = useState({
    date: initialDate,
    month: initialMonth,
    category: initialType === 'Debit' ? 'Groceries' : 'Salary',
    customCategory: '',
    description: '',
    paymentMethod: 'Account',
    amount: '',
    type: initialType
  });

  useEffect(() => {
    if (isOpen) {
      setTxForm({
        date: initialDate,
        month: initialMonth,
        category: initialType === 'Debit' ? 'Groceries' : 'Salary',
        customCategory: '',
        description: '',
        paymentMethod: 'Account',
        amount: '',
        type: initialType
      });
    }
  }, [isOpen, initialDate, initialMonth, initialType]);

  if (!isOpen) return null;

  const handleDateChange = (dateVal: string) => {
    const d = new Date(dateVal);
    const m = !isNaN(d.getTime()) ? MONTH_NAMES[d.getMonth()] : 'Mar';
    setTxForm(prev => ({
      ...prev,
      date: dateVal,
      month: m
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = txForm.category === '__custom__' ? txForm.customCategory.trim() : txForm.category;
    if (!finalCategory || !txForm.amount || !txForm.description.trim()) return;

    onSubmit({
      date: txForm.date,
      month: txForm.month,
      category: finalCategory,
      description: txForm.description.trim(),
      paymentMethod: txForm.paymentMethod,
      amount: parseFloat(txForm.amount),
      type: txForm.type
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '28px', background: 'var(--bg-secondary)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Log Financial Transaction</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MongoDB Schema: date, month, category, description, paymentMethod, amount, type</div>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Type Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setTxForm({ ...txForm, type: 'Credit' })}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: txForm.type === 'Credit' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: txForm.type === 'Credit' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                color: txForm.type === 'Credit' ? '#10b981' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ArrowUpRight size={16} /> Credit (Income)
            </button>

            <button
              type="button"
              onClick={() => setTxForm({ ...txForm, type: 'Debit' })}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: txForm.type === 'Debit' ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
                background: txForm.type === 'Debit' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(0,0,0,0.2)',
                color: txForm.type === 'Debit' ? '#f43f5e' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <ArrowDownRight size={16} /> Debit (Expense)
            </button>
          </div>

          {/* Date & Month */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Date</label>
              <input 
                type="date" 
                value={txForm.date} 
                onChange={(e) => handleDateChange(e.target.value)} 
                required 
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Month (Auto)</label>
              <input 
                type="text" 
                value={txForm.month} 
                readOnly
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: '#10b981', fontWeight: 700 }} 
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Description / Title</label>
            <input 
              type="text" 
              placeholder="e.g. Salary, Grocery run, Consulting invoice..."
              value={txForm.description} 
              onChange={(e) => setTxForm({...txForm, description: e.target.value})} 
              required 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} 
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
            <select 
              value={txForm.category} 
              onChange={(e) => setTxForm({...txForm, category: e.target.value})} 
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#101522', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <option value="Salary">Salary</option>
              <option value="Consulting">Consulting</option>
              <option value="Investments">Investments</option>
              <option value="Housing">Housing</option>
              <option value="Groceries">Groceries</option>
              <option value="Dining">Dining</option>
              <option value="Software">Software</option>
              <option value="Tech & Work">Tech & Work</option>
              <option value="Utilities">Utilities</option>
              <option value="__custom__">+ Enter Custom Category...</option>
            </select>

            {txForm.category === '__custom__' && (
              <input
                type="text"
                placeholder="Enter new category name..."
                value={txForm.customCategory}
                onChange={(e) => setTxForm({...txForm, customCategory: e.target.value})}
                required
                style={{ marginTop: '8px', width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            )}
          </div>

          {/* Payment Method & Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Payment Method</label>
              <select 
                value={txForm.paymentMethod} 
                onChange={(e) => setTxForm({...txForm, paymentMethod: e.target.value})} 
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#101522', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Amount (SAR)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="e.g. 5000"
                value={txForm.amount} 
                onChange={(e) => setTxForm({...txForm, amount: e.target.value})} 
                required 
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} 
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save to Ledger</button>
          </div>
        </form>
      </div>
    </div>
  );
}
