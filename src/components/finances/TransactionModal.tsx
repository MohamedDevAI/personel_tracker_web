import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Category, TransactionType } from '../../types';
import { MONTH_NAMES } from '../../utils/dateHelpers';
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
  categories?: Category[];
  initialDate: string;
  initialMonth: string;
  initialType: TransactionType;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  initialDate,
  initialMonth,
  initialType
}: TransactionModalProps) {
  const activeCategories: Category[] = categories || [];

  const defaultCategoryForType = (t: TransactionType) => {
    const isCredit = t === 'Credit';
    const match = activeCategories.find((c: Category) => String(c.type).toUpperCase() === (isCredit ? 'CREDIT' : 'DEBIT'));
    return match ? match.name : (activeCategories[0]?.name || (isCredit ? 'Salary' : 'Food'));
  };

  const [txForm, setTxForm] = useState({
    date: initialDate,
    month: initialMonth,
    category: defaultCategoryForType(initialType),
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
        category: defaultCategoryForType(initialType),
        customCategory: '',
        description: '',
        paymentMethod: 'Account',
        amount: '',
        type: initialType
      });
    }
  }, [isOpen, initialDate, initialMonth, initialType, categories]);

  const typeCategories = useMemo(() => {
    const isCredit = txForm.type === 'Credit';
    const matching = activeCategories.filter((c: Category) => String(c.type).toUpperCase() === (isCredit ? 'CREDIT' : 'DEBIT'));
    const others = activeCategories.filter((c: Category) => String(c.type).toUpperCase() !== (isCredit ? 'CREDIT' : 'DEBIT'));
    return { matching, others };
  }, [activeCategories, txForm.type]);

  const handleTypeSwitch = (nextType: TransactionType) => {
    setTxForm(prev => ({
      ...prev,
      type: nextType,
      category: prev.category === '__custom__' ? '__custom__' : defaultCategoryForType(nextType)
    }));
  };

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
    <div className="modal-overlay-backdrop">
      <div className="glass-panel modal-content-card">
        
        <div className="modal-header-row">
          <div>
            <h3 className="modal-title-main">Log Financial Transaction</h3>
            <div className="modal-subtitle-schema">MongoDB Schema: date, month, category, description, paymentMethod, amount, type</div>
          </div>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-vertical">
          
          {/* Type Switcher */}
          <div className="modal-type-buttons-grid">
            <button
              type="button"
              onClick={() => handleTypeSwitch('Credit')}
              className={`modal-type-btn modal-type-btn-credit ${txForm.type === 'Credit' ? 'active' : ''}`}
            >
              <ArrowUpRight size={16} /> Credit (Income)
            </button>

            <button
              type="button"
              onClick={() => handleTypeSwitch('Debit')}
              className={`modal-type-btn modal-type-btn-debit ${txForm.type === 'Debit' ? 'active' : ''}`}
            >
              <ArrowDownRight size={16} /> Debit (Expense)
            </button>
          </div>

          {/* Date & Month */}
          <div className="modal-grid-2col">
            <div>
              <label className="modal-field-label">Date</label>
              <input 
                type="date" 
                value={txForm.date} 
                onChange={(e) => handleDateChange(e.target.value)} 
                required 
                className="modal-input-field" 
              />
            </div>
            <div>
              <label className="modal-field-label">Month (Auto)</label>
              <input 
                type="text" 
                value={txForm.month} 
                readOnly
                className="modal-readonly-input" 
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="modal-field-label">Description / Title</label>
            <input 
              type="text" 
              placeholder="e.g. Salary, Grocery run, Consulting invoice..."
              value={txForm.description} 
              onChange={(e) => setTxForm({...txForm, description: e.target.value})} 
              required 
              className="modal-input-field" 
            />
          </div>

          {/* Category from MongoDB collection */}
          <div>
            <label className="modal-field-label">Category (MongoDB Collection)</label>
            <select 
              value={txForm.category} 
              onChange={(e) => setTxForm({...txForm, category: e.target.value})} 
              className="modal-select-field"
            >
              {typeCategories.matching.length > 0 && (
                <optgroup label={`${txForm.type} Categories`}>
                  {typeCategories.matching.map((c: Category) => (
                    <option key={c.id || c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              {typeCategories.others.length > 0 && (
                <optgroup label={`Other Categories`}>
                  {typeCategories.others.map((c: Category) => (
                    <option key={c.id || c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              <option value="__custom__">+ Enter Custom Category...</option>
            </select>

            {txForm.category === '__custom__' && (
              <input
                type="text"
                placeholder="Enter new category name..."
                value={txForm.customCategory}
                onChange={(e) => setTxForm({...txForm, customCategory: e.target.value})}
                required
                className="modal-custom-input"
              />
            )}
          </div>

          {/* Payment Method & Amount */}
          <div className="modal-grid-equal">
            <div>
              <label className="modal-field-label">Payment Method</label>
              <select 
                value={txForm.paymentMethod} 
                onChange={(e) => setTxForm({...txForm, paymentMethod: e.target.value})} 
                className="modal-select-field"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="modal-field-label">Amount (SAR)</label>
              <input 
                type="number" 
                step="0.01" 
                placeholder="e.g. 5000"
                value={txForm.amount} 
                onChange={(e) => setTxForm({...txForm, amount: e.target.value})} 
                required 
                className="modal-input-field" 
              />
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="modal-footer-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save to Ledger</button>
          </div>
        </form>
      </div>
    </div>
  );
}
