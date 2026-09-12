import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HandCoins, Plus, Search, Filter, ArrowDownLeft, ArrowUpRight,
  Trash2, CheckCircle2, Clock, CalendarClock, User, Calendar,
  CheckSquare, Table2, LayoutGrid, X, RotateCcw, Check
} from 'lucide-react';
import { BorrowRepayRecord, BorrowRepayType, PlannedRepayment, PlannedRepaymentStatus } from '../../types';
import { borrowRepayApi } from '../../services/borrowRepayApi';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear } from '../../utils/dateHelpers';
import BorrowRepayModal from './BorrowRepayModal';
import PlannedRepaymentModal from './PlannedRepaymentModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

type BorrowRepayStep = 'credit_tracker' | 'aggregation' | 'planned_repayment';

interface BorrowRepayViewProps {
  initialMonth?: string;
  initialYear?: string;
}

export default function BorrowRepayView({ initialMonth, initialYear }: BorrowRepayViewProps = {}) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<BorrowRepayStep>('credit_tracker');

  // Month & Year Filter state (shared across both steps) — defaults to 'ALL'
  const [selectedMonth, setSelectedMonth] = useState<string>(() => initialMonth || 'ALL');
  const [selectedYear, setSelectedYear] = useState<string>(() => initialYear || 'ALL');

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
  const [aggSearchQuery, setAggSearchQuery] = useState('');
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
    // Add default years if empty
    [String(getCurrentYear()), '2025', '2026'].forEach(y => years.add(y));
    return Array.from(years).sort().reverse();
  }, [records, plannedRepayments]);

  // Creditor summaries & stats (INR)
  const creditorSummaries = useMemo(() => {
    return borrowRepayApi.getCreditorSummaries(records);
  }, [records]);

  const stats = useMemo(() => {
    return borrowRepayApi.getOverallStats(records);
  }, [records]);

  // Unique creditor list for filters & suggestions (sorted alphabetically)
  const existingCreditors = useMemo(() => {
    const fromRecords = records.map(r => r.creditorName.trim());
    const fromPlans = plannedRepayments.map(p => p.creditorName.trim());
    return Array.from(new Set([...fromRecords, ...fromPlans]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [records, plannedRepayments]);

  // Filtered Credit Tracker records (with Month-wise & Year-wise filtering)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
      const matchesCreditor = selectedCreditorFilter === 'ALL' || r.creditorName === selectedCreditorFilter;

      const { month, year } = parseDateMonthYear(r.date);
      const matchesMonth = selectedMonth === 'ALL' || month === selectedMonth;
      const matchesYear = selectedYear === 'ALL' || year === selectedYear;

      return matchesSearch && matchesType && matchesCreditor && matchesMonth && matchesYear;
    });
  }, [records, searchQuery, typeFilter, selectedCreditorFilter, selectedMonth, selectedYear]);

  // Subtotals for currently filtered transactions
  const activeFilterTotals = useMemo(() => {
    let borrowed = 0;
    let repaid = 0;
    let creditGiven = 0;
    filteredRecords.forEach(r => {
      const amt = Number(r.amount) || 0;
      if (r.type === 'Borrow') {
        if (amt < 0) creditGiven += Math.abs(amt);
        else borrowed += amt;
      } else {
        repaid += Math.abs(amt);
      }
    });
    return {
      borrowed,
      repaid,
      creditGiven,
      net: borrowed - repaid - creditGiven
    };
  }, [filteredRecords]);

  // Filtered Creditor Summaries for the Aggregation Tab
  const filteredCreditorSummaries = useMemo(() => {
    if (!aggSearchQuery.trim()) return creditorSummaries;
    const q = aggSearchQuery.toLowerCase();
    return creditorSummaries.filter(c => c.creditorName.toLowerCase().includes(q));
  }, [creditorSummaries, aggSearchQuery]);

  // Yearly Aggregations for the Aggregation Tab
  const yearlySummaries = useMemo(() => {
    const yearMap: Record<string, {
      year: string;
      totalBorrowed: number;
      totalRepaid: number;
      creditGiven: number;
      txCount: number;
    }> = {};

    records.forEach(r => {
      const { year } = parseDateMonthYear(r.date);
      if (!year) return;
      if (!yearMap[year]) {
        yearMap[year] = { year, totalBorrowed: 0, totalRepaid: 0, creditGiven: 0, txCount: 0 };
      }
      yearMap[year].txCount += 1;
      const amt = Number(r.amount) || 0;
      if (r.type === 'Borrow') {
        if (amt < 0) yearMap[year].creditGiven += Math.abs(amt);
        else yearMap[year].totalBorrowed += amt;
      } else {
        yearMap[year].totalRepaid += Math.abs(amt);
      }
    });

    return Object.values(yearMap).sort((a, b) => b.year.localeCompare(a.year));
  }, [records]);

  // Filtered Planned Repayments (with Month-wise & Year-wise filtering)
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

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="borrow-repay-container">

      {/* Top Header */}
      <div className="borrow-repay-header">
        <div>
          <h2 className="borrow-repay-title">
            Borrow & Repay <span className="emerald-gradient-text">Management</span>
          </h2>
        </div>

        {/* Action Buttons depending on Step */}
        <div className="borrow-header-buttons">
          {activeStep !== 'planned_repayment' ? (
            <>
              <button
                onClick={() => handleOpenCreditModal('Borrow')}
                className="btn btn-secondary btn-borrow-action"
              >
                <ArrowDownLeft size={16} /> + Log Borrow
              </button>
              <button
                onClick={() => handleOpenCreditModal('Repaid')}
                className="btn btn-primary"
              >
                <ArrowUpRight size={16} /> + Log Repayment
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsPlannedModalOpen(true)}
              className="btn btn-primary"
            >
              <CalendarClock size={16} /> + Schedule Planned Repayment
            </button>
          )}
        </div>
      </div>

      {/* Three-Step / Tab Switcher */}
      <div className="borrow-two-step-tabs">
        <button
          onClick={() => setActiveStep('credit_tracker')}
          className={`borrow-step-btn ${activeStep === 'credit_tracker' ? 'active' : ''}`}
        >
          <HandCoins size={16} />
          <span>Step 1: Credit Tracker (Ledger & Grid)</span>
          <span className="step-counter">{records.length}</span>
        </button>

        <button
          onClick={() => setActiveStep('aggregation')}
          className={`borrow-step-btn ${activeStep === 'aggregation' ? 'active' : ''}`}
        >
          <Table2 size={16} />
          <span>Step 2: Creditor Aggregations (Table)</span>
          <span className="step-counter">{creditorSummaries.length}</span>
        </button>

        <button
          onClick={() => setActiveStep('planned_repayment')}
          className={`borrow-step-btn ${activeStep === 'planned_repayment' ? 'active' : ''}`}
        >
          <CalendarClock size={16} />
          <span>Step 3: Planned Repayment (Schedule)</span>
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
          {/* Top KPI Cards (INR ₹) */}
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
              <div className="borrow-kpi-meta">Money received as credit/loans</div>
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
                  : 'All borrowed money fully settled!'}
              </div>
            </div>
          </div>

          {/* Creditors Summary (Previous Grid Type) */}
          {creditorSummaries.length > 0 && (
            <div className="creditors-section">
              <div className="creditors-header-bar">
                <div className="creditors-header-title">
                  <User size={16} />
                  <span>Creditors Summary</span>
                  <span className="creditors-count-badge">
                    {creditorSummaries.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('aggregation')}
                  className="btn-table-filter-inspect"
                  style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                >
                  <Table2 size={14} /> View Aggregation Table →
                </button>
              </div>

              {/* Active Creditor Filter Indicator Banner */}
              {selectedCreditorFilter !== 'ALL' && (
                <div className="creditor-active-banner">
                  <div className="banner-left">
                    <Filter size={15} />
                    <span>Filtering transactions for:</span>
                    <span className="banner-creditor-name">{selectedCreditorFilter}</span>
                    <span className="banner-count-badge">
                      ({filteredRecords.length} records matching)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCreditorFilter('ALL')}
                    className="banner-clear-btn"
                    title="Show all creditors"
                  >
                    <X size={14} />
                    <span>Show All Creditors</span>
                  </button>
                </div>
              )}

              {/* Previous Grid Type Cards */}
              <div className="creditors-chip-grid">
                {creditorSummaries.map(c => {
                  const isSelected = selectedCreditorFilter === c.creditorName;
                  return (
                    <div
                      key={c.creditorName}
                      onClick={() => setSelectedCreditorFilter(prev => prev === c.creditorName ? 'ALL' : c.creditorName)}
                      className={`creditor-chip-card ${isSelected ? 'active-filter' : ''} ${c.status === 'Settled' ? 'settled' : 'pending'}`}
                      title={isSelected ? 'Active filter - click to show all' : `Click to filter transactions for ${c.creditorName}`}
                    >
                      <div className="creditor-chip-top">
                        <span className="creditor-chip-name">{c.creditorName}</span>
                        <span className={`badge ${c.status === 'Settled' ? 'badge-emerald' : 'badge-amber'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="creditor-chip-balance">
                        {c.netBalance > 0 ? (
                          <span className="balance-due">Due: {formatINR(c.netBalance)}</span>
                        ) : c.netBalance < 0 ? (
                          <span className="balance-overpaid" style={{ color: '#38bdf8', fontWeight: 600 }}>
                            Credit Given: {formatINR(Math.abs(c.netBalance))}
                          </span>
                        ) : (
                          <span className="balance-cleared">Fully Cleared (₹0)</span>
                        )}
                      </div>
                      <div className="creditor-chip-actions">
                        {c.netBalance > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCreditModal('Repaid', c.creditorName);
                            }}
                            className="btn-link-settle"
                          >
                            Settle Balance →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Transactions Section Header / Summary Strip */}
          <div className="table-summary-strip">
            <div className="summary-strip-left">
              <HandCoins size={16} />
              <span>
                Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> transactions
                {selectedCreditorFilter !== 'ALL' && (
                  <> for <strong>{selectedCreditorFilter}</strong></>
                )}
              </span>
            </div>

            <div className="summary-strip-right">
              <div className="summary-stat-item">
                <span style={{ color: 'var(--text-muted)' }}>Borrowed:</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                  ₹ {activeFilterTotals.borrowed.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="summary-stat-item">
                <span style={{ color: 'var(--text-muted)' }}>Repaid:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>
                  ₹ {activeFilterTotals.repaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="summary-stat-item">
                <span style={{ color: 'var(--text-muted)' }}>Net:</span>
                <span style={{ color: activeFilterTotals.net > 0 ? '#fb7185' : '#34d399', fontWeight: 700 }}>
                  ₹ {activeFilterTotals.net.toLocaleString('en-IN')}
                </span>
              </div>
              {(selectedMonth !== 'ALL' || selectedYear !== 'ALL' || typeFilter !== 'ALL' || selectedCreditorFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('ALL');
                    setSelectedYear('ALL');
                    setTypeFilter('ALL');
                    setSelectedCreditorFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="btn-clear-all-filters"
                  title="Reset all filters to show all transactions"
                >
                  <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Reset All Filters
                </button>
              )}
            </div>
          </div>

          {/* Toolbar with Month-wise Filter, Year Filter, Type & Creditor Filters */}
          <div className="borrow-table-toolbar">
            <div className="borrow-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Creditor Name or Notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="borrow-search-input"
              />
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
                  title="Filter by Type"
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
                    title="Filter by Creditor"
                  >
                    <option value="ALL">All Creditors ({existingCreditors.length})</option>
                    {existingCreditors.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Credit Tracker Table */}
          <div className="borrow-table-container glass-panel">
            <table className="borrow-data-table">
              <thead>
                <tr>
                  <th>Creditor Name</th>
                  <th>Date</th>
                  <th>Transaction Type</th>
                  <th className="th-amount">Amount (INR)</th>
                  <th>Notes</th>
                  <th className="th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table-cell">
                      <div className="empty-table-placeholder">
                        <HandCoins size={28} />
                        <p>No borrow or repayment records found for the selected month/year filter.</p>
                        <button
                          onClick={() => handleOpenCreditModal('Borrow')}
                          className="btn btn-secondary btn-sm"
                        >
                          + Add First Record
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(item => {
                    const isBorrow = item.type === 'Borrow';
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
                            <span>{item.date}</span>
                          </div>
                        </td>

                        <td className="td-type">
                          <span className={`badge ${isBorrow ? 'badge-borrow' : 'badge-repaid'}`}>
                            {isBorrow ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {item.type}
                          </span>
                        </td>

                        <td className={`td-amount ${isBorrow ? (Number(item.amount) < 0 ? 'repaid-amt' : 'borrow-amt') : 'repaid-amt'}`}>
                          {isBorrow
                            ? Number(item.amount) < 0
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
          </div>
        </>
      )}

      {/* =========================================================
          STEP 2: CREDITOR & YEARLY AGGREGATIONS (DEDICATED TABLE TAB)
          ========================================================= */}
      {activeStep === 'aggregation' && (
        <>
          {/* Top Aggregation KPI Cards */}
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
              <div className="borrow-kpi-meta">Across {stats.totalCreditorsCount} creditors</div>
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

            <div className="borrow-kpi-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <div className="borrow-kpi-header">
                <span className="borrow-kpi-label">CREDIT GIVEN</span>
                <div className="borrow-kpi-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <HandCoins size={16} />
                </div>
              </div>
              <div className="borrow-kpi-val" style={{ color: '#38bdf8' }}>
                {formatINR(stats.totalCreditGiven || 0)}
              </div>
              <div className="borrow-kpi-meta">{stats.creditGivenCreditorsCount} creditor(s) received credit</div>
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
                {stats.activeCreditorsCount} pending / {stats.settledCreditorsCount} settled
              </div>
            </div>
          </div>

          {/* Aggregation Table Search Toolbar */}
          <div className="borrow-table-toolbar">
            <div className="borrow-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search creditor in aggregations..."
                value={aggSearchQuery}
                onChange={e => setAggSearchQuery(e.target.value)}
                className="borrow-search-input"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Showing <strong>{filteredCreditorSummaries.length}</strong> of <strong>{creditorSummaries.length}</strong> creditors
              </span>
              <button
                type="button"
                onClick={() => setActiveStep('credit_tracker')}
                className="btn-table-filter-inspect"
              >
                ← Back to Ledger & Grid
              </button>
            </div>
          </div>

          {/* Comprehensive Aggregation Table */}
          <div className="creditors-aggregation-table-wrap">
            <table className="creditor-agg-table">
              <thead>
                <tr>
                  <th>Creditor Name</th>
                  <th className="text-align-right">Total Borrowed</th>
                  <th className="text-align-right">Total Repaid</th>
                  <th className="text-align-right">Credit Given</th>
                  <th className="text-align-right">Net Balance</th>
                  <th className="text-align-center">Tx Count</th>
                  <th className="text-align-center">Status</th>
                  <th>Last Activity</th>
                  <th className="text-align-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreditorSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No creditors match the search "{aggSearchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredCreditorSummaries.map(c => {
                    const isDue = c.netBalance > 0;
                    const isSettled = c.netBalance === 0;
                    const isCreditGiven = c.netBalance < 0;

                    return (
                      <tr
                        key={c.creditorName}
                        onClick={() => {
                          setSelectedCreditorFilter(c.creditorName);
                          setActiveStep('credit_tracker');
                        }}
                        title={`Click to view transactions for ${c.creditorName}`}
                      >
                        <td>
                          <div className="creditor-name-cell">
                            <div className="creditor-mini-avatar">
                              {c.creditorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="creditor-display-name">{c.creditorName}</span>
                          </div>
                        </td>

                        <td className="amount-borrowed-col">
                          {c.totalBorrowed > 0 ? `₹ ${c.totalBorrowed.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="amount-repaid-col">
                          {c.totalRepaid > 0 ? `₹ ${c.totalRepaid.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="amount-credit-given-col">
                          {c.creditGiven && c.creditGiven > 0 ? `₹ ${c.creditGiven.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className={`net-balance-col ${isDue ? 'due' : isSettled ? 'settled' : 'credit-given'}`}>
                          {isDue
                            ? `Due: ₹ ${c.netBalance.toLocaleString('en-IN')}`
                            : isSettled
                            ? 'Cleared (₹0)'
                            : `Given: ₹ ${Math.abs(c.netBalance).toLocaleString('en-IN')}`}
                        </td>

                        <td className="tx-count-col">
                          {c.txCount || '—'}
                        </td>

                        <td className="text-align-center">
                          <span className={`badge ${isSettled ? 'badge-emerald' : isCreditGiven ? 'badge-sky' : 'badge-amber'}`}>
                            {c.status}
                          </span>
                        </td>

                        <td className="last-activity-col">
                          {c.lastActivityDate || '—'}
                        </td>

                        <td className="text-align-center" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCreditorFilter(c.creditorName);
                              setActiveStep('credit_tracker');
                            }}
                            className="btn-table-filter-inspect"
                            title={`Inspect transactions for ${c.creditorName}`}
                          >
                            Inspect ({c.txCount || 0}) →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="aggregation-footer-row">
                  <td>
                    <div className="footer-label">
                      <span>Grand Total</span>
                      <span className="footer-reset-hint">({creditorSummaries.length} Creditors)</span>
                    </div>
                  </td>
                  <td className="amount-borrowed-col">
                    ₹ {stats.totalBorrowed.toLocaleString('en-IN')}
                  </td>
                  <td className="amount-repaid-col">
                    ₹ {stats.totalRepaid.toLocaleString('en-IN')}
                  </td>
                  <td className="amount-credit-given-col">
                    ₹ {(stats.totalCreditGiven || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="net-balance-col due">
                    ₹ {stats.netOutstanding.toLocaleString('en-IN')}
                  </td>
                  <td className="tx-count-col">
                    {stats.totalTransactions}
                  </td>
                  <td colSpan={3} className="text-align-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCreditorFilter('ALL');
                        setActiveStep('credit_tracker');
                      }}
                      className="btn-clear-all-filters"
                    >
                      View All in Ledger →
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Yearly Aggregations Historical Table */}
          {yearlySummaries.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div className="creditors-header-bar" style={{ marginBottom: 12 }}>
                <div className="creditors-header-title">
                  <Calendar size={16} />
                  <span>Yearly Aggregations (Historical Ledger)</span>
                  <span className="creditors-count-badge">
                    {yearlySummaries.length} Years
                  </span>
                </div>
              </div>
              <div className="creditors-aggregation-table-wrap">
                <table className="creditor-agg-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th className="text-align-center">Transactions</th>
                      <th className="text-align-right">Total Borrowed</th>
                      <th className="text-align-right">Total Repaid</th>
                      <th className="text-align-right">Credit Given</th>
                      <th className="text-align-right">Net Position</th>
                      <th className="text-align-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlySummaries.map(y => {
                      const net = y.totalBorrowed - y.totalRepaid - y.creditGiven;
                      return (
                        <tr
                          key={y.year}
                          onClick={() => {
                            setSelectedYear(y.year);
                            setSelectedMonth('ALL');
                            setSelectedCreditorFilter('ALL');
                            setActiveStep('credit_tracker');
                          }}
                          title={`Click to view all transactions for ${y.year}`}
                        >
                          <td>
                            <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{y.year}</strong>
                          </td>
                          <td className="tx-count-col">{y.txCount}</td>
                          <td className="amount-borrowed-col">
                            {y.totalBorrowed > 0 ? `₹ ${y.totalBorrowed.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="amount-repaid-col">
                            {y.totalRepaid > 0 ? `₹ ${y.totalRepaid.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="amount-credit-given-col">
                            {y.creditGiven > 0 ? `₹ ${y.creditGiven.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className={`net-balance-col ${net > 0 ? 'due' : 'settled'}`}>
                            {net > 0 ? `+₹ ${net.toLocaleString('en-IN')}` : `₹ ${net.toLocaleString('en-IN')}`}
                          </td>
                          <td className="text-align-center" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedYear(y.year);
                                setSelectedMonth('ALL');
                                setSelectedCreditorFilter('ALL');
                                setActiveStep('credit_tracker');
                              }}
                              className="btn-table-filter-inspect"
                            >
                              View {y.year} Records ({y.txCount}) →
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
          STEP 3: PLANNED REPAYMENT (SCHEDULE & TARGETS IN INR ₹)
          ========================================================= */}
      {activeStep === 'planned_repayment' && (
        <>
          {/* Planned Repayment KPI Cards */}
          <div className="borrow-kpi-grid">
            <div className="planned-kpi-card total-planned">
              <div className="planned-kpi-label">TOTAL PLANNED REPAYMENTS</div>
              <div className="planned-kpi-val">{formatINR(plannedStats.totalPlanned)}</div>
              <div className="planned-kpi-meta">Scheduled debt repayments</div>
            </div>

            <div className="planned-kpi-card actual-spent">
              <div className="planned-kpi-label">FULFILLED / COMPLETED</div>
              <div className="planned-kpi-val repaid-text">{formatINR(plannedStats.totalPaid)}</div>
              <div className="planned-kpi-meta">Paid and logged into ledger</div>
            </div>

            <div className="planned-kpi-card outstanding-card">
              <div className="planned-kpi-label">PENDING REPAYMENTS</div>
              <div className="planned-kpi-val outstanding-text">{formatINR(plannedStats.pendingScheduled)}</div>
              <div className="planned-kpi-meta">Remaining planned payoff</div>
            </div>
          </div>

          {/* Toolbar for Planned Repayments with Month & Year Filter */}
          <div className="borrow-table-toolbar">
            <div className="borrow-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search planned repayments by creditor or notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="borrow-search-input"
              />
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
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Planned Repayments Table */}
          <div className="borrow-table-container glass-panel">
            <table className="borrow-data-table">
              <thead>
                <tr>
                  <th>Creditor Name</th>
                  <th>Target Date</th>
                  <th className="th-amount">Planned Amount (INR)</th>
                  <th>Status</th>
                  <th>Installment Notes</th>
                  <th className="th-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlannedRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table-cell">
                      <div className="empty-table-placeholder">
                        <CalendarClock size={28} />
                        <p>No planned repayments found for the selected month/year filter.</p>
                        <button
                          onClick={() => setIsPlannedModalOpen(true)}
                          className="btn btn-secondary btn-sm"
                        >
                          + Schedule A Repayment
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPlannedRepayments.map(plan => {
                    const isPaid = plan.status === 'Paid';
                    return (
                      <tr key={plan.id} className="borrow-row">
                        <td className="td-creditor">
                          <div className="creditor-avatar-cell">
                            <div className="creditor-avatar-circle">
                              {plan.creditorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="creditor-fullname">{plan.creditorName}</span>
                          </div>
                        </td>

                        <td className="td-date">
                          <div className="date-cell-flex">
                            <Calendar size={13} className="date-icon" />
                            <span>{plan.targetDate}</span>
                          </div>
                        </td>

                        <td className="td-amount repaid-amt">
                          ₹ {Number(plan.plannedAmount).toLocaleString('en-IN')}
                        </td>

                        <td>
                          <span className={`badge ${isPaid ? 'badge-emerald' : 'badge-amber'}`}>
                            {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {plan.status}
                          </span>
                        </td>

                        <td className="td-notes">
                          <span className="notes-text">{plan.notes || '—'}</span>
                        </td>

                        <td className="td-action">
                          <div className="actions-inline-group">
                            {!isPaid && (
                              <button
                                onClick={() => handleMarkAsPaid(plan.id)}
                                className="btn-table-action-pay"
                                title="Mark as Paid and Log into Credit Tracker"
                              >
                                <CheckSquare size={14} /> Pay
                              </button>
                            )}
                            <button
                              onClick={() => triggerDeletePlannedRepayment(plan)}
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

      {/* Entry Modals */}
      <BorrowRepayModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        onSubmit={handleAddCreditRecord}
        existingCreditors={existingCreditors}
        initialType={modalInitialType}
        initialCreditor={modalInitialCreditor}
      />

      <PlannedRepaymentModal
        isOpen={isPlannedModalOpen}
        onClose={() => setIsPlannedModalOpen(false)}
        onSubmit={handleAddPlannedRepayment}
        existingCreditors={existingCreditors}
      />

      {/* Dedicated Yes / No Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'credit_record' ? 'Delete Credit Transaction' : 'Delete Planned Repayment'}
        message="Are you sure you want to delete this data? Please choose Yes to delete or No to cancel."
        itemName={deleteConfirm.itemName}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'credit_record', id: '', itemName: '' })}
      />

    </div>
  );
}
