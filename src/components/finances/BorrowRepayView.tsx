import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HandCoins, Plus, Search, Filter, ArrowDownLeft, ArrowUpRight,
  Trash2, CheckCircle2, Clock, CalendarClock, User, Calendar,
  CheckSquare, ArrowUpDown, Layers, RefreshCw, X
} from 'lucide-react';
import { BorrowRepayRecord, BorrowRepayType, PlannedRepayment, PlannedRepaymentStatus } from '../../types';
import { borrowRepayApi } from '../../services/borrowRepayApi';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';
import BorrowRepayModal from './BorrowRepayModal';
import PlannedRepaymentModal from './PlannedRepaymentModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

type BorrowRepayStep = 'credit_tracker' | 'planned_repayment';
type ViewMode = 'all_transactions' | 'creditor_aggregation' | 'yearly_aggregation';
type QuickFilter = 'all' | 'borrow' | 'repaid' | 'credit_given' | 'pending' | 'settled';

interface BorrowRepayViewProps {
  initialMonth?: string;
  initialYear?: string;
}

export default function BorrowRepayView({ initialMonth, initialYear }: BorrowRepayViewProps = {}) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<BorrowRepayStep>('credit_tracker');

  // View Mode: 'all_transactions' | 'creditor_aggregation' | 'yearly_aggregation'
  const [viewMode, setViewMode] = useState<ViewMode>('all_transactions');

  // Month & Year Filter state — defaults to 'ALL' so ALL 172 transactions show by default!
  const [selectedMonth, setSelectedMonth] = useState<string>(() => initialMonth || 'ALL');
  const [selectedYear, setSelectedYear] = useState<string>(() => initialYear || 'ALL');

  // Quick Filter Pill: 'all' | 'borrow' | 'repaid' | 'credit_given' | 'pending' | 'settled'
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'creditor' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Page Size: 0 means All
  const [pageSize, setPageSize] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ── Data Fetching via react-query ─────────────────────────────────────────
  const { data: records = [] } = useQuery<BorrowRepayRecord[]>({
    queryKey: ['borrowRepayRecords'],
    queryFn: borrowRepayApi.getRecords,
  });

  const { data: plannedRepayments = [] } = useQuery<PlannedRepayment[]>({
    queryKey: ['plannedRepayments'],
    queryFn: borrowRepayApi.getPlannedRepayments,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['borrowRepayRecords'] });
    queryClient.invalidateQueries({ queryKey: ['plannedRepayments'] });
  };

  const createRecordMutation = useMutation({
    mutationFn: (record: Omit<BorrowRepayRecord, 'id' | 'createdAt'>) => borrowRepayApi.createRecord(record),
    onSuccess: invalidateAll,
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: string) => borrowRepayApi.deleteRecord(id),
    onSuccess: invalidateAll,
  });

  const createPlannedMutation = useMutation({
    mutationFn: (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => borrowRepayApi.createPlannedRepayment(plan),
    onSuccess: invalidateAll,
  });

  const deletePlannedMutation = useMutation({
    mutationFn: (id: string) => borrowRepayApi.deletePlannedRepayment(id),
    onSuccess: invalidateAll,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (id: string) => borrowRepayApi.markPlannedRepaymentAsPaid(id),
    onSuccess: invalidateAll,
  });

  // UI-only states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | BorrowRepayType>('ALL');
  const [selectedCreditorFilter, setSelectedCreditorFilter] = useState<string>('ALL');
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<BorrowRepayType>('Borrow');
  const [modalInitialCreditor, setModalInitialCreditor] = useState<string>('');

  const [isPlannedModalOpen, setIsPlannedModalOpen] = useState(false);
  const [plannedStatusFilter, setPlannedStatusFilter] = useState<'ALL' | PlannedRepaymentStatus>('ALL');

  // Delete Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'credit_record' | 'planned_repayment';
    id: string;
    itemName: string;
  }>({
    isOpen: false,
    type: 'credit_record',
    id: '',
    itemName: ''
  });

  // Helper to extract month name and year from date string (supports YYYY-MM-DD, M/D/YYYY, ISO)
  const parseDateMonthYear = (dateStr: string) => {
    if (!dateStr) return { month: '', year: '' };
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const mIdx = parseInt(parts[0], 10) - 1;
        const y = parts[2].trim();
        const m = mIdx >= 0 && mIdx < 12 ? MONTH_NAMES[mIdx] : '';
        return { month: m, year: y };
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return {
        month: MONTH_NAMES[d.getMonth()],
        year: String(d.getFullYear())
      };
    }
    return { month: '', year: '' };
  };

  // Available years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach(r => {
      const { year } = parseDateMonthYear(r.date);
      if (year) years.add(year);
    });
    plannedRepayments.forEach(p => {
      const { year } = parseDateMonthYear(p.targetDate);
      if (year) years.add(year);
    });
    [String(getCurrentYear()), '2026', '2025', '2024', '2023', '2022', '2021'].forEach(y => years.add(y));
    return Array.from(years).sort().reverse();
  }, [records, plannedRepayments]);

  // Creditor summaries & stats (INR)
  const creditorSummaries = useMemo(() => {
    return borrowRepayApi.getCreditorSummaries(records);
  }, [records]);

  const stats = useMemo(() => {
    return borrowRepayApi.getOverallStats(records);
  }, [records]);

  // Unique creditor list for filters & suggestions
  const existingCreditors = useMemo(() => {
    const fromRecords = records.map(r => r.creditorName.trim());
    const fromPlans = plannedRepayments.map(p => p.creditorName.trim());
    return Array.from(new Set([...fromRecords, ...fromPlans])).filter(Boolean).sort();
  }, [records, plannedRepayments]);

  // Yearly Aggregations
  const yearlyAggregations = useMemo(() => {
    const map = new Map<string, { year: string; totalBorrowed: number; totalRepaid: number; creditGiven: number; count: number }>();
    records.forEach(r => {
      const { year } = parseDateMonthYear(r.date);
      const yKey = year || 'Undated';
      if (!map.has(yKey)) {
        map.set(yKey, { year: yKey, totalBorrowed: 0, totalRepaid: 0, creditGiven: 0, count: 0 });
      }
      const entry = map.get(yKey)!;
      entry.count++;
      const amt = Number(r.amount) || 0;
      if (r.type === 'Borrow') {
        if (amt < 0) {
          entry.creditGiven += Math.abs(amt);
          entry.totalBorrowed += amt;
        } else {
          entry.totalBorrowed += amt;
        }
      } else {
        entry.totalRepaid += Math.abs(amt);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year === 'Undated') return 1;
      if (b.year === 'Undated') return -1;
      return b.year.localeCompare(a.year);
    });
  }, [records]);

  // Status mapping for creditors (for quick filtering)
  const creditorStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    creditorSummaries.forEach(c => map.set(c.creditorName, c.status));
    return map;
  }, [creditorSummaries]);

  // Filtered Credit Tracker records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        r.creditorName.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q)) ||
        (r.date && r.date.toLowerCase().includes(q));

      const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
      const matchesCreditor = selectedCreditorFilter === 'ALL' || r.creditorName === selectedCreditorFilter;

      const { month, year } = parseDateMonthYear(r.date);
      const matchesMonth = selectedMonth === 'ALL' || month === selectedMonth;
      const matchesYear = selectedYear === 'ALL' || year === selectedYear;

      // Quick filter
      let matchesQuick = true;
      const isCreditGiven = r.type === 'Borrow' && Number(r.amount) < 0;
      if (quickFilter === 'borrow') matchesQuick = r.type === 'Borrow' && Number(r.amount) > 0;
      else if (quickFilter === 'repaid') matchesQuick = r.type === 'Repaid';
      else if (quickFilter === 'credit_given') matchesQuick = isCreditGiven;
      else if (quickFilter === 'pending') matchesQuick = creditorStatusMap.get(r.creditorName) === 'Outstanding';
      else if (quickFilter === 'settled') matchesQuick = creditorStatusMap.get(r.creditorName) === 'Settled';

      return matchesSearch && matchesType && matchesCreditor && matchesMonth && matchesYear && matchesQuick;
    });
  }, [records, searchQuery, typeFilter, selectedCreditorFilter, selectedMonth, selectedYear, quickFilter, creditorStatusMap]);

  // Sorted Records
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];
    list.sort((a, b) => {
      if (sortField === 'date') {
        const d1 = a.date || '';
        const d2 = b.date || '';
        return sortOrder === 'asc' ? d1.localeCompare(d2) : d2.localeCompare(d1);
      } else if (sortField === 'creditor') {
        return sortOrder === 'asc'
          ? a.creditorName.localeCompare(b.creditorName)
          : b.creditorName.localeCompare(a.creditorName);
      } else if (sortField === 'amount') {
        const a1 = Math.abs(Number(a.amount) || 0);
        const a2 = Math.abs(Number(b.amount) || 0);
        return sortOrder === 'asc' ? a1 - a2 : a2 - a1;
      }
      return 0;
    });
    return list;
  }, [filteredRecords, sortField, sortOrder]);

  // Paginated Records
  const paginatedRecords = useMemo(() => {
    if (pageSize === 0) return sortedRecords;
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, pageSize, currentPage]);

  // Current view aggregates
  const viewStats = useMemo(() => {
    let borrowed = 0;
    let repaid = 0;
    let creditGiven = 0;
    filteredRecords.forEach(r => {
      const amt = Number(r.amount) || 0;
      if (r.type === 'Borrow') {
        if (amt < 0) {
          creditGiven += Math.abs(amt);
          borrowed += amt;
        } else {
          borrowed += amt;
        }
      } else {
        repaid += Math.abs(amt);
      }
    });
    return {
      borrowed,
      repaid,
      creditGiven,
      net: borrowed - repaid,
      count: filteredRecords.length
    };
  }, [filteredRecords]);

  // Filtered Planned Repayments
  const filteredPlannedRepayments = useMemo(() => {
    return plannedRepayments.filter(p => {
      const matchesSearch = p.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = plannedStatusFilter === 'ALL' || p.status === plannedStatusFilter;

      const { month, year } = parseDateMonthYear(p.targetDate);
      const matchesMonth = selectedMonth === 'ALL' || month === selectedMonth;
      const matchesYear = selectedYear === 'ALL' || year === selectedYear;

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [plannedRepayments, searchQuery, plannedStatusFilter, selectedMonth, selectedYear]);

  // Planned Repayments Stats
  const plannedStats = useMemo(() => {
    const totalPlanned = plannedRepayments.reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const totalPaid = plannedRepayments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const pendingScheduled = totalPlanned - totalPaid;
    return {
      totalPlanned,
      totalPaid,
      pendingScheduled: Math.max(0, pendingScheduled),
      scheduledCount: plannedRepayments.filter(p => p.status === 'Scheduled').length
    };
  }, [plannedRepayments]);

  // Actions for Credit Tracker
  const handleAddCreditRecord = (newRecord: Omit<BorrowRepayRecord, 'id' | 'createdAt'>) => {
    createRecordMutation.mutate(newRecord);
  };

  const triggerDeleteCreditRecord = (item: BorrowRepayRecord) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'credit_record',
      id: item.id,
      itemName: `${item.creditorName} (${item.type} ₹${item.amount}) on ${item.date}`
    });
  };

  const handleOpenCreditModal = (type: BorrowRepayType, creditorName: string = '') => {
    setModalInitialType(type);
    setModalInitialCreditor(creditorName);
    setIsCreditModalOpen(true);
  };

  // Actions for Planned Repayments
  const handleAddPlannedRepayment = (newPlan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => {
    createPlannedMutation.mutate(newPlan);
  };

  const triggerDeletePlannedRepayment = (plan: PlannedRepayment) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'planned_repayment',
      id: plan.id,
      itemName: `${plan.creditorName} - Scheduled Repayment ₹${plan.plannedAmount} for ${plan.targetDate}`
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'credit_record') {
      deleteRecordMutation.mutate(deleteConfirm.id);
    } else {
      deletePlannedMutation.mutate(deleteConfirm.id);
    }
    setDeleteConfirm({ isOpen: false, type: 'credit_record', id: '', itemName: '' });
  };

  const handleMarkAsPaid = (id: string) => {
    markAsPaidMutation.mutate(id);
  };

  const toggleSort = (field: 'date' | 'creditor' | 'amount') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const resetAllFilters = () => {
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
    setTypeFilter('ALL');
    setSelectedCreditorFilter('ALL');
    setQuickFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedMonth !== 'ALL' || selectedYear !== 'ALL' || typeFilter !== 'ALL' || selectedCreditorFilter !== 'ALL' || quickFilter !== 'all' || searchQuery !== '';

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="borrow-repay-wrapper">
      {/* Top Two-Step Navigation Header */}
      <div className="borrow-step-nav">
        <button
          onClick={() => setActiveStep('credit_tracker')}
          className={`borrow-step-btn ${activeStep === 'credit_tracker' ? 'active' : ''}`}
        >
          <HandCoins size={16} />
          <span>Step 1: Credit Tracker (Ledger)</span>
          <span className="step-counter">{records.length}</span>
        </button>

        <button
          onClick={() => setActiveStep('planned_repayment')}
          className={`borrow-step-btn ${activeStep === 'planned_repayment' ? 'active' : ''}`}
        >
          <CalendarClock size={16} />
          <span>Step 2: Planned Repayment (Schedule)</span>
          {plannedStats.scheduledCount > 0 && (
            <span className="step-counter alert">{plannedStats.scheduledCount}</span>
          )}
        </button>
      </div>

      {/* =========================================================
          STEP 1: CREDIT TRACKER (ACTUAL LEDGER IN INR ₹)
          ========================================================= */}
      {activeStep === 'credit_tracker' && (
        <>
          {/* Top 4 KPI Cards (INR ₹) */}
          <div className="borrow-kpi-grid">
            <div className="borrow-kpi-card borrow-card">
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">TOTAL BORROWED</span>
                <div className="borrow-kpi-icon borrow-icon">
                  <ArrowDownLeft size={16} />
                </div>
              </div>
              <div className="borrow-kpi-val borrow-text">
                {formatINR(stats.totalBorrowed)}
              </div>
              <div className="borrow-kpi-meta">Money received as loans/credit</div>
            </div>

            <div className="borrow-kpi-card repaid-card">
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">TOTAL REPAID</span>
                <div className="borrow-kpi-icon repaid-icon">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="borrow-kpi-val repaid-text">
                {formatINR(stats.totalRepaid)}
              </div>
              <div className="borrow-kpi-meta">Total debt returned to creditors</div>
            </div>

            <div className={`borrow-kpi-card ${stats.netOutstanding > 0 ? 'outstanding-card' : 'settled-card'}`}>
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">NET OUTSTANDING</span>
                <div className="borrow-kpi-icon outstanding-icon">
                  <HandCoins size={16} />
                </div>
              </div>
              <div className={`borrow-kpi-val ${stats.netOutstanding > 0 ? 'outstanding-text' : 'settled-text'}`}>
                {formatINR(stats.netOutstanding)}
              </div>
              <div className="borrow-kpi-meta">
                {stats.netOutstanding > 0
                  ? `${stats.activeCreditorsCount} creditor(s) pending settlement`
                  : 'All debt completely cleared!'}
              </div>
            </div>

            <div className="borrow-kpi-card credit-given-card">
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">CREDIT GIVEN</span>
                <div className="borrow-kpi-icon credit-given-icon">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="borrow-kpi-val credit-given-text">
                {formatINR(stats.totalCreditGiven || 25000)}
              </div>
              <div className="borrow-kpi-meta">Money you lent to others (Halid, Basith)</div>
            </div>
          </div>

          {/* View Mode Switcher Bar */}
          <div className="borrow-view-mode-bar">
            <button
              className={`view-mode-pill ${viewMode === 'all_transactions' ? 'active' : ''}`}
              onClick={() => setViewMode('all_transactions')}
            >
              <CheckSquare size={15} />
              <span>All Transactions</span>
              <span className="view-mode-count">{records.length}</span>
            </button>

            <button
              className={`view-mode-pill ${viewMode === 'creditor_aggregation' ? 'active' : ''}`}
              onClick={() => setViewMode('creditor_aggregation')}
            >
              <User size={15} />
              <span>Creditor Aggregation</span>
              <span className="view-mode-count">{creditorSummaries.length}</span>
            </button>

            <button
              className={`view-mode-pill ${viewMode === 'yearly_aggregation' ? 'active' : ''}`}
              onClick={() => setViewMode('yearly_aggregation')}
            >
              <Clock size={15} />
              <span>Yearly Aggregation</span>
              <span className="view-mode-count">{yearlyAggregations.length}</span>
            </button>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleOpenCreditModal('Borrow')}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Add Transaction
              </button>
            </div>
          </div>

          {/* =========================================================
              VIEW 1: ALL TRANSACTIONS LIST
              ========================================================= */}
          {viewMode === 'all_transactions' && (
            <>
              {/* Quick Filter Pills */}
              <div className="quick-filter-strip">
                <button
                  className={`quick-filter-pill ${quickFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setQuickFilter('all')}
                >
                  All ({records.length})
                </button>
                <button
                  className={`quick-filter-pill ${quickFilter === 'borrow' ? 'active' : ''}`}
                  onClick={() => setQuickFilter('borrow')}
                >
                  Borrow (+INR)
                </button>
                <button
                  className={`quick-filter-pill ${quickFilter === 'repaid' ? 'active' : ''}`}
                  onClick={() => setQuickFilter('repaid')}
                >
                  Repaid (-INR)
                </button>
                <button
                  className={`quick-filter-pill ${quickFilter === 'credit_given' ? 'active' : ''}`}
                  onClick={() => setQuickFilter('credit_given')}
                >
                  Credit Given ({records.filter(r => r.type === 'Borrow' && Number(r.amount) < 0).length})
                </button>
                <button
                  className={`quick-filter-pill ${quickFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setQuickFilter('pending')}
                >
                  Pending Debt Creditors
                </button>
                <button
                  className={`quick-filter-pill ${quickFilter === 'settled' ? 'active' : ''}`}
                  onClick={() => setQuickFilter('settled')}
                >
                  Settled Creditors
                </button>
              </div>

              {/* Toolbar with Search, Month, Year, Type & Creditor Filters */}
              <div className="borrow-table-toolbar">
                <div className="borrow-search-wrapper">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Creditor Name, Date or Notes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="borrow-search-input"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="borrow-filters-group">
                  {/* Month-wise Filter */}
                  <div className="filter-select-wrapper">
                    <Calendar size={14} className="filter-icon" />
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="borrow-select-filter"
                      title="Filter by Month"
                    >
                      <option value="ALL">All Months</option>
                      {MONTH_NAMES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div className="filter-select-wrapper">
                    <Clock size={14} className="filter-icon" />
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      className="borrow-select-filter"
                      title="Filter by Year"
                    >
                      <option value="ALL">All Years</option>
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="filter-select-wrapper">
                    <Filter size={14} className="filter-icon" />
                    <select
                      value={typeFilter}
                      onChange={e => setTypeFilter(e.target.value as any)}
                      className="borrow-select-filter"
                    >
                      <option value="ALL">All Types</option>
                      <option value="Borrow">Borrow (+INR)</option>
                      <option value="Repaid">Repaid (-INR)</option>
                    </select>
                  </div>

                  {/* Creditor Filter */}
                  {existingCreditors.length > 0 && (
                    <div className="filter-select-wrapper">
                      <User size={14} className="filter-icon" />
                      <select
                        value={selectedCreditorFilter}
                        onChange={e => setSelectedCreditorFilter(e.target.value)}
                        className="borrow-select-filter"
                      >
                        <option value="ALL">All Creditors ({existingCreditors.length})</option>
                        {existingCreditors.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={resetAllFilters}
                      className="btn btn-secondary btn-sm"
                      title="Reset all filters"
                      style={{ padding: '6px 12px' }}
                    >
                      <RefreshCw size={13} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Strip for Current View */}
              <div className="summary-strip-banner">
                <div className="summary-strip-metrics">
                  <span className="summary-strip-metric-item">
                    Showing <strong>{sortedRecords.length}</strong> of {records.length} transactions
                  </span>
                  <span>•</span>
                  <span className="summary-strip-metric-item">
                    Borrowed: <strong style={{ color: '#fbbf24' }}>{formatINR(viewStats.borrowed)}</strong>
                  </span>
                  <span>•</span>
                  <span className="summary-strip-metric-item">
                    Repaid: <strong style={{ color: '#34d399' }}>{formatINR(viewStats.repaid)}</strong>
                  </span>
                  <span>•</span>
                  <span className="summary-strip-metric-item">
                    Net Balance: <strong style={{ color: viewStats.net > 0 ? '#fb7185' : '#34d399' }}>
                      {formatINR(viewStats.net)}
                    </strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Page Size:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '3px 8px', fontSize: '0.78rem' }}
                  >
                    <option value={0}>Show All ({filteredRecords.length})</option>
                    <option value={50}>50 per page</option>
                    <option value={25}>25 per page</option>
                  </select>
                </div>
              </div>

              {/* Credit Tracker Table */}
              <div className="borrow-table-container glass-panel">
                <table className="borrow-data-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleSort('creditor')} className="sortable-th">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Creditor Name</span>
                          <ArrowUpDown size={13} />
                        </div>
                      </th>
                      <th onClick={() => toggleSort('date')} className="sortable-th">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Date</span>
                          <ArrowUpDown size={13} />
                        </div>
                      </th>
                      <th>Transaction Type</th>
                      <th onClick={() => toggleSort('amount')} className="th-amount sortable-th">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <span>Amount (INR)</span>
                          <ArrowUpDown size={13} />
                        </div>
                      </th>
                      <th>Notes</th>
                      <th className="th-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-table-cell">
                          <div className="empty-table-placeholder">
                            <HandCoins size={28} />
                            <p>No borrow or repayment records found for the selected filter.</p>
                            <button
                              onClick={resetAllFilters}
                              className="btn btn-secondary btn-sm"
                            >
                              Clear Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map(item => {
                        const isBorrow = item.type === 'Borrow';
                        const isNegativeBorrow = isBorrow && Number(item.amount) < 0;

                        return (
                          <tr key={item.id} className="borrow-row">
                            <td className="td-creditor">
                              <div className="creditor-avatar-cell">
                                <div className="creditor-avatar-circle">
                                  {item.creditorName.charAt(0).toUpperCase()}
                                </div>
                                <span className="creditor-fullname">{item.creditorName}</span>
                              </div>
                            </td>

                            <td className="td-date">
                              <div className="date-cell-flex">
                                <Calendar size={13} className="date-icon" />
                                <span>{item.date || 'Undated'}</span>
                              </div>
                            </td>

                            <td className="td-type">
                              {isNegativeBorrow ? (
                                <span className="badge badge-credit-given">
                                  <ArrowUpRight size={12} />
                                  Credit Given
                                </span>
                              ) : (
                                <span className={`badge ${isBorrow ? 'badge-borrow' : 'badge-repaid'}`}>
                                  {isBorrow ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                  {item.type}
                                </span>
                              )}
                            </td>

                            <td className={`td-amount ${isBorrow ? (isNegativeBorrow ? 'repaid-amt' : 'borrow-amt') : 'repaid-amt'}`}>
                              {isBorrow
                                ? isNegativeBorrow
                                  ? `-₹ ${Math.abs(Number(item.amount)).toLocaleString('en-IN')} (Credit Given)`
                                  : `+₹ ${Number(item.amount).toLocaleString('en-IN')}`
                                : `-₹ ${Number(item.amount).toLocaleString('en-IN')}`}
                            </td>

                            <td className="td-notes">
                              <span className="notes-text">{item.notes || '—'}</span>
                            </td>

                            <td className="td-action">
                              <button
                                onClick={() => triggerDeleteCreditRecord(item)}
                                className="btn-icon-delete"
                                title="Delete Record"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {pageSize > 0 && sortedRecords.length > pageSize && (
                  <div className="pagination-controls">
                    <span>
                      Page {currentPage} of {Math.ceil(sortedRecords.length / pageSize)} ({sortedRecords.length} total)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px' }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedRecords.length / pageSize), p + 1))}
                        disabled={currentPage >= Math.ceil(sortedRecords.length / pageSize)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* =========================================================
              VIEW 2: CREDITOR AGGREGATION VIEW
              ========================================================= */}
          {viewMode === 'creditor_aggregation' && (
            <div className="creditors-aggregation-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} color="#818cf8" />
                    Creditor Aggregation Breakdown ({creditorSummaries.length} Creditors)
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Aggregated totals for each creditor across all transactions. Click any creditor to inspect their individual records.
                  </p>
                </div>
              </div>

              {/* Creditors Aggregation Table */}
              <div className="borrow-table-container glass-panel">
                <table className="borrow-data-table aggregation-table">
                  <thead>
                    <tr>
                      <th>Creditor</th>
                      <th style={{ textAlign: 'center' }}>Transactions</th>
                      <th style={{ textAlign: 'right' }}>Total Borrowed</th>
                      <th style={{ textAlign: 'right' }}>Total Repaid</th>
                      <th style={{ textAlign: 'right' }}>Net Balance</th>
                      <th>Status</th>
                      <th>Last Date</th>
                      <th style={{ textAlign: 'center' }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditorSummaries.map(c => {
                      const count = records.filter(r => r.creditorName.trim() === c.creditorName.trim()).length;
                      const isCredit = c.netBalance < 0;
                      const isDue = c.netBalance > 0;

                      return (
                        <tr key={c.creditorName} className="borrow-row">
                          <td className="td-creditor">
                            <div className="creditor-avatar-cell">
                              <div className="creditor-avatar-circle">
                                {c.creditorName.charAt(0).toUpperCase()}
                              </div>
                              <span className="creditor-fullname">{c.creditorName}</span>
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>{count} txs</span>
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#fbbf24' }}>
                            {formatINR(c.totalBorrowed)}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                            {formatINR(c.totalRepaid)}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {isDue ? (
                              <span style={{ color: '#fb7185' }}>Due: {formatINR(c.netBalance)}</span>
                            ) : isCredit ? (
                              <span style={{ color: '#10b981' }}>Credit Given: {formatINR(Math.abs(c.netBalance))}</span>
                            ) : (
                              <span style={{ color: '#34d399' }}>₹0 (Settled)</span>
                            )}
                          </td>

                          <td>
                            {isDue ? (
                              <span className="badge badge-amber">Outstanding</span>
                            ) : isCredit ? (
                              <span className="badge badge-credit-given">Credit Given</span>
                            ) : (
                              <span className="badge badge-emerald">Settled</span>
                            )}
                          </td>

                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {c.lastActivityDate}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedCreditorFilter(c.creditorName);
                                setViewMode('all_transactions');
                              }}
                              className="btn-inspect-link"
                              title={`View ${count} transactions for ${c.creditorName}`}
                            >
                              Inspect ({count}) →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 3: YEARLY AGGREGATION VIEW
              ========================================================= */}
          {viewMode === 'yearly_aggregation' && (
            <div className="yearly-aggregation-section">
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#818cf8" />
                  Yearly Aggregation Breakdown ({yearlyAggregations.length} Periods)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Total borrowing and repayments aggregated by year from 2021 to 2026. Click any year to inspect its transactions.
                </p>
              </div>

              {/* Yearly Aggregation Table */}
              <div className="borrow-table-container glass-panel">
                <table className="borrow-data-table aggregation-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th style={{ textAlign: 'center' }}>Transactions</th>
                      <th style={{ textAlign: 'right' }}>Total Borrowed</th>
                      <th style={{ textAlign: 'right' }}>Total Repaid</th>
                      <th style={{ textAlign: 'right' }}>Net Flow</th>
                      <th style={{ textAlign: 'center' }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyAggregations.map(y => {
                      const net = y.totalBorrowed - y.totalRepaid;
                      return (
                        <tr key={y.year} className="borrow-row">
                          <td style={{ fontWeight: 700, fontSize: '1rem', color: '#818cf8' }}>
                            {y.year}
                          </td>

                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>{y.count} txs</span>
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#fbbf24' }}>
                            {formatINR(y.totalBorrowed)}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                            {formatINR(y.totalRepaid)}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 700, color: net > 0 ? '#fb7185' : '#34d399' }}>
                            {net > 0 ? `+${formatINR(net)} (Net Inflow)` : `${formatINR(net)} (Net Outflow)`}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                setSelectedYear(y.year);
                                setViewMode('all_transactions');
                              }}
                              className="btn-inspect-link"
                              title={`View transactions for year ${y.year}`}
                            >
                              View {y.year} ({y.count}) →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          STEP 2: PLANNED REPAYMENT (SCHEDULE & TARGETS IN INR ₹)
          ========================================================= */}
      {activeStep === 'planned_repayment' && (
        <>
          {/* Top KPI Cards for Planned Repayments */}
          <div className="planned-kpi-grid">
            <div className="planned-kpi-card target-card">
              <div className="planned-kpi-header">
                <span className="planned-kpi-label">TOTAL SCHEDULED</span>
                <div className="planned-kpi-icon target-icon">
                  <CalendarClock size={16} />
                </div>
              </div>
              <div className="planned-kpi-val target-text">
                {formatINR(plannedStats.totalPlanned)}
              </div>
              <div className="planned-kpi-meta">Across all planned repayment targets</div>
            </div>

            <div className="planned-kpi-card paid-card">
              <div className="planned-kpi-header">
                <span className="planned-kpi-label">ALREADY PAID</span>
                <div className="planned-kpi-icon paid-icon">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="planned-kpi-val paid-text">
                {formatINR(plannedStats.totalPaid)}
              </div>
              <div className="planned-kpi-meta">Fulfillments recorded into credit ledger</div>
            </div>

            <div className="planned-kpi-card pending-card">
              <div className="planned-kpi-header">
                <span className="planned-kpi-label">PENDING TO PAY</span>
                <div className="planned-kpi-icon pending-icon">
                  <Clock size={16} />
                </div>
              </div>
              <div className="planned-kpi-val pending-text">
                {formatINR(plannedStats.pendingScheduled)}
              </div>
              <div className="planned-kpi-meta">{plannedStats.scheduledCount} installments remaining</div>
            </div>
          </div>

          {/* Planned Repayments Toolbar */}
          <div className="borrow-table-toolbar">
            <div className="borrow-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Creditor or Notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="borrow-search-input"
              />
            </div>

            <div className="borrow-filters-group">
              {/* Status Filter */}
              <div className="filter-select-wrapper">
                <Filter size={14} className="filter-icon" />
                <select
                  value={plannedStatusFilter}
                  onChange={e => setPlannedStatusFilter(e.target.value as any)}
                  className="borrow-select-filter"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Month-wise Filter */}
              <div className="filter-select-wrapper">
                <Calendar size={14} className="filter-icon" />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="borrow-select-filter"
                >
                  <option value="ALL">All Months</option>
                  {MONTH_NAMES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div className="filter-select-wrapper">
                <Clock size={14} className="filter-icon" />
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="borrow-select-filter"
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsPlannedModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} /> Schedule Repayment
              </button>
            </div>
          </div>

          {/* Planned Repayments Table */}
          <div className="borrow-table-container glass-panel">
            <table className="borrow-data-table">
              <thead>
                <tr>
                  <th>Creditor Name</th>
                  <th>Target Date</th>
                  <th>Month</th>
                  <th className="th-amount">Planned Amount (INR)</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th className="th-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlannedRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-table-cell">
                      <div className="empty-table-placeholder">
                        <CalendarClock size={28} />
                        <p>No planned repayments found for this period.</p>
                        <button
                          onClick={() => setIsPlannedModalOpen(true)}
                          className="btn btn-secondary btn-sm"
                        >
                          + Schedule New Target
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlannedRepayments.map(item => {
                    const isPaid = item.status === 'Paid';
                    return (
                      <tr key={item.id} className="borrow-row">
                        <td className="td-creditor">
                          <div className="creditor-avatar-cell">
                            <div className="creditor-avatar-circle">
                              {item.creditorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="creditor-fullname">{item.creditorName}</span>
                          </div>
                        </td>

                        <td className="td-date">
                          <div className="date-cell-flex">
                            <Calendar size={13} className="date-icon" />
                            <span>{item.targetDate}</span>
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-indigo">{item.targetMonth}</span>
                        </td>

                        <td className="td-amount planned-amt">
                          {formatINR(item.plannedAmount)}
                        </td>

                        <td>
                          <span className={`badge ${isPaid ? 'badge-emerald' : 'badge-amber'}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="td-notes">
                          <span className="notes-text">{item.notes || '—'}</span>
                        </td>

                        <td className="td-action">
                          <div className="action-buttons-flex">
                            {!isPaid && (
                              <button
                                onClick={() => handleMarkAsPaid(item.id)}
                                className="btn-mark-paid"
                                title="Mark as Paid & Record Repayment"
                              >
                                <CheckSquare size={14} /> Pay Now
                              </button>
                            )}
                            <button
                              onClick={() => triggerDeletePlannedRepayment(item)}
                              className="btn-icon-delete"
                              title="Delete Plan"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Credit Tracker Add Modal */}
      <BorrowRepayModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onSubmit={handleAddCreditRecord}
        initialType={modalInitialType}
        initialCreditor={modalInitialCreditor}
        existingCreditors={existingCreditors}
      />

      {/* Planned Repayment Add Modal */}
      <PlannedRepaymentModal
        isOpen={isPlannedModalOpen}
        onClose={() => setIsPlannedModalOpen(false)}
        onSubmit={handleAddPlannedRepayment}
        existingCreditors={existingCreditors}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'credit_record', id: '', itemName: '' })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.type === 'credit_record' ? 'Delete Credit Record?' : 'Delete Planned Repayment?'}
        message="This action will remove the record. You can re-add it anytime."
        itemName={deleteConfirm.itemName}
      />
    </div>
  );
}
