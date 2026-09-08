import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Filter, PieChart } from 'lucide-react';

export default function Finances({ expenses, onAddExpense, onDeleteExpense }) {
  const [filterType, setFilterType] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    category: 'Tech & Work',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categories = ['Tech & Work', 'Nutrition', 'Consulting', 'Software', 'Investment', 'Fitness', 'Travel', 'Education', 'Living'];

  const filteredExpenses = expenses.filter(e => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  const totalIncome = expenses
    .filter(e => e.type === 'INCOME')
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = expenses
    .filter(e => e.type === 'EXPENSE')
    .reduce((s, e) => s + Number(e.amount), 0);
  const netSavings = totalIncome - totalExpense;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    onAddExpense({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData({
      title: '',
      amount: '',
      type: 'EXPENSE',
      category: 'Tech & Work',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddModal(false);
  };

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Personal <span className="emerald-gradient-text">Financial Ledger</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Track capital inflows, expenses, recurring obligations, and wealth building.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL INFLOWS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>
            +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL EXPENSES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)' }}>
            -${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>NET SAVINGS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: netSavings >= 0 ? '#38bdf8' : '#f43f5e', fontFamily: 'var(--font-display)' }}>
            ${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'EXPENSE', 'INCOME'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                background: filterType === type ? 'var(--bg-surface)' : 'transparent',
                borderColor: filterType === type ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: filterType === type ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              {type === 'ALL' ? 'All Entries' : type === 'EXPENSE' ? 'Expenses' : 'Incomes'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing {filteredExpenses.length} transactions
        </span>
      </div>

      {/* Transactions Table / List */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 20px' }}>TRANSACTION</th>
              <th style={{ padding: '14px 20px' }}>CATEGORY</th>
              <th style={{ padding: '14px 20px' }}>DATE</th>
              <th style={{ padding: '14px 20px' }}>NOTES</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>AMOUNT</th>
              <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s ease' }}>
                <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: item.type === 'INCOME' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.type === 'INCOME' ? '#34d399' : '#fb7185'
                    }}>
                      {item.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <span>{item.title}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span className="badge badge-indigo">{item.category}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {item.date}
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {item.notes || '—'}
                </td>
                <td style={{
                  padding: '14px 20px',
                  textAlign: 'right',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-display)',
                  color: item.type === 'INCOME' ? '#10b981' : '#f43f5e'
                }}>
                  {item.type === 'INCOME' ? '+' : '-'}${Number(item.amount).toFixed(2)}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDeleteExpense(item.id)}
                    className="btn-icon"
                    style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Add Transaction */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Log New Transaction</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: formData.type === 'EXPENSE' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                      color: formData.type === 'EXPENSE' ? '#f43f5e' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: formData.type === 'INCOME' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: formData.type === 'INCOME' ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Cloud Services"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional context"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
