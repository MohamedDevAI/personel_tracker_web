import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi, MONTH_NAMES } from '../services/expenseApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Tag, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  Building2, 
  Coins, 
  Search,
  Wallet,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';

const CATEGORY_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#f97316', // Orange
  '#a855f7', // Purple
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
  '#64748b'  // Slate
];

const getCategoryColor = (index: number) => {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
};

const PAYMENT_METHODS = ['Account', 'Card', 'Cash', 'Transfer', 'UPI'] as const;

export default function ExpenseTracker() {
  const queryClient = useQueryClient();

  // Queries
  const { data: transactions = [], isLoading: isTxsLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: expenseApi.getTransactions
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => expenseApi.getCategories()
  });

  // UI States
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  
  // Year & Month Filter State
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('Mar'); // 'All' or 'Jan'..'Dec'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Credit' | 'Debit'>('ALL');

  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form State matching MongoDB Schema:
  // _id, date, month, category, description, paymentMethod, amount, type
  const [txForm, setTxForm] = useState({
    date: '2026-03-01',
    month: 'Mar',
    category: 'Salary',
    customCategory: '',
    description: '',
    paymentMethod: 'Account',
    amount: '',
    type: 'Credit' as TransactionType
  });

  const [catForm, setCatForm] = useState({
    name: '',
    type: 'Debit' as TransactionType
  });

  // Helper: Extract safe Year and Month from any transaction format
  const parseTxDate = (tx: Transaction) => {
    let year = 2026;
    let month = tx.month || 'Mar';

    const rawDate = tx.date || tx.transactionDate || '';
    if (typeof rawDate === 'string') {
      const match = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        year = parseInt(match[1], 10);
        const mIdx = parseInt(match[2], 10) - 1;
        if (!tx.month && mIdx >= 0 && mIdx < 12) {
          month = MONTH_NAMES[mIdx];
        }
      } else {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          year = d.getFullYear();
          if (!tx.month) {
            month = MONTH_NAMES[d.getMonth()];
          }
        }
      }
    }

    if (month) {
      const formatted = month.slice(0, 3);
      const found = MONTH_NAMES.find(m => m.toLowerCase() === formatted.toLowerCase());
      if (found) month = found;
    }

    return { year, month };
  };

  // Extract unique available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>([2026]);
    transactions.forEach(t => {
      const { year } = parseTxDate(t);
      if (!isNaN(year) && year > 1900 && year < 2100) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

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
    }
  });

  // Calculate transaction count per month for the selected year
  const monthlyTransactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MONTH_NAMES.forEach(m => { counts[m] = 0; });
    transactions.forEach(tx => {
      const { year, month } = parseTxDate(tx);
      if (year === selectedYear) {
        if (counts[month] !== undefined) {
          counts[month]++;
        }
      }
    });
    return counts;
  }, [transactions, selectedYear]);

  // Filtered Transactions based on Year & Month Filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const { year, month } = parseTxDate(tx);
      if (year !== selectedYear) return false;

      if (selectedMonth !== 'All' && month.toLowerCase() !== selectedMonth.toLowerCase()) {
        return false;
      }

      if (typeFilter !== 'ALL') {
        const isCredit = String(tx.type).toUpperCase() === 'CREDIT';
        if (typeFilter === 'Credit' && !isCredit) return false;
        if (typeFilter === 'Debit' && isCredit) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (tx.description || tx.note || '').toLowerCase().includes(q);
        const catMatch = (tx.category || tx.categoryName || '').toLowerCase().includes(q);
        const payMatch = (tx.paymentMethod || '').toLowerCase().includes(q);
        if (!descMatch && !catMatch && !payMatch) return false;
      }

      return true;
    });
  }, [transactions, selectedYear, selectedMonth, typeFilter, searchQuery]);

  // Dynamic monthly financial stats
  const monthlyStats = useMemo(() => {
    let credit = 0;
    let debit = 0;
    const catMap: Record<string, number> = {};

    filteredTransactions.forEach(tx => {
      const amt = Math.abs(Number(tx.amount || tx.amountSar || 0));
      const isCredit = String(tx.type).toUpperCase() === 'CREDIT';
      if (isCredit) {
        credit += amt;
      } else {
        debit += amt;
        const cat = tx.category || tx.categoryName || 'Other';
        catMap[cat] = (catMap[cat] || 0) + amt;
      }
    });

    const pieData = Object.keys(catMap)
      .map(cat => ({
        name: cat,
        value: catMap[cat]
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalCredit: credit,
      totalDebit: debit,
      netBalance: credit - debit,
      count: filteredTransactions.length,
      pieData
    };
  }, [filteredTransactions]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 'All') {
      setSelectedMonth('Dec');
    } else {
      const idx = MONTH_NAMES.indexOf(selectedMonth as any);
      if (idx > 0) {
        setSelectedMonth(MONTH_NAMES[idx - 1]);
      } else {
        setSelectedMonth(MONTH_NAMES[11]);
        setSelectedYear(prev => prev - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'All') {
      setSelectedMonth('Jan');
    } else {
      const idx = MONTH_NAMES.indexOf(selectedMonth as any);
      if (idx < 11) {
        setSelectedMonth(MONTH_NAMES[idx + 1]);
      } else {
        setSelectedMonth(MONTH_NAMES[0]);
        setSelectedYear(prev => prev + 1);
      }
    }
  };

  // Date change handler to auto-derive month
  const handleDateChange = (dateVal: string) => {
    const d = new Date(dateVal);
    const m = !isNaN(d.getTime()) ? MONTH_NAMES[d.getMonth()] : 'Mar';
    setTxForm(prev => ({
      ...prev,
      date: dateVal,
      month: m
    }));
  };

  // Open add modal initialized for the currently filtered month
  const handleOpenAddModal = (forceType?: TransactionType) => {
    const monthIdx = selectedMonth !== 'All' ? MONTH_NAMES.indexOf(selectedMonth as any) : new Date().getMonth();
    const safeMonthIdx = monthIdx >= 0 ? monthIdx : 2; // Mar
    const monthNum = String(safeMonthIdx + 1).padStart(2, '0');
    const defaultDate = `${selectedYear}-${monthNum}-01`;

    setTxForm({
      date: defaultDate,
      month: MONTH_NAMES[safeMonthIdx],
      category: forceType === 'Debit' ? 'Groceries' : 'Salary',
      customCategory: '',
      description: '',
      paymentMethod: 'Account',
      amount: '',
      type: forceType || 'Credit'
    });
    setShowTransactionModal(true);
  };

  // Submit transaction adhering to MongoDB schema
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = txForm.category === '__custom__' ? txForm.customCategory : txForm.category;
    if (!finalCategory || !txForm.amount || !txForm.description) return;

    addTransaction.mutate({
      date: txForm.date,
      month: txForm.month,
      category: finalCategory,
      description: txForm.description.trim(),
      paymentMethod: txForm.paymentMethod,
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      // backwards compatibility fields
      amountSar: parseFloat(txForm.amount),
      note: txForm.description.trim(),
      transactionDate: txForm.date
    });

    setShowTransactionModal(false);
  };

  // Submit category
  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    addCategory.mutate({
      name: catForm.name.trim(),
      type: catForm.type
    });
    setShowCategoryModal(false);
    setCatForm({ name: '', type: 'Debit' });
  };

  // Helper payment method icon
  const renderPaymentIcon = (method?: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('card')) return <CreditCard size={14} />;
    if (m.includes('cash')) return <Coins size={14} />;
    return <Building2 size={14} />;
  };

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> MongoDB Atlas Schema Aligned
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Records: {transactions.length}
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', letterSpacing: '-0.02em' }}>
            Monthly <span className="emerald-gradient-text">Financial Ledger</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Filter transactions by month and year, inspect cash flows, and manage your ledger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary">
            <Tag size={16} /> Add Category
          </button>
          <button onClick={() => handleOpenAddModal('Debit')} className="btn btn-secondary" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}>
            <ArrowDownRight size={16} /> Log Expense
          </button>
          <button onClick={() => handleOpenAddModal('Credit')} className="btn btn-primary">
            <Plus size={16} /> Log Transaction
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🌟 ULTRA-PREMIUM YEAR & MONTH FILTER BAR                                  */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', border: '1px solid var(--border-focus)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          
          {/* Year Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
              <Calendar size={16} color="#6366f1" />
              <span>YEAR:</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '3px 8px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={() => setSelectedYear(prev => prev - 1)}
                className="btn-icon" 
                style={{ width: '28px', height: '28px' }}
                title="Previous Year"
              >
                <ChevronLeft size={16} />
              </button>
              
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr} style={{ background: '#101522', color: '#fff' }}>
                    {yr}
                  </option>
                ))}
              </select>

              <button 
                onClick={() => setSelectedYear(prev => prev + 1)}
                className="btn-icon" 
                style={{ width: '28px', height: '28px' }}
                title="Next Year"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Quick jump to Current Month button */}
            <button 
              onClick={() => { setSelectedYear(2026); setSelectedMonth('Mar'); }}
              className="btn btn-secondary" 
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Jump to Mar 2026
            </button>
          </div>

          {/* Prev / Next Month Quick Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Browsing: <strong style={{ color: 'var(--text-primary)' }}>{selectedMonth === 'All' ? `Full Year ${selectedYear}` : `${selectedMonth} ${selectedYear}`}</strong>
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={handlePrevMonth} 
                className="btn-icon" 
                style={{ width: '32px', height: '32px' }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextMonth} 
                className="btn-icon" 
                style={{ width: '32px', height: '32px' }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 12-Month Strip + All Months Option */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))',
          gap: '6px',
          background: 'rgba(0,0,0,0.18)',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* ALL Months Button */}
          <button
            onClick={() => setSelectedMonth('All')}
            style={{
              padding: '8px 4px',
              borderRadius: '8px',
              border: selectedMonth === 'All' ? '1px solid #6366f1' : '1px solid transparent',
              background: selectedMonth === 'All' ? 'var(--accent-gradient)' : 'transparent',
              color: selectedMonth === 'All' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: selectedMonth === 'All' ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: selectedMonth === 'All' ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <span>All Year</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{transactions.filter(t => {
              const { year } = parseTxDate(t);
              return year === selectedYear;
            }).length} txs</span>
          </button>

          {/* Individual Month Buttons */}
          {MONTH_NAMES.map(month => {
            const isSelected = selectedMonth === month;
            const count = monthlyTransactionCounts[month] || 0;
            const hasData = count > 0;

            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                style={{
                  padding: '8px 4px',
                  borderRadius: '8px',
                  border: isSelected 
                    ? '1px solid #10b981' 
                    : hasData ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
                  background: isSelected 
                    ? 'var(--emerald-gradient)' 
                    : hasData ? 'rgba(255,255,255,0.03)' : 'transparent',
                  color: isSelected 
                    ? '#ffffff' 
                    : hasData ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.4)' : 'none',
                  position: 'relative'
                }}
              >
                <span>{month}</span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  opacity: isSelected ? 0.95 : (hasData ? 0.85 : 0.4),
                  fontWeight: hasData ? 600 : 400
                }}>
                  {count} txs
                </span>

                {/* Subtle active indicator dot */}
                {hasData && !isSelected && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '6px',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 DYNAMIC SUMMARY METRIC CARDS FOR SELECTED MONTH & YEAR                */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        {/* Total Credit */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {selectedMonth === 'All' ? `${selectedYear} TOTAL CREDIT` : `${selectedMonth.toUpperCase()} ${selectedYear} CREDIT`}
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
            }}>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            +SAR {monthlyStats.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Inflows & Salary deposits
          </div>
        </div>

        {/* Total Debit */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#f43f5e' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {selectedMonth === 'All' ? `${selectedYear} TOTAL DEBIT` : `${selectedMonth.toUpperCase()} ${selectedYear} DEBIT`}
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e'
            }}>
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            -SAR {Math.abs(monthlyStats.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Expenses & Outgoing payments
          </div>
        </div>

        {/* Net Monthly Balance */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
            background: monthlyStats.netBalance >= 0 ? '#38bdf8' : '#f43f5e' 
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              {selectedMonth === 'All' ? `${selectedYear} NET SAVINGS` : `${selectedMonth.toUpperCase()} NET SAVINGS`}
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: monthlyStats.netBalance >= 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: monthlyStats.netBalance >= 0 ? '#38bdf8' : '#f43f5e'
            }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ 
            fontSize: '1.75rem', fontWeight: 800, 
            color: monthlyStats.netBalance >= 0 ? '#38bdf8' : '#f43f5e', 
            fontFamily: 'var(--font-display)', marginBottom: '4px' 
          }}>
            SAR {monthlyStats.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {monthlyStats.totalCredit > 0 
              ? `${((monthlyStats.netBalance / monthlyStats.totalCredit) * 100).toFixed(1)}% savings rate` 
              : 'Cash balance for period'}
          </div>
        </div>

        {/* Monthly Activity */}
        <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              TRANSACTIONS COUNT
            </div>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6'
            }}>
              <Filter size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            {monthlyStats.count} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Entries</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            In {selectedMonth === 'All' ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 🧭 MAIN CONTENT AREA: TABLE & MONTHLY BREAKDOWN                           */}
      {/* ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Filter controls & Transaction Table */}
        <div>
          {/* Subheader & Search bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* View switcher tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setActiveTab('transactions')}
                className={activeTab === 'transactions' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.82rem', padding: '7px 16px' }}
              >
                Transactions List ({filteredTransactions.length})
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={activeTab === 'categories' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '0.82rem', padding: '7px 16px' }}
              >
                Categories ({categories.length})
              </button>
            </div>

            {/* Search & Type filter */}
            {activeTab === 'transactions' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search note, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '6px 12px 6px 30px',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      width: '180px'
                    }}
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL" style={{ background: '#101522' }}>All Types</option>
                  <option value="Credit" style={{ background: '#101522' }}>Credit (+)</option>
                  <option value="Debit" style={{ background: '#101522' }}>Debit (-)</option>
                </select>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            {activeTab === 'transactions' && (
              <>
                {isTxsLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading transactions...
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Calendar size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>
                      No Transactions in {selectedMonth === 'All' ? `${selectedYear}` : `${selectedMonth} ${selectedYear}`}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 20px' }}>
                      There are no financial logs matching your current filter. You can add a transaction for this month right away.
                    </p>
                    <button 
                      onClick={() => handleOpenAddModal('Credit')}
                      className="btn btn-primary"
                    >
                      <Plus size={16} /> Log Entry for {selectedMonth === 'All' ? 'Year' : selectedMonth}
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderBottom: '1px solid var(--border-subtle)',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.04em'
                        }}>
                          <th style={{ padding: '14px 20px' }}>DATE & MONTH</th>
                          <th style={{ padding: '14px 20px' }}>DESCRIPTION</th>
                          <th style={{ padding: '14px 20px' }}>CATEGORY</th>
                          <th style={{ padding: '14px 20px' }}>PAYMENT METHOD</th>
                          <th style={{ padding: '14px 20px', textAlign: 'right' }}>AMOUNT (SAR)</th>
                          <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map(item => {
                          const isCredit = String(item.type).toUpperCase() === 'CREDIT';
                          const itemId = item._id || item.id || '';
                          const dateDisplay = item.transactionDate || (item.date ? item.date.split('T')[0] : 'N/A');

                          return (
                            <tr 
                              key={itemId} 
                              style={{ 
                                borderBottom: '1px solid var(--border-subtle)', 
                                transition: 'background 0.2s ease',
                              }}
                              className="table-row-hover"
                            >
                              {/* Date & Month */}
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="badge badge-indigo" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                                    {item.month || 'Mar'}
                                  </span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {dateDisplay}
                                  </span>
                                </div>
                              </td>

                              {/* Description / Note */}
                              <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: '0.92rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isCredit ? '#34d399' : '#fb7185',
                                    flexShrink: 0
                                  }}>
                                    {isCredit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                  </div>
                                  <div>
                                    <span>{item.description || item.note || 'Untitled'}</span>
                                    {item._id && (
                                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                        ID: {item._id.slice(0, 10)}...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Category */}
                              <td style={{ padding: '14px 20px' }}>
                                <span className={isCredit ? "badge badge-emerald" : "badge badge-indigo"}>
                                  {item.category || item.categoryName || 'General'}
                                </span>
                              </td>

                              {/* Payment Method */}
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                  {renderPaymentIcon(item.paymentMethod)}
                                  <span>{item.paymentMethod || 'Account'}</span>
                                </div>
                              </td>

                              {/* Amount SAR */}
                              <td style={{
                                padding: '14px 20px', 
                                textAlign: 'right', 
                                fontWeight: 700, 
                                fontSize: '0.98rem', 
                                fontFamily: 'var(--font-display)',
                                color: isCredit ? '#10b981' : '#f43f5e'
                              }}>
                                {isCredit ? '+' : '-'}SAR {Number(item.amount || item.amountSar || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>

                              {/* Action */}
                              <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                <button
                                  onClick={() => itemId && deleteTransaction.mutate(itemId)}
                                  className="btn-icon" 
                                  style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
                                  title="Delete transaction"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Categories Table */}
            {activeTab === 'categories' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 20px' }}>CATEGORY NAME</th>
                    <th style={{ padding: '14px 20px' }}>TYPE</th>
                    <th style={{ padding: '14px 20px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id || cat._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{cat.name}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={String(cat.type).toUpperCase() === 'CREDIT' ? 'badge badge-emerald' : 'badge badge-rose'}>
                          {cat.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => (cat.id || cat._id) && deleteCategory.mutate((cat.id || cat._id)!)}
                          className="btn-icon" 
                          style={{ margin: '0 auto', width: '30px', height: '30px', color: '#f43f5e' }}
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

        {/* Right Column: Monthly Category Breakdown Visuals */}
        <div>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                {selectedMonth === 'All' ? `${selectedYear} Outflows` : `${selectedMonth} ${selectedYear} Outflows`}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Expenses categorized for selected period
              </p>
            </div>

            {monthlyStats.pieData.length > 0 ? (
              <div>
                {/* Donut Chart with Centered Metric and No Overlapping Legend */}
                <div style={{ position: 'relative', height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyStats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {monthlyStats.pieData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            const pct = monthlyStats.totalDebit > 0 
                              ? ((item.value / monthlyStats.totalDebit) * 100).toFixed(1) 
                              : '0';
                            return (
                              <div style={{
                                background: 'rgba(16, 21, 34, 0.95)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                fontSize: '0.82rem',
                                color: '#fff'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: payload[0].color }} />
                                  <span>{item.name}</span>
                                </div>
                                <div style={{ fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-display)' }}>
                                  SAR {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.75rem', fontWeight: 500 }}>
                                    ({pct}%)
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Central Metric Inside Donut */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                      TOTAL
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: '1px' }}>
                      SAR {monthlyStats.totalDebit >= 10000 
                        ? `${(monthlyStats.totalDebit / 1000).toFixed(1)}k` 
                        : monthlyStats.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>

                {/* Ranked Category Breakdown Details with Percentages & Bars */}
                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {monthlyStats.pieData.map((item, idx) => {
                    const color = getCategoryColor(idx);
                    const pct = monthlyStats.totalDebit > 0 
                      ? ((item.value / monthlyStats.totalDebit) * 100).toFixed(1) 
                      : '0';

                    return (
                      <div 
                        key={item.name}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid var(--border-subtle)',
                          transition: 'var(--transition-smooth)'
                        }}
                        className="table-row-hover"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: color,
                              boxShadow: `0 0 8px ${color}66`,
                              flexShrink: 0
                            }} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {pct}%
                            </span>
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                              SAR {item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Visual Proportion Bar */}
                        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Coins size={20} />
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No Outflow Entries</div>
                <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Zero debit expenses logged for {selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}.
                </p>
              </div>
            )}

            {/* Quick Action in Card */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                onClick={() => handleOpenAddModal('Credit')}
                className="btn btn-secondary" 
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
              >
                <Plus size={14} /> Quick Add Transaction
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 📝 TRANSACTION MODAL (MATCHING MONGODB SCHEMA)                           */}
      {/* ========================================================================= */}
      {showTransactionModal && (
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
              <button onClick={() => setShowTransactionModal(false)} className="btn-icon">✕</button>
            </div>

            <form onSubmit={handleTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
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
                <button type="button" onClick={() => setShowTransactionModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏷️ ADD CATEGORY MODAL                                                    */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Add Ledger Category</h3>
            <form onSubmit={handleCatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
