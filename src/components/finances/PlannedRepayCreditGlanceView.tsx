import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Search, Filter, CheckSquare, Layers, LayoutGrid, Table2,
  ChevronRight, ArrowRight, Plus, ArrowUpRight, AlertTriangle,
  Link2, Sparkles, X, Check, Trash2
} from 'lucide-react';
import { plannedRepayCreditApi } from '../../services/plannedRepayCreditApi';
import { MONTH_NAMES } from '../../utils/dateHelpers';
import type {
  PlannedRepayCreditItem,
  PlannedRepayCreditColumn,
  PlannedRepayCreditMatrix,
  BorrowRepayRecord
} from '../../types';

interface PlannedRepayCreditGlanceViewProps {
  onOpenScheduleModal?: () => void;
  actualRecords?: BorrowRepayRecord[];
}

export interface NextMonthCheckInfo {
  hasCheck?: boolean;
  isUnfulfilled: boolean;
  hasNextMonth: boolean;
  nextMonthName: string;
  isFulfilledInNextMonth: boolean;
  isPartialInNextMonth: boolean;
  nextMonthAmount?: number;
  isFulfilledInLaterMonth: boolean;
  laterMonthName?: string;
  actualRepaidInLedger: boolean;
  actualRepaidAmount?: number;
  badgeText: string;
  badgeType: 'fulfilled' | 'partial' | 'pending' | 'none';
  detailMessage: string;
}

export default function PlannedRepayCreditGlanceView({
  onOpenScheduleModal,
  actualRecords = []
}: PlannedRepayCreditGlanceViewProps) {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'matrix' | 'table'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Completed' | 'In-Completed' | 'RolloverRecovered' | 'RolloverPending'>('ALL');
  const [selectedCreditor, setSelectedCreditor] = useState<string>('ALL');

  // Inline Quick Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    creditorName: '',
    targetDate: '2026-10-01',
    plannedAmount: '',
    status: 'In-Completed' as 'Completed' | 'In-Completed',
    notes: ''
  });

  // Delete Confirmation Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    creditorName: string;
    amount: number;
    month: string;
  }>({
    isOpen: false,
    id: '',
    creditorName: '',
    amount: 0,
    month: ''
  });

  // ─── Query Matrix Data from MongoDB ──────────────────────────────────────────
  const {
    data: matrix,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery<PlannedRepayCreditMatrix>({
    queryKey: ['plannedRepayCreditMatrix'],
    queryFn: plannedRepayCreditApi.getMatrix,
    staleTime: 1000 * 30, // 30 seconds
  });

  // ─── Status Update Mutation (1-click toggle) ──────────────────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'Completed' | 'In-Completed' }) =>
      plannedRepayCreditApi.updateStatus(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedRepayCreditMatrix'] });
      queryClient.invalidateQueries({ queryKey: ['plannedRepayments'] });
    },
  });

  // ─── Add Repayment Item Mutation ──────────────────────────────────────────────
  const createItemMutation = useMutation({
    mutationFn: (item: Omit<PlannedRepayCreditItem, 'id' | '_id'>) =>
      plannedRepayCreditApi.create(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedRepayCreditMatrix'] });
      queryClient.invalidateQueries({ queryKey: ['plannedRepayments'] });
      setIsAddModalOpen(false);
      setAddForm({
        creditorName: '',
        targetDate: '2026-10-01',
        plannedAmount: '',
        status: 'In-Completed',
        notes: ''
      });
    },
  });

  // ─── Delete Repayment Item Mutation ──────────────────────────────────────────
  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => plannedRepayCreditApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedRepayCreditMatrix'] });
      queryClient.invalidateQueries({ queryKey: ['plannedRepayments'] });
      setDeleteConfirm({ isOpen: false, id: '', creditorName: '', amount: 0, month: '' });
    },
  });

  const triggerDeleteItem = (item: PlannedRepayCreditItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemId = item.id || item._id;
    if (!itemId) return;
    setDeleteConfirm({
      isOpen: true,
      id: itemId,
      creditorName: item.creditorName,
      amount: item.plannedAmount,
      month: item.targetMonth
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.id) {
      deleteItemMutation.mutate(deleteConfirm.id);
    }
  };

  const handleToggleItemStatus = (item: PlannedRepayCreditItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemId = item.id || item._id;
    if (!itemId) return;
    const nextStatus: 'Completed' | 'In-Completed' =
      item.status === 'Completed' ? 'In-Completed' : 'Completed';
    toggleStatusMutation.mutate({ id: itemId, nextStatus });
  };

  const handleToggleColumnAll = (column: PlannedRepayCreditColumn) => {
    const targetStatus: 'Completed' | 'In-Completed' =
      column.status === 'Completed' ? 'In-Completed' : 'Completed';

    column.items.forEach(it => {
      const itId = it.id || it._id;
      if (itId && it.status !== targetStatus) {
        toggleStatusMutation.mutate({ id: itId, nextStatus: targetStatus });
      }
    });
  };

  const formatINR = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

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

  // ─── NEXT-MONTH CONSTRAINT FULFILLMENT CHECK LOGIC ─────────────────────────────
  const checkNextMonthFulfillment = (
    item: PlannedRepayCreditItem,
    columnIndex: number,
    allColumns: PlannedRepayCreditColumn[]
  ): NextMonthCheckInfo => {
    if (item.status === 'Completed') {
      return {
        hasCheck: false,
        isUnfulfilled: false,
        hasNextMonth: false,
        nextMonthName: '',
        isFulfilledInNextMonth: false,
        isPartialInNextMonth: false,
        isFulfilledInLaterMonth: false,
        actualRepaidInLedger: false,
        badgeText: '',
        badgeType: 'none',
        detailMessage: 'Fulfilled on schedule'
      };
    }

    const nextCol = allColumns[columnIndex + 1];
    if (!nextCol) {
      return {
        hasCheck: true,
        isUnfulfilled: true,
        hasNextMonth: false,
        nextMonthName: 'Final Month',
        isFulfilledInNextMonth: false,
        isPartialInNextMonth: false,
        isFulfilledInLaterMonth: false,
        actualRepaidInLedger: false,
        badgeText: 'Final Month (Pending)',
        badgeType: 'pending',
        detailMessage: 'Final scheduled month — pending resolution'
      };
    }

    const nextMonthName = nextCol.targetMonth;
    const targetCreditor = item.creditorName.trim().toLowerCase();

    // 1. Check if next month column has matching item for this creditor
    const nextMonthMatch = nextCol.items.find(
      it => it.creditorName.trim().toLowerCase() === targetCreditor
    );

    // 2. Check if actual ledger has a Repaid record in next month
    const actualRepaidRecord = actualRecords.find(r => {
      if (r.type !== 'Repaid') return false;
      if (r.creditorName.trim().toLowerCase() !== targetCreditor) return false;
      const { month, year } = parseDateMonthYear(r.date);
      return `${month} ${year}`.toLowerCase() === nextMonthName.toLowerCase();
    });

    if (nextMonthMatch && nextMonthMatch.status === 'Completed') {
      const isPartial = nextMonthMatch.plannedAmount < item.plannedAmount;
      return {
        hasCheck: true,
        isUnfulfilled: true,
        hasNextMonth: true,
        nextMonthName,
        isFulfilledInNextMonth: true,
        isPartialInNextMonth: isPartial,
        nextMonthAmount: nextMonthMatch.plannedAmount,
        isFulfilledInLaterMonth: false,
        actualRepaidInLedger: !!actualRepaidRecord,
        actualRepaidAmount: actualRepaidRecord ? Number(actualRepaidRecord.amount) : undefined,
        badgeText: isPartial
          ? `↳ Partial in ${nextMonthName} (₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')})`
          : `↳ Fulfilled in ${nextMonthName} (₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')} ✓)`,
        badgeType: isPartial ? 'partial' : 'fulfilled',
        detailMessage: isPartial
          ? `Partially recovered in ${nextMonthName}: ₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')} of ₹${item.plannedAmount.toLocaleString('en-IN')}`
          : `Unfulfilled in this month, but successfully fulfilled in next month (${nextMonthName}) for ₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')}`
      };
    }

    if (actualRepaidRecord) {
      return {
        hasCheck: true,
        isUnfulfilled: true,
        hasNextMonth: true,
        nextMonthName,
        isFulfilledInNextMonth: true,
        isPartialInNextMonth: false,
        isFulfilledInLaterMonth: false,
        actualRepaidInLedger: true,
        actualRepaidAmount: Number(actualRepaidRecord.amount),
        badgeText: `↳ Paid in Ledger in ${nextMonthName} (₹${Number(actualRepaidRecord.amount).toLocaleString('en-IN')} ✓)`,
        badgeType: 'fulfilled',
        detailMessage: `Actual repaid transaction logged in ledger during ${nextMonthName}`
      };
    }

    if (nextMonthMatch && nextMonthMatch.status === 'In-Completed') {
      return {
        hasCheck: true,
        isUnfulfilled: true,
        hasNextMonth: true,
        nextMonthName,
        isFulfilledInNextMonth: false,
        isPartialInNextMonth: false,
        nextMonthAmount: nextMonthMatch.plannedAmount,
        isFulfilledInLaterMonth: false,
        actualRepaidInLedger: false,
        badgeText: `⚠️ In-Completed in ${nextMonthName}`,
        badgeType: 'pending',
        detailMessage: `Carried forward to ${nextMonthName} but still In-Completed`
      };
    }

    // 3. Check if fulfilled in ANY later month (colIdx + 2 onwards)
    for (let laterIdx = columnIndex + 2; laterIdx < allColumns.length; laterIdx++) {
      const laterCol = allColumns[laterIdx];
      const laterMatch = laterCol.items.find(
        it => it.creditorName.trim().toLowerCase() === targetCreditor && it.status === 'Completed'
      );
      if (laterMatch) {
        return {
          hasCheck: true,
          isUnfulfilled: true,
          hasNextMonth: true,
          nextMonthName,
          isFulfilledInNextMonth: false,
          isPartialInNextMonth: false,
          isFulfilledInLaterMonth: true,
          laterMonthName: laterCol.targetMonth,
          actualRepaidInLedger: false,
          badgeText: `↳ Fulfilled later in ${laterCol.targetMonth} (₹${laterMatch.plannedAmount.toLocaleString('en-IN')} ✓)`,
          badgeType: 'partial',
          detailMessage: `Not in next month (${nextMonthName}), but settled later in ${laterCol.targetMonth}`
        };
      }
    }

    // Completely unfulfilled in next month
    return {
      hasCheck: true,
      isUnfulfilled: true,
      hasNextMonth: true,
      nextMonthName,
      isFulfilledInNextMonth: false,
      isPartialInNextMonth: false,
      isFulfilledInLaterMonth: false,
      actualRepaidInLedger: false,
      badgeText: `⚠️ Not in ${nextMonthName} (Carried Forward)`,
      badgeType: 'pending',
      detailMessage: `This debt was NOT fulfilled in this month nor in next month (${nextMonthName}). Action required.`
    };
  };

  /**
   * Checks if an item in Month K is fulfilling an unfulfilled commitment from Month K-1
   */
  const checkIsPreviousMonthRollover = (
    item: PlannedRepayCreditItem,
    columnIndex: number,
    allColumns: PlannedRepayCreditColumn[]
  ): { isRollover: boolean; prevMonthName: string; prevAmount: number } => {
    if (columnIndex === 0) return { isRollover: false, prevMonthName: '', prevAmount: 0 };
    const prevCol = allColumns[columnIndex - 1];
    if (prevCol.status === 'Completed') return { isRollover: false, prevMonthName: '', prevAmount: 0 };

    const targetCreditor = item.creditorName.trim().toLowerCase();
    const unfulfilledInPrev = prevCol.items.find(
      it => it.creditorName.trim().toLowerCase() === targetCreditor && it.status !== 'Completed'
    );

    if (unfulfilledInPrev) {
      return {
        isRollover: true,
        prevMonthName: prevCol.targetMonth,
        prevAmount: unfulfilledInPrev.plannedAmount
      };
    }
    return { isRollover: false, prevMonthName: '', prevAmount: 0 };
  };

  // Available creditors for filter dropdown
  const uniqueCreditors = useMemo(() => {
    if (!matrix?.columns) return [];
    const set = new Set<string>();
    matrix.columns.forEach(col => {
      col.items.forEach(it => {
        if (it.creditorName) set.add(it.creditorName.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [matrix]);

  // Overall Rollover & Next Month Recovery Stats
  const rolloverStats = useMemo(() => {
    if (!matrix?.columns) return { unfulfilledTotal: 0, recoveredInNextTotal: 0, countRecovered: 0, totalUnfulfilledCount: 0 };
    let unfulfilledTotal = 0;
    let recoveredInNextTotal = 0;
    let countRecovered = 0;
    let totalUnfulfilledCount = 0;

    matrix.columns.forEach((col, cIdx) => {
      if (col.status !== 'Completed') {
        col.items.forEach(it => {
          if (it.status !== 'Completed') {
            totalUnfulfilledCount += 1;
            unfulfilledTotal += it.plannedAmount;
            const check = checkNextMonthFulfillment(it, cIdx, matrix.columns);
            if (check.isFulfilledInNextMonth) {
              countRecovered += 1;
              recoveredInNextTotal += (check.nextMonthAmount || it.plannedAmount);
            }
          }
        });
      }
    });

    return {
      unfulfilledTotal,
      recoveredInNextTotal,
      countRecovered,
      totalUnfulfilledCount
    };
  }, [matrix, actualRecords]);

  // Filtered columns for Matrix view
  const filteredColumns = useMemo(() => {
    if (!matrix?.columns) return [];
    return matrix.columns.filter((col, cIdx) => {
      let matchesStatus = true;
      if (statusFilter === 'Completed') {
        matchesStatus = col.status === 'Completed';
      } else if (statusFilter === 'In-Completed') {
        matchesStatus = col.status === 'In-Completed';
      } else if (statusFilter === 'RolloverRecovered') {
        matchesStatus = col.items.some(it => {
          const chk = checkNextMonthFulfillment(it, cIdx, matrix.columns);
          return chk.isFulfilledInNextMonth;
        });
      } else if (statusFilter === 'RolloverPending') {
        matchesStatus = col.items.some(it => {
          const chk = checkNextMonthFulfillment(it, cIdx, matrix.columns);
          return it.status !== 'Completed' && !chk.isFulfilledInNextMonth;
        });
      }

      const matchesCreditor =
        selectedCreditor === 'ALL' ||
        col.items.some(it => it.creditorName === selectedCreditor);

      const matchesSearch =
        !searchQuery.trim() ||
        col.targetMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.targetDate.includes(searchQuery) ||
        col.items.some(
          it =>
            it.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        );

      return matchesStatus && matchesCreditor && matchesSearch;
    });
  }, [matrix, statusFilter, selectedCreditor, searchQuery, actualRecords]);

  // Flattened items for Table view
  const allFlattenedItems = useMemo(() => {
    if (!matrix?.columns) return [];
    const items: (PlannedRepayCreditItem & {
      monthLabel: string;
      columnIndex: number;
      nextCheck: NextMonthCheckInfo;
      prevRollover: { isRollover: boolean; prevMonthName: string; prevAmount: number };
    })[] = [];

    matrix.columns.forEach((col, cIdx) => {
      col.items.forEach(it => {
        const nextCheck = checkNextMonthFulfillment(it, cIdx, matrix.columns);
        const prevRollover = checkIsPreviousMonthRollover(it, cIdx, matrix.columns);
        items.push({
          ...it,
          monthLabel: col.targetMonth,
          columnIndex: cIdx,
          nextCheck,
          prevRollover
        });
      });
    });

    return items.filter(it => {
      let matchesStatus = true;
      if (statusFilter === 'Completed') matchesStatus = it.status === 'Completed';
      else if (statusFilter === 'In-Completed') matchesStatus = it.status === 'In-Completed';
      else if (statusFilter === 'RolloverRecovered') matchesStatus = it.nextCheck.isFulfilledInNextMonth;
      else if (statusFilter === 'RolloverPending') matchesStatus = it.status !== 'Completed' && !it.nextCheck.isFulfilledInNextMonth;

      const matchesCreditor =
        selectedCreditor === 'ALL' || it.creditorName === selectedCreditor;
      const matchesSearch =
        !searchQuery.trim() ||
        it.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.targetDate.includes(searchQuery) ||
        it.targetMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesCreditor && matchesSearch;
    });
  }, [matrix, statusFilter, selectedCreditor, searchQuery, actualRecords]);

  // Handle Quick Add Modal Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.creditorName.trim() || !addForm.plannedAmount || Number(addForm.plannedAmount) <= 0) return;

    const d = new Date(addForm.targetDate);
    const mIdx = !isNaN(d.getTime()) ? d.getMonth() + 1 : 10;
    const mName = !isNaN(d.getTime()) ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : 'October 2026';

    createItemMutation.mutate({
      targetDate: addForm.targetDate,
      targetMonth: mName,
      monthIndex: mIdx,
      creditorName: addForm.creditorName.trim(),
      plannedAmount: Math.abs(parseFloat(addForm.plannedAmount)),
      status: addForm.status,
      notes: addForm.notes.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="glance-loading-state glass-panel">
        <RefreshCw className="spin-icon" size={28} />
        <h4>Loading Planned Repayments Matrix...</h4>
      </div>
    );
  }

  if (error || !matrix) {
    return (
      <div className="glance-error-state glass-panel">
        <AlertCircle size={32} className="error-icon" />
        <h4>Failed to load planned repayments schedule</h4>
        <button onClick={() => refetch()} className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>
          <RefreshCw size={14} /> Retry Connection
        </button>
      </div>
    );
  }

  const completionPct = matrix.completionRate || 0;

  return (
    <div className="glance-schedule-wrapper">

      {/* ─── Clean Top KPI Stats & Progress Ribbon (No unwanted text or banners) ─── */}
      <div className="glance-hero-banner glass-panel" style={{ padding: '16px 20px', gap: 14 }}>
        <div className="glance-hero-stats" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div className="glance-stat-box">
            <span className="glance-stat-label">TOTAL COMMITMENT</span>
            <span className="glance-stat-value">{formatINR(matrix.totalPlanned)}</span>
            <span className="glance-stat-sub">{matrix.totalMonths} Months ({matrix.totalItems} items)</span>
          </div>

          <div className="glance-stat-box fulfilled">
            <span className="glance-stat-label">FULFILLED / COMPLETED</span>
            <span className="glance-stat-value emerald-text">{formatINR(matrix.totalCompleted)}</span>
            <span className="glance-stat-sub">{matrix.completedMonthsCount} of {matrix.totalMonths} Months Fulfilled</span>
          </div>

          <div className="glance-stat-box pending">
            <span className="glance-stat-label">REMAINING PENDING</span>
            <span className="glance-stat-value amber-text">{formatINR(matrix.totalInCompleted)}</span>
            <span className="glance-stat-sub">{matrix.totalMonths - matrix.completedMonthsCount} Month(s) Pending</span>
          </div>

          {rolloverStats.countRecovered > 0 && (
            <div className="glance-stat-box" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.08)' }}>
              <span className="glance-stat-label" style={{ color: '#a5b4fc' }}>NEXT-MONTH RECOVERED</span>
              <span className="glance-stat-value" style={{ color: '#818cf8' }}>{formatINR(rolloverStats.recoveredInNextTotal)}</span>
              <span className="glance-stat-sub" style={{ color: '#c7d2fe' }}>
                {rolloverStats.countRecovered} debt(s) fulfilled in next month
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        <div className="glance-progress-container">
          <div className="glance-progress-header">
            <div className="glance-progress-title">
              <CheckCircle2 size={16} className="emerald-text" />
              <span>Overall Schedule Fulfilled: <strong>{completionPct}%</strong></span>
            </div>
            <span className="glance-progress-meta">
              {matrix.completedMonthsCount} of {matrix.totalMonths} months fulfilled ({formatINR(matrix.totalCompleted)} of {formatINR(matrix.totalPlanned)})
            </span>
          </div>
          <div className="glance-progress-track">
            <div
              className="glance-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Toolbar: Filters, Search, Add Data & View Switcher ─────────────── */}
      <div className="glance-toolbar glass-panel">
        <div className="glance-toolbar-left">
          {/* View Toggle */}
          <div className="glance-view-toggle">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`glance-toggle-btn ${viewMode === 'matrix' ? 'active' : ''}`}
            >
              <LayoutGrid size={15} /> Single Glance Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`glance-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            >
              <Table2 size={15} /> Detailed Ledger Table
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="glance-status-pills">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`glance-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            >
              All ({matrix.totalMonths} Mos)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              className={`glance-pill completed ${statusFilter === 'Completed' ? 'active' : ''}`}
            >
              <CheckCircle2 size={13} /> Completed ({matrix.completedMonthsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('In-Completed')}
              className={`glance-pill incompleted ${statusFilter === 'In-Completed' ? 'active' : ''}`}
            >
              <Clock size={13} /> In-Completed ({matrix.totalMonths - matrix.completedMonthsCount})
            </button>
            {rolloverStats.countRecovered > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('RolloverRecovered')}
                className={`glance-pill ${statusFilter === 'RolloverRecovered' ? 'active' : ''}`}
                style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' }}
                title="Filter months where unfulfilled debts got fulfilled in the next month"
              >
                <Link2 size={13} /> Next-Month Fulfilled ({rolloverStats.countRecovered})
              </button>
            )}
          </div>
        </div>

        <div className="glance-toolbar-right">
          {/* Search */}
          <div className="borrow-search-wrapper" style={{ minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search month or creditor..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="borrow-search-input"
            />
          </div>

          {/* Creditor Dropdown */}
          <div className="filter-select-wrapper">
            <Filter size={13} className="filter-icon" />
            <select
              value={selectedCreditor}
              onChange={e => setSelectedCreditor(e.target.value)}
              className="borrow-select-filter"
            >
              <option value="ALL">All Creditors ({uniqueCreditors.length})</option>
              {uniqueCreditors.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Direct Add Repayment Schedule Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            title="Schedule a new planned repayment"
          >
            <Plus size={15} /> + Add Schedule
          </button>

          {/* Refresh / Sync Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm"
            title="Refresh schedule"
          >
            <RefreshCw size={13} className={isFetching ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* ─── SINGLE GLANCE MATRIX BOARD (VIEW MODE: 'matrix') ────────────── */}
      {viewMode === 'matrix' && (
        <div className="glance-matrix-container">
          <div className="glance-columns-track">
            {filteredColumns.map((col, idx) => {
              const realColIdx = matrix.columns.findIndex(c => c.targetMonth === col.targetMonth);
              const isColCompleted = col.status === 'Completed';

              // Unfulfilled items check for this column
              const unfulfilledItems = col.items.filter(it => it.status !== 'Completed');
              const nextMonthRecoveredCount = unfulfilledItems.filter(it => {
                const chk = checkNextMonthFulfillment(it, realColIdx, matrix.columns);
                return chk.isFulfilledInNextMonth;
              }).length;

              const nextCol = matrix.columns[realColIdx + 1];

              return (
                <div
                  key={col.targetMonth}
                  className={`glance-month-card glass-panel ${isColCompleted ? 'completed-card' : 'incompleted-card'}`}
                >
                  {/* Column Header */}
                  <div className="glance-card-header">
                    <div className="glance-month-meta">
                      <span className="glance-month-index">Month 0{col.monthIndex || realColIdx + 1}</span>
                      <span className="glance-target-date">{col.targetDate}</span>
                    </div>
                    <h4 className="glance-month-title">{col.targetMonth}</h4>

                    {/* Big Monthly Total */}
                    <div className="glance-month-total-box">
                      <span className="glance-total-label">MONTH TOTAL</span>
                      <span className="glance-total-amount">{formatINR(col.monthTotal)}</span>
                    </div>

                    {/* Column Status Pill with 1-click Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleColumnAll(col)}
                      className={`glance-col-status-pill ${isColCompleted ? 'completed' : 'incompleted'}`}
                      title="Click to toggle all items in this month"
                    >
                      {isColCompleted ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock size={13} />
                          <span>In-Completed</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* SMART NEXT-MONTH CONSTRAINT CHECK BANNER (If Month is In-Completed) */}
                  {!isColCompleted && nextCol && (
                    <div className="glance-constraint-alert-box">
                      <div className="glance-constraint-header">
                        <Link2 size={13} className="constraint-icon" />
                        <span>Next Month Check ({nextCol.targetMonth}):</span>
                      </div>
                      <div className="glance-constraint-content">
                        {nextMonthRecoveredCount > 0 ? (
                          <span className="constraint-success-text">
                            ✓ {nextMonthRecoveredCount} of {unfulfilledItems.length} unfulfilled items fulfilled in {nextCol.targetMonth}!
                          </span>
                        ) : (
                          <span className="constraint-warning-text">
                            ⚠️ Not yet fulfilled in next month ({nextCol.targetMonth}).
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items List Inside Month */}
                  <div className="glance-card-body">
                    <div className="glance-items-heading">
                      <span>Creditor Breakdown ({col.itemCount})</span>
                      <span className="glance-hint-text">1-click to toggle</span>
                    </div>

                    <div className="glance-items-list">
                      {col.items.map(item => {
                        const isItemCompleted = item.status === 'Completed';
                        const nextCheck = checkNextMonthFulfillment(item, realColIdx, matrix.columns);
                        const prevRollover = checkIsPreviousMonthRollover(item, realColIdx, matrix.columns);

                        return (
                          <div
                            key={item.id || item._id}
                            className={`glance-item-row ${isItemCompleted ? 'item-done' : 'item-pending'}`}
                          >
                            <div className="glance-item-info">
                              <div className="glance-item-creditor-row">
                                <span className="glance-creditor-name">{item.creditorName}</span>
                                <span className="glance-item-amount">{formatINR(item.plannedAmount)}</span>
                              </div>

                              {/* Previous Month Rollover Banner (e.g. In June for Fazeeth & Credit Card) */}
                              {prevRollover.isRollover && isItemCompleted && (
                                <div className="glance-rollover-tag settled" title={`Settles commitment carried from ${prevRollover.prevMonthName}`}>
                                  <Sparkles size={11} /> Settles {prevRollover.prevMonthName} rollover
                                </div>
                              )}

                              {/* Next-Month Fulfillment Check Badge (When this item is In-Completed) */}
                              {!isItemCompleted && nextCheck.hasCheck && (
                                <div
                                  className={`glance-next-month-chip ${nextCheck.badgeType}`}
                                  title={nextCheck.detailMessage}
                                >
                                  {nextCheck.badgeType === 'fulfilled' ? (
                                    <CheckCircle2 size={11} className="chip-icon" />
                                  ) : nextCheck.badgeType === 'partial' ? (
                                    <AlertTriangle size={11} className="chip-icon" />
                                  ) : (
                                    <Clock size={11} className="chip-icon" />
                                  )}
                                  <span>{nextCheck.badgeText}</span>
                                </div>
                              )}
                            </div>

                            {/* Item Actions: Toggle Status & Delete */}
                            <div className="glance-item-actions-group">
                              {/* Direct 1-Click Interactive Status Toggle */}
                              <button
                                type="button"
                                onClick={e => handleToggleItemStatus(item, e)}
                                disabled={toggleStatusMutation.isPending}
                                className={`glance-item-toggle-btn ${isItemCompleted ? 'done' : 'pending'}`}
                                title={`Click to mark as ${isItemCompleted ? 'In-Completed' : 'Completed'}`}
                              >
                                {isItemCompleted ? (
                                  <CheckSquare size={13} className="emerald-icon" />
                                ) : (
                                  <Clock size={13} className="amber-icon" />
                                )}
                                <span>{isItemCompleted ? 'Done' : 'Pending'}</span>
                              </button>

                              {/* Delete Item Option */}
                              <button
                                type="button"
                                onClick={e => triggerDeleteItem(item, e)}
                                disabled={deleteItemMutation.isPending}
                                className="glance-item-del-btn"
                                title={`Delete scheduled repayment for ${item.creditorName}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer Summary */}
                  <div className="glance-card-footer">
                    <span className="glance-footer-badge">
                      {isColCompleted
                        ? '✓ 100% Settled on Schedule'
                        : nextMonthRecoveredCount > 0
                        ? `✓ Partially Resolved in Next Month`
                        : '⏳ Action Required (Unsettled)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── DETAILED LEDGER TABLE (VIEW MODE: 'table') ───────────────────── */}
      {viewMode === 'table' && (
        <div className="borrow-table-container glass-panel">
          <table className="borrow-data-table">
            <thead>
              <tr>
                <th>Scheduled Month</th>
                <th>Target Date</th>
                <th>Creditor Name</th>
                <th className="th-amount">Planned Amount (INR)</th>
                <th>Current Status</th>
                <th>Next-Month Constraint Check</th>
                <th className="th-action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allFlattenedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    <div className="empty-table-placeholder">
                      <CalendarClock size={28} />
                      <p>No planned repayment items matched your filter criteria.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: 8 }}
                      >
                        + Add First Planned Repayment
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                allFlattenedItems.map(item => {
                  const isDone = item.status === 'Completed';
                  const nextCheck = item.nextCheck;

                  return (
                    <tr key={item.id || item._id} className="borrow-row">
                      <td>
                        <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                          {item.monthLabel}
                        </strong>
                      </td>
                      <td className="td-date">
                        <span>{item.targetDate}</span>
                      </td>
                      <td className="td-creditor">
                        <div className="creditor-avatar-cell">
                          <div className="creditor-avatar-circle">
                            {item.creditorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="creditor-fullname">{item.creditorName}</span>
                        </div>
                      </td>
                      <td className="td-amount borrow-amt">
                        {formatINR(item.plannedAmount)}
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-emerald' : 'badge-amber'}`}>
                          {isDone ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {item.status}
                        </span>
                      </td>

                      {/* Next Month Constraint Status Cell */}
                      <td>
                        {isDone ? (
                          item.prevRollover.isRollover ? (
                            <span className="glance-table-pill settled">
                              <Sparkles size={11} /> Settled rollover from {item.prevRollover.prevMonthName}
                            </span>
                          ) : (
                            <span className="glance-table-pill on-time">
                              <CheckCircle2 size={11} /> On Schedule
                            </span>
                          )
                        ) : (
                          <span className={`glance-table-pill ${nextCheck.badgeType}`}>
                            {nextCheck.badgeType === 'fulfilled' ? (
                              <CheckCircle2 size={11} />
                            ) : (
                              <Clock size={11} />
                            )}
                            {nextCheck.badgeText}
                          </span>
                        )}
                      </td>

                      {/* Table Actions: Toggle & Delete */}
                      <td className="td-action">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleItemStatus(item)}
                            disabled={toggleStatusMutation.isPending}
                            className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            {isDone ? 'Mark In-Completed' : 'Mark Completed'}
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerDeleteItem(item)}
                            disabled={deleteItemMutation.isPending}
                            className="btn-icon-delete"
                            title={`Delete ${item.creditorName}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="aggregation-footer-row">
                <td colSpan={3}>
                  <div className="footer-label">
                    <span>Grand Total ({allFlattenedItems.length} items)</span>
                  </div>
                </td>
                <td className="amount-borrowed-col">
                  {formatINR(allFlattenedItems.reduce((acc, it) => acc + (Number(it.plannedAmount) || 0), 0))}
                </td>
                <td colSpan={3} className="text-align-center">
                  <span className="footer-reset-hint">
                    {matrix.completedMonthsCount} of {matrix.totalMonths} months fulfilled ({formatINR(matrix.totalCompleted)})
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ─── EMBEDDED QUICK ADD PLANNED REPAYMENT MODAL ───────────────────── */}
      {isAddModalOpen && (
        <div className="modal-overlay-backdrop">
          <div className="glass-panel modal-content-card" style={{ maxWidth: 480 }}>
            {/* Modal Header */}
            <div className="modal-header-row">
              <div className="modal-header-with-icon">
                <div className="modal-icon-badge borrow">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h3 className="modal-title-main">Add Planned Repayment</h3>
                  <div className="modal-subtitle-schema">Add a new scheduled repayment item</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn-icon"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="modal-form-vertical">
              {/* Creditor Name with Suggestions */}
              <div className="form-group-custom">
                <label className="form-label-custom">Creditor / Person Name</label>
                <input
                  type="text"
                  list="glance-creditor-suggestions"
                  value={addForm.creditorName}
                  onChange={e => setAddForm(prev => ({ ...prev, creditorName: e.target.value }))}
                  placeholder="e.g. Credit Card, Dad, Fazeeth, Akash"
                  className="form-input-custom"
                  required
                  autoFocus
                />
                {uniqueCreditors.length > 0 && (
                  <datalist id="glance-creditor-suggestions">
                    {uniqueCreditors.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                )}
              </div>

              {/* Amount (₹ INR) & Target Date */}
              <div className="form-grid-two-cols">
                <div className="form-group-custom">
                  <label className="form-label-custom">Planned Amount (₹ INR)</label>
                  <div className="currency-input-wrap">
                    <span className="currency-symbol-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={addForm.plannedAmount}
                      onChange={e => setAddForm(prev => ({ ...prev, plannedAmount: e.target.value }))}
                      placeholder="10000.00"
                      className="form-input-custom input-with-prefix"
                      required
                    />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="form-label-custom">Scheduled Target Date</label>
                  <input
                    type="date"
                    value={addForm.targetDate}
                    onChange={e => setAddForm(prev => ({ ...prev, targetDate: e.target.value }))}
                    className="form-input-custom"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div className="form-group-custom">
                <label className="form-label-custom">Initial Repayment Status</label>
                <select
                  value={addForm.status}
                  onChange={e => setAddForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="form-input-custom select-custom"
                >
                  <option value="In-Completed">In-Completed (Pending Schedule)</option>
                  <option value="Completed">Completed (Already Fulfilled)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="form-group-custom">
                <label className="form-label-custom">Notes / Installment Details (Optional)</label>
                <input
                  type="text"
                  value={addForm.notes}
                  onChange={e => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. 2nd installment, UPI transfer, salary day settlement"
                  className="form-input-custom"
                />
              </div>

              {/* Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItemMutation.isPending}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {createItemMutation.isPending ? (
                    <RefreshCw size={14} className="spin-icon" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Save to Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DEDICATED DELETE CONFIRMATION MODAL ─────────────────────────── */}
      {deleteConfirm.isOpen && (
        <div className="modal-overlay-backdrop">
          <div className="glass-panel modal-content-card" style={{ maxWidth: 440 }}>
            <div className="modal-header-row">
              <div className="modal-header-with-icon">
                <div className="modal-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="modal-title-main">Delete Planned Repayment?</h3>
                  <div className="modal-subtitle-schema">This will remove the item from the schedule</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', creditorName: '', amount: 0, month: '' })}
                className="btn-icon"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to delete the scheduled repayment for{' '}
              <strong style={{ color: '#ffffff' }}>{deleteConfirm.creditorName}</strong> ({formatINR(deleteConfirm.amount)}) in{' '}
              <strong style={{ color: '#ffffff' }}>{deleteConfirm.month}</strong>?
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, id: '', creditorName: '', amount: 0, month: '' })}
                className="btn btn-secondary"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteItemMutation.isPending}
                className="btn btn-danger"
                style={{ background: '#ef4444', borderColor: '#dc2626', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {deleteItemMutation.isPending ? <RefreshCw size={14} className="spin-icon" /> : <Trash2 size={14} />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
