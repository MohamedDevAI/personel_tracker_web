import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../services/expenseApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6699', '#44CEF6', '#B1D5C8'];

export default function ExpenseTracker() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('transactions');

  // Queries
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: expenseApi.getDashboardSummary
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: expenseApi.getTransactions
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => expenseApi.getCategories()
  });

  // Mutations
  const addTransaction = useMutation({
    mutationFn: expenseApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: expenseApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const addCategory = useMutation({
    mutationFn: expenseApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: expenseApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  // States for forms
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [txForm, setTxForm] = useState({
    title: '', amountSar: '', type: 'DEBIT', categoryId: '', transactionDate: new Date().toISOString().split('T')[0], note: ''
  });

  const [catForm, setCatForm] = useState({
    name: '', type: 'DEBIT'
  });

  const handleTxSubmit = (e) => {
    e.preventDefault();
    addTransaction.mutate({
      note: txForm.title + (txForm.note ? ` - ${txForm.note}` : ''),
      amountSar: parseFloat(txForm.amountSar),
      type: txForm.type,
      categoryId: txForm.categoryId,
      transactionDate: txForm.transactionDate
    });
    setShowTransactionModal(false);
    setTxForm({ ...txForm, title: '', amountSar: '', note: '' });
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    addCategory.mutate(catForm);
    setShowCategoryModal(false);
    setCatForm({ name: '', type: 'DEBIT' });
  };

  // Prepare chart data
  const pieData = summary?.expensesByCategory 
    ? Object.keys(summary.expensesByCategory).map(key => ({
        name: key,
        value: summary.expensesByCategory[key]
      }))
    : [];

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Expense <span className="emerald-gradient-text">Tracker (SAR)</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your finances, categorize transactions, and track your net worth.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary">
            <Tag size={16} /> Add Category
          </button>
          <button onClick={() => setShowTransactionModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL CREDIT (INCOME)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>
            + SAR {summary?.totalCredit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL DEBIT (EXPENSES)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)' }}>
            - SAR {summary?.totalDebit?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>NET BALANCE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (summary?.balance >= 0) ? '#38bdf8' : '#f43f5e', fontFamily: 'var(--font-display)' }}>
            SAR {summary?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        {/* Main Content Area */}
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              onClick={() => setActiveTab('transactions')}
              className={activeTab === 'transactions' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Recent Transactions
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={activeTab === 'categories' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              Categories
            </button>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            {activeTab === 'transactions' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 20px' }}>NOTES</th>
                    <th style={{ padding: '14px 20px' }}>CATEGORY</th>
                    <th style={{ padding: '14px 20px' }}>DATE</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>AMOUNT (SAR)</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(item => {
                    const cat = categories.find(c => c.id === item.categoryId);
                    return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s ease' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: item.type === 'CREDIT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.type === 'CREDIT' ? '#34d399' : '#fb7185'
                          }}>
                            {item.type === 'CREDIT' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          </div>
                          <span>{item.note || 'No notes'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className="badge badge-indigo">{cat ? cat.name : 'Unknown'}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {item.transactionDate}
                      </td>
                      <td style={{
                        padding: '14px 20px', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-display)',
                        color: item.type === 'CREDIT' ? '#10b981' : '#f43f5e'
                      }}>
                        {item.type === 'CREDIT' ? '+' : '-'}{item.amountSar?.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteTransaction.mutate(item.id)}
                          className="btn-icon" style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            )}

            {activeTab === 'categories' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 20px' }}>NAME</th>
                    <th style={{ padding: '14px 20px' }}>TYPE</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ color: cat.type === 'CREDIT' ? '#10b981' : '#f43f5e' }}>{cat.type}</span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteCategory.mutate(cat.id)}
                          className="btn-icon" style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar / Chart */}
        <div>
          <div className="glass-panel" style={{ padding: '20px', height: '100%' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', textAlign: 'center' }}>Expenses Breakdown</h3>
            {pieData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `SAR ${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                No expense data for chart.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Log Transaction</h3>
            <form onSubmit={handleTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Type</label>
                <select value={txForm.type} onChange={(e) => setTxForm({...txForm, type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px' }}>
                  <option value="DEBIT">Debit (Expense)</option>
                  <option value="CREDIT">Credit (Income)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
                <select value={txForm.categoryId} onChange={(e) => setTxForm({...txForm, categoryId: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px' }} required>
                  <option value="">Select Category</option>
                  {categories.filter(c => c.type === txForm.type).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Title</label>
                <input type="text" value={txForm.title} onChange={(e) => setTxForm({...txForm, title: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Amount (SAR)</label>
                <input type="number" step="0.01" value={txForm.amountSar} onChange={(e) => setTxForm({...txForm, amountSar: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Date</label>
                <input type="date" value={txForm.transactionDate} onChange={(e) => setTxForm({...txForm, transactionDate: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowTransactionModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '18px' }}>Add Category</h3>
            <form onSubmit={handleCatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Name</label>
                <input type="text" value={catForm.name} onChange={(e) => setCatForm({...catForm, name: e.target.value})} required style={{ width: '100%', padding: '8px', borderRadius: '8px' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Type</label>
                <select value={catForm.type} onChange={(e) => setCatForm({...catForm, type: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px' }}>
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
