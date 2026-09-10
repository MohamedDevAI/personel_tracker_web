import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi, MONTH_NAMES } from '../services/expenseApi';
import { Plus, Tag, ArrowDownRight, CheckCircle2, Search } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { parseTxDate } from '../components/finances/financeConstants';
import MonthYearFilter from '../components/finances/MonthYearFilter';
import FinanceSummaryCards from '../components/finances/FinanceSummaryCards';
import TransactionTable from '../components/finances/TransactionTable';
import OutflowBreakdownCard from '../components/finances/OutflowBreakdownCard';
import CategoryTable from '../components/finances/CategoryTable';
import TransactionModal from '../components/finances/TransactionModal';
import CategoryModal from '../components/finances/CategoryModal';
import FinanceTabsHeader, { FinanceTabKey } from '../components/finances/FinanceTabsHeader';
import BorrowRepayView from '../components/finances/BorrowRepayView';
import PlannedExpensesView from '../components/finances/PlannedExpensesView';
import FinanceAnalyticsReportView from '../components/finances/FinanceAnalyticsReportView';
import { borrowRepayApi } from '../services/borrowRepayApi';
import { plannedExpenseApi } from '../services/plannedExpenseApi';
import '../components/finances/finances.css';

export default function ExpenseTracker() {
  const queryClient = useQueryClient();

  // Top-level Finance Hub Tab
  const [financeMainTab, setFinanceMainTab] = useState<FinanceTabKey>('ledger');

  // Queries
  const { data: transactions = [], isLoading: isTxsLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: expenseApi.getTransactions
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => expenseApi.getCategories()
  });

  // Dynamic pill counters for sub-tabs
  const outstandingDebtCount = useMemo(() => {
    return borrowRepayApi.getCreditorSummaries().filter(s => s.netBalance > 0).length;
  }, [financeMainTab]);

  const activePlansCount = useMemo(() => {
    return plannedExpenseApi.getPlannedExpenses().filter(p => p.status === 'Planned').length;
  }, [financeMainTab]);

  // UI States for Ledger
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>('Mar'); // 'All' or 'Jan'..'Dec'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Credit' | 'Debit'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

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
    },
    onError: (err: any) => {
      console.error('Failed to create transaction:', err);
      alert('Failed to save transaction: ' + (err.response?.data?.message || err.message));
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

      if (categoryFilter !== 'ALL') {
        const cat = (tx.category || tx.categoryName || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
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
  }, [transactions, selectedYear, selectedMonth, typeFilter, categoryFilter, searchQuery]);

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
    <div className="finances-container">

      {/* Page Header */}
      <div className="finances-header">
        <div className="finances-header-info">
          <div className="finances-header-badge-row">
            <span className="finances-records-count">
              Total Transactions: {transactions.length}
            </span>
          </div>
          <h1 className="finances-header-title">
            Personal <span className="emerald-gradient-text">Finance Hub</span>
          </h1>
          <p className="finances-header-subtitle">
            Track expenses, plan monthly budgets, manage money borrowed & repaid, and inspect combined financial intelligence.
          </p>
        </div>

        <div className="finances-header-actions">
          {financeMainTab === 'ledger' && (
            <>
              <button onClick={() => setShowCategoryModal(true)} className="btn btn-secondary">
                <Tag size={16} /> Add Category
              </button>
              <button
                onClick={() => handleOpenAddModal('Debit')}
                className="btn btn-secondary btn-log-expense"
              >
                <ArrowDownRight size={16} /> Log Expense
              </button>
              <button onClick={() => handleOpenAddModal('Credit')} className="btn btn-primary">
                <Plus size={16} /> Log Transaction
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4-Tab Finance Hub Sub-Navigation Bar */}
      <FinanceTabsHeader
        activeTab={financeMainTab}
        onSelectTab={setFinanceMainTab}
        outstandingDebtCount={outstandingDebtCount}
        activePlansCount={activePlansCount}
      />

      {/* View 1: Expense Tracked (Monthly Financial Ledger) */}
      {financeMainTab === 'ledger' && (
        <>
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
          <div className="finances-main-grid">

            {/* Left Column: Persistent Tab Switcher + Equal-Height Scrollable Tables */}
            <div className="finances-left-column">

              {/* Persistent View Switcher & Toolbar */}
              <div className="finances-table-toolbar">

                {/* View switcher tabs (Always visible!) */}
                <div className="finances-tabs-group">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={activeTab === 'transactions' ? 'btn btn-primary finances-tab-btn' : 'btn btn-secondary finances-tab-btn'}
                  >
                    Transactions List ({filteredTransactions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('categories')}
                    className={activeTab === 'categories' ? 'btn btn-primary finances-tab-btn' : 'btn btn-secondary finances-tab-btn'}
                  >
                    Categories ({categories.length})
                  </button>
                </div>

                {/* Filter toolbar if transactions tab, or Add Category if categories tab */}
                {activeTab === 'transactions' ? (
                  <div className="finances-toolbar-actions">
                    <div className="finances-search-box">
                      <Search size={14} className="finances-search-icon" />
                      <input
                        type="text"
                        placeholder="Search note, category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="finances-search-input"
                      />
                    </div>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="finances-type-select"
                    >
                      <option value="ALL">All Types</option>
                      <option value="Credit">Credit (+)</option>
                      <option value="Debit">Debit (-)</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="finances-type-select"
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id || c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="btn btn-secondary finances-add-cat-btn"
                  >
                    <Tag size={14} /> Add Category
                  </button>
                )}
              </div>

              {/* Table Component with 90vh height and internal scrolling */}
              {activeTab === 'transactions' ? (
                <TransactionTable
                  transactions={filteredTransactions}
                  categories={categories}
                  isLoading={isTxsLoading}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onDeleteTransaction={(id) => deleteTransactionMutation.mutate(id)}
                  onOpenAddModal={handleOpenAddModal}
                />
              ) : (
                <CategoryTable
                  categories={categories}
                  onDeleteCategory={(id) => deleteCategoryMutation.mutate(id)}
                />
              )}
            </div>

            {/* Right Column: Donut Chart & Ranked Categories (Height matches 90vh) */}
            <div className="finances-analytics-col">
              <div className="finances-analytics-header">
                <span className="finances-analytics-title">
                  SPENDING ANALYTICS
                </span>
              </div>
              <OutflowBreakdownCard
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                totalDebit={monthlyStats.totalDebit}
                pieData={monthlyStats.pieData}
                onOpenAddModal={handleOpenAddModal}
              />
            </div>
          </div>
        </>
      )}

      {/* View 2: Planned Expenses */}
      {financeMainTab === 'planned' && (
        <PlannedExpensesView
          categories={categories}
          transactions={transactions}
        />
      )}

      {/* View 3: Borrow and Repay (Dedicated Creditor Tracker in INR ₹) */}
      {financeMainTab === 'borrow_repay' && (
        <BorrowRepayView />
      )}

      {/* View 4: Analytics and Report (Unified Combination) */}
      {financeMainTab === 'analytics' && (
        <FinanceAnalyticsReportView
          transactions={transactions}
          categories={categories}
        />
      )}

      {/* Add Transaction Dialog */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        categories={categories}
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
