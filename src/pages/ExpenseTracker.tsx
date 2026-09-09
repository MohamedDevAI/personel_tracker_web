import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi, MONTH_NAMES } from '../services/expenseApi';
import { Plus, Tag, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { parseTxDate } from '../components/finances/financeConstants';
import MonthYearFilter from '../components/finances/MonthYearFilter';
import FinanceSummaryCards from '../components/finances/FinanceSummaryCards';
import TransactionTable from '../components/finances/TransactionTable';
import OutflowBreakdownCard from '../components/finances/OutflowBreakdownCard';
import CategoryTable from '../components/finances/CategoryTable';
import TransactionModal from '../components/finances/TransactionModal';
import CategoryModal from '../components/finances/CategoryModal';

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
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('Mar'); // 'All' or 'Jan'..'Dec'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Credit' | 'Debit'>('ALL');

  // Modal States
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('Credit');

  // Mutations
  const addTransactionMutation = useMutation({
    mutationFn: expenseApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: expenseApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: expenseApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: expenseApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  // Unique available years
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

  // Counts per month for selected year
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

  // Total transactions for selected year
  const totalTransactionsForYear = useMemo(() => {
    return transactions.filter(t => parseTxDate(t).year === selectedYear).length;
  }, [transactions, selectedYear]);

  // Filtered transactions for active month & year
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

  // Month navigation
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

  // Open transaction modal
  const handleOpenAddModal = (forceType: TransactionType = 'Credit') => {
    setModalType(forceType);
    setShowTransactionModal(true);
  };

  // Default date for modal based on selection
  const modalDefaultDate = useMemo(() => {
    const monthIdx = selectedMonth !== 'All' ? MONTH_NAMES.indexOf(selectedMonth as any) : new Date().getMonth();
    const safeMonthIdx = monthIdx >= 0 ? monthIdx : 2; // Mar
    const monthNum = String(safeMonthIdx + 1).padStart(2, '0');
    return `${selectedYear}-${monthNum}-01`;
  }, [selectedMonth, selectedYear]);

  const modalDefaultMonth = useMemo(() => {
    const monthIdx = selectedMonth !== 'All' ? MONTH_NAMES.indexOf(selectedMonth as any) : new Date().getMonth();
    return MONTH_NAMES[monthIdx >= 0 ? monthIdx : 2];
  }, [selectedMonth]);

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
          <button 
            onClick={() => handleOpenAddModal('Debit')} 
            className="btn btn-secondary" 
            style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
          >
            <ArrowDownRight size={16} /> Log Expense
          </button>
          <button onClick={() => handleOpenAddModal('Credit')} className="btn btn-primary">
            <Plus size={16} /> Log Transaction
          </button>
        </div>
      </div>

      {/* Year & Month Filter Toolbar */}
      <MonthYearFilter
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        availableYears={availableYears}
        monthlyTransactionCounts={monthlyTransactionCounts}
        totalTransactionsForYear={totalTransactionsForYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Dynamic Monthly KPI Cards */}
      <FinanceSummaryCards
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        totalCredit={monthlyStats.totalCredit}
        totalDebit={monthlyStats.totalDebit}
        netBalance={monthlyStats.netBalance}
        transactionCount={monthlyStats.count}
      />

      {/* Main Grid: Transactions / Categories on Left, Outflow Breakdown on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column */}
        {activeTab === 'transactions' ? (
          <TransactionTable
            transactions={filteredTransactions}
            isLoading={isTxsLoading}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categoriesCount={categories.length}
            onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
            onOpenAddModal={handleOpenAddModal}
          />
        ) : (
          <CategoryTable
            categories={categories}
            onDeleteCategory={(id) => deleteCategoryMutation.mutate(id)}
          />
        )}

        {/* Right Column: Donut Chart & Ranked Categories */}
        <OutflowBreakdownCard
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          totalDebit={monthlyStats.totalDebit}
          pieData={monthlyStats.pieData}
          onOpenAddModal={handleOpenAddModal}
        />
      </div>

      {/* Add Transaction Dialog */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSubmit={(txData) => {
          addTransactionMutation.mutate({
            ...txData,
            amountSar: txData.amount,
            note: txData.description,
            transactionDate: txData.date
          });
        }}
        initialDate={modalDefaultDate}
        initialMonth={modalDefaultMonth}
        initialType={modalType}
      />

      {/* Add Category Dialog */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={(catData) => addCategoryMutation.mutate(catData)}
      />

    </div>
  );
}
