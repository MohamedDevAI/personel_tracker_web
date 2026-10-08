import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { plannedRepayCreditApi } from '../../../../services/plannedRepayCreditApi';
import { getLocalDateISO, parseDateMonthYear, getMonthIndex } from '../../../../utils/dateHelpers';
import { formatINR } from '../../../../utils/formatters';
import type { PlannedRepayCreditItem, PlannedRepayCreditMatrix, BorrowRepayRecord } from '../../../../types';
import { usePlannedRepayCreditMatrixQuery, QUERY_KEYS } from '../../../../hooks';

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

export type GlanceViewMode = 'matrix' | 'table';
export type GlanceStatusFilter = 'ALL' | 'Completed' | 'In-Completed' | 'RolloverRecovered' | 'RolloverPending';

export function useGlanceData(actualRecords: BorrowRepayRecord[] = []) {
  const queryClient = useQueryClient();

  // ── View & Filter State ──────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<GlanceViewMode>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GlanceStatusFilter>('ALL');
  const [selectedCreditor, setSelectedCreditor] = useState<string>('ALL');

  // ── Add Modal State ──────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    creditorName: '',
    targetDate: getLocalDateISO(),
    plannedAmount: '',
    status: 'In-Completed' as 'Completed' | 'In-Completed',
    notes: ''
  });

  // ── Delete Confirm State ─────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean; id: string; creditorName: string; amount: number; month: string;
  }>({ isOpen: false, id: '', creditorName: '', amount: 0, month: '' });

  // ── Data Query ───────────────────────────────────────────────────────────────
  const { data: matrix, isLoading, isFetching, error, refetch } = usePlannedRepayCreditMatrixQuery();

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLANNED_REPAY_CREDIT_MATRIX });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLANNED_REPAYMENTS });
  };

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: 'Completed' | 'In-Completed' }) =>
      plannedRepayCreditApi.updateStatus(id, nextStatus),
    onSuccess: invalidate,
    onError: (err: any) => {
      console.error('Failed to toggle status:', err);
      alert('Failed to update status: ' + (err.message || 'Unknown error'));
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (item: Omit<PlannedRepayCreditItem, 'id' | '_id'>) => plannedRepayCreditApi.create(item),
    onSuccess: () => {
      invalidate();
      setIsAddModalOpen(false);
      setAddForm({ creditorName: '', targetDate: getLocalDateISO(), plannedAmount: '', status: 'In-Completed', notes: '' });
    },
    onError: (err: any) => {
      console.error('Failed to create planned item:', err);
      alert('Failed to save planned item: ' + (err.message || 'Unknown error'));
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => plannedRepayCreditApi.delete(id),
    onSuccess: () => {
      invalidate();
      setDeleteConfirm({ isOpen: false, id: '', creditorName: '', amount: 0, month: '' });
    },
    onError: (err: any) => {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item: ' + (err.message || 'Unknown error'));
    },
  });

  // ── Action Handlers ──────────────────────────────────────────────────────────
  const triggerDeleteItem = (item: PlannedRepayCreditItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemId = item.id || item._id;
    if (!itemId) return;
    setDeleteConfirm({ isOpen: true, id: itemId, creditorName: item.creditorName, amount: item.plannedAmount, month: item.targetMonth });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.id) deleteItemMutation.mutate(deleteConfirm.id);
  };

  const handleToggleItemStatus = (item: PlannedRepayCreditItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const itemId = item.id || item._id;
    if (!itemId) return;
    const nextStatus: 'Completed' | 'In-Completed' = item.status === 'Completed' ? 'In-Completed' : 'Completed';
    toggleStatusMutation.mutate({ id: itemId, nextStatus });
  };

  const handleToggleColumnAll = (column: { status: string; items: PlannedRepayCreditItem[] }) => {
    const targetStatus: 'Completed' | 'In-Completed' = column.status === 'Completed' ? 'In-Completed' : 'Completed';
    column.items.forEach(it => {
      const itId = it.id || it._id;
      if (itId && it.status !== targetStatus) toggleStatusMutation.mutate({ id: itId, nextStatus: targetStatus });
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.creditorName.trim() || !addForm.plannedAmount || Number(addForm.plannedAmount) <= 0) return;
    const { month, year } = parseDateMonthYear(addForm.targetDate);
    const mIdx = month ? getMonthIndex(month) + 1 : 10;
    const mName = month && year ? `${month} ${year}` : addForm.targetDate;
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

  // ── Constraint Engine ────────────────────────────────────────────────────────
  const checkNextMonthFulfillment = useCallback((
    item: PlannedRepayCreditItem,
    columnIndex: number,
    allColumns: PlannedRepayCreditMatrix['columns']
  ): NextMonthCheckInfo => {
    if (item.status === 'Completed') {
      return { hasCheck: false, isUnfulfilled: false, hasNextMonth: false, nextMonthName: '', isFulfilledInNextMonth: false, isPartialInNextMonth: false, isFulfilledInLaterMonth: false, actualRepaidInLedger: false, badgeText: '', badgeType: 'none', detailMessage: 'Fulfilled on schedule' };
    }

    const nextCol = allColumns[columnIndex + 1];
    if (!nextCol) {
      return { hasCheck: true, isUnfulfilled: true, hasNextMonth: false, nextMonthName: 'Final Month', isFulfilledInNextMonth: false, isPartialInNextMonth: false, isFulfilledInLaterMonth: false, actualRepaidInLedger: false, badgeText: 'Final Month (Pending)', badgeType: 'pending', detailMessage: 'Final scheduled month — pending resolution' };
    }

    const nextMonthName = nextCol.targetMonth;
    const targetCreditor = item.creditorName.trim().toLowerCase();
    const nextMonthMatch = nextCol.items.find(it => it.creditorName.trim().toLowerCase() === targetCreditor);

    const actualRepaidRecord = actualRecords.find(r => {
      if (r.type !== 'Repaid') return false;
      if (r.creditorName.trim().toLowerCase() !== targetCreditor) return false;
      const { month, year } = parseDateMonthYear(r.date);
      return `${month} ${year}`.toLowerCase() === nextMonthName.toLowerCase();
    });

    if (nextMonthMatch && nextMonthMatch.status === 'Completed') {
      const isPartial = nextMonthMatch.plannedAmount < item.plannedAmount;
      return {
        hasCheck: true, isUnfulfilled: true, hasNextMonth: true, nextMonthName,
        isFulfilledInNextMonth: true, isPartialInNextMonth: isPartial,
        nextMonthAmount: nextMonthMatch.plannedAmount, isFulfilledInLaterMonth: false,
        actualRepaidInLedger: !!actualRepaidRecord,
        actualRepaidAmount: actualRepaidRecord ? Number(actualRepaidRecord.amount) : undefined,
        badgeText: isPartial
          ? `↳ Partial in ${nextMonthName} (₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')})`
          : `↳ Fulfilled in ${nextMonthName} (₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')} ✓)`,
        badgeType: isPartial ? 'partial' : 'fulfilled',
        detailMessage: isPartial
          ? `Partially recovered in ${nextMonthName}: ₹${nextMonthMatch.plannedAmount.toLocaleString('en-IN')} of ₹${item.plannedAmount.toLocaleString('en-IN')}`
          : `Unfulfilled in this month, but fulfilled in next month (${nextMonthName})`
      };
    }

    if (actualRepaidRecord) {
      return { hasCheck: true, isUnfulfilled: true, hasNextMonth: true, nextMonthName, isFulfilledInNextMonth: true, isPartialInNextMonth: false, isFulfilledInLaterMonth: false, actualRepaidInLedger: true, actualRepaidAmount: Number(actualRepaidRecord.amount), badgeText: `↳ Paid in Ledger in ${nextMonthName} (₹${Number(actualRepaidRecord.amount).toLocaleString('en-IN')} ✓)`, badgeType: 'fulfilled', detailMessage: `Actual repaid transaction logged in ledger during ${nextMonthName}` };
    }

    if (nextMonthMatch && nextMonthMatch.status === 'In-Completed') {
      return { hasCheck: true, isUnfulfilled: true, hasNextMonth: true, nextMonthName, isFulfilledInNextMonth: false, isPartialInNextMonth: false, nextMonthAmount: nextMonthMatch.plannedAmount, isFulfilledInLaterMonth: false, actualRepaidInLedger: false, badgeText: `⚠️ In-Completed in ${nextMonthName}`, badgeType: 'pending', detailMessage: `Carried forward to ${nextMonthName} but still In-Completed` };
    }

    for (let laterIdx = columnIndex + 2; laterIdx < allColumns.length; laterIdx++) {
      const laterCol = allColumns[laterIdx];
      const laterMatch = laterCol.items.find(it => it.creditorName.trim().toLowerCase() === targetCreditor && it.status === 'Completed');
      if (laterMatch) {
        return { hasCheck: true, isUnfulfilled: true, hasNextMonth: true, nextMonthName, isFulfilledInNextMonth: false, isPartialInNextMonth: false, isFulfilledInLaterMonth: true, laterMonthName: laterCol.targetMonth, actualRepaidInLedger: false, badgeText: `↳ Fulfilled later in ${laterCol.targetMonth} (₹${laterMatch.plannedAmount.toLocaleString('en-IN')} ✓)`, badgeType: 'partial', detailMessage: `Not in next month (${nextMonthName}), but settled later in ${laterCol.targetMonth}` };
      }
    }

    return { hasCheck: true, isUnfulfilled: true, hasNextMonth: true, nextMonthName, isFulfilledInNextMonth: false, isPartialInNextMonth: false, isFulfilledInLaterMonth: false, actualRepaidInLedger: false, badgeText: `⚠️ Not in ${nextMonthName} (Carried Forward)`, badgeType: 'pending', detailMessage: `This debt was NOT fulfilled in this month nor in next month (${nextMonthName}). Action required.` };
  }, [actualRecords]);

  const checkIsPreviousMonthRollover = useCallback((
    item: PlannedRepayCreditItem,
    columnIndex: number,
    allColumns: PlannedRepayCreditMatrix['columns']
  ): { isRollover: boolean; prevMonthName: string; prevAmount: number } => {
    if (columnIndex === 0) return { isRollover: false, prevMonthName: '', prevAmount: 0 };
    const prevCol = allColumns[columnIndex - 1];
    if (prevCol.status === 'Completed') return { isRollover: false, prevMonthName: '', prevAmount: 0 };
    const targetCreditor = item.creditorName.trim().toLowerCase();
    const unfulfilledInPrev = prevCol.items.find(it => it.creditorName.trim().toLowerCase() === targetCreditor && it.status !== 'Completed');
    if (unfulfilledInPrev) return { isRollover: true, prevMonthName: prevCol.targetMonth, prevAmount: unfulfilledInPrev.plannedAmount };
    return { isRollover: false, prevMonthName: '', prevAmount: 0 };
  }, []);

  // ── Computed / Memos ─────────────────────────────────────────────────────────
  const uniqueCreditors = useMemo(() => {
    if (!matrix?.columns) return [];
    const set = new Set<string>();
    matrix.columns.forEach(col => col.items.forEach(it => { if (it.creditorName) set.add(it.creditorName.trim()); }));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [matrix]);

  const rolloverStats = useMemo(() => {
    if (!matrix?.columns) return { unfulfilledTotal: 0, recoveredInNextTotal: 0, recoveredOriginalTotal: 0, countRecovered: 0, totalUnfulfilledCount: 0 };
    let unfulfilledTotal = 0, recoveredInNextTotal = 0, recoveredOriginalTotal = 0, countRecovered = 0, totalUnfulfilledCount = 0;
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
              recoveredOriginalTotal += it.plannedAmount;
            }
          }
        });
      }
    });
    return { unfulfilledTotal, recoveredInNextTotal, recoveredOriginalTotal, countRecovered, totalUnfulfilledCount };
  }, [matrix, checkNextMonthFulfillment]);

  const effectiveFulfilled = (matrix?.totalCompleted ?? 0) + rolloverStats.recoveredOriginalTotal;
  const truePending = (matrix?.totalInCompleted ?? 0) - rolloverStats.recoveredOriginalTotal;

  const filteredColumns = useMemo(() => {
    if (!matrix?.columns) return [];
    return matrix.columns.filter((col, cIdx) => {
      let matchesStatus = true;
      if (statusFilter === 'Completed') matchesStatus = col.status === 'Completed';
      else if (statusFilter === 'In-Completed') matchesStatus = col.status === 'In-Completed';
      else if (statusFilter === 'RolloverRecovered') matchesStatus = col.items.some(it => checkNextMonthFulfillment(it, cIdx, matrix.columns).isFulfilledInNextMonth);
      else if (statusFilter === 'RolloverPending') matchesStatus = col.items.some(it => it.status !== 'Completed' && !checkNextMonthFulfillment(it, cIdx, matrix.columns).isFulfilledInNextMonth);

      const matchesCreditor = selectedCreditor === 'ALL' || col.items.some(it => it.creditorName === selectedCreditor);
      const matchesSearch = !searchQuery.trim() || col.targetMonth.toLowerCase().includes(searchQuery.toLowerCase()) || col.targetDate.includes(searchQuery) ||
        col.items.some(it => it.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) || (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesStatus && matchesCreditor && matchesSearch;
    });
  }, [matrix, statusFilter, selectedCreditor, searchQuery, checkNextMonthFulfillment]);

  const allFlattenedItems = useMemo(() => {
    if (!matrix?.columns) return [];
    const items: (PlannedRepayCreditItem & { monthLabel: string; columnIndex: number; nextCheck: NextMonthCheckInfo; prevRollover: { isRollover: boolean; prevMonthName: string; prevAmount: number } })[] = [];
    matrix.columns.forEach((col, cIdx) => {
      col.items.forEach(it => {
        items.push({ ...it, monthLabel: col.targetMonth, columnIndex: cIdx, nextCheck: checkNextMonthFulfillment(it, cIdx, matrix.columns), prevRollover: checkIsPreviousMonthRollover(it, cIdx, matrix.columns) });
      });
    });
    return items.filter(it => {
      let matchesStatus = true;
      if (statusFilter === 'Completed') matchesStatus = it.status === 'Completed';
      else if (statusFilter === 'In-Completed') matchesStatus = it.status === 'In-Completed';
      else if (statusFilter === 'RolloverRecovered') matchesStatus = it.nextCheck.isFulfilledInNextMonth;
      else if (statusFilter === 'RolloverPending') matchesStatus = it.status !== 'Completed' && !it.nextCheck.isFulfilledInNextMonth;
      const matchesCreditor = selectedCreditor === 'ALL' || it.creditorName === selectedCreditor;
      const matchesSearch = !searchQuery.trim() || it.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) || it.targetDate.includes(searchQuery) || it.targetMonth.toLowerCase().includes(searchQuery.toLowerCase()) || (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesCreditor && matchesSearch;
    });
  }, [matrix, statusFilter, selectedCreditor, searchQuery, checkNextMonthFulfillment, checkIsPreviousMonthRollover]);

  return {
    // State
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    selectedCreditor, setSelectedCreditor,
    isAddModalOpen, setIsAddModalOpen,
    addForm, setAddForm,
    deleteConfirm, setDeleteConfirm,
    // Query
    matrix, isLoading, isFetching, error, refetch,
    // Mutations
    toggleStatusMutation, createItemMutation, deleteItemMutation,
    // Computed
    uniqueCreditors, rolloverStats, effectiveFulfilled, truePending,
    filteredColumns, allFlattenedItems,
    // Handlers
    triggerDeleteItem, handleConfirmDelete, handleToggleItemStatus,
    handleToggleColumnAll, handleAddSubmit,
    // Constraint Engine
    checkNextMonthFulfillment, checkIsPreviousMonthRollover,
    // Utilities
    formatINR,
  };
}
