import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BorrowRepayRecord, BorrowRepayType, PlannedRepayment, PlannedRepaymentStatus, PlannedRepayCreditItem } from '../../../../types';
import { borrowRepayApi } from '../../../../services/borrowRepayApi';
import { plannedRepayCreditApi } from '../../../../services/plannedRepayCreditApi';
import { MONTH_NAMES, getCurrentYear, parseDateMonthYear } from '../../../../utils/dateHelpers';
import { formatINR } from '../../../../utils/formatters';
import { useBorrowRepayRecordsQuery, usePlannedRepaymentsQuery, QUERY_KEYS } from '../../../../hooks';

export type BorrowRepayStep = 'aggregation' | 'creditor_transactions' | 'all_transactions' | 'planned_repayment' | 'credit_tracker';

export function useBorrowRepayData(initialMonth?: string, initialYear?: string) {
  const queryClient = useQueryClient();

  // ── Tab/Step state ──────────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState<BorrowRepayStep>('aggregation');

  // ── Filter state ────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string>(() => initialMonth || 'ALL');
  const [selectedYear, setSelectedYear] = useState<string>(() => initialYear || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | BorrowRepayType>('ALL');
  const [selectedCreditorFilter, setSelectedCreditorFilter] = useState<string>('ALL');
  const [aggSearchQuery, setAggSearchQuery] = useState('');
  const [aggStatusFilter, setAggStatusFilter] = useState<'ALL' | 'Due' | 'Settled' | 'Credit Given' | 'Overpaid'>('ALL');
  const [plannedStatusFilter, setPlannedStatusFilter] = useState<'ALL' | PlannedRepaymentStatus>('ALL');

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPlannedModalOpen, setIsPlannedModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<BorrowRepayType>('Borrow');
  const [modalInitialCreditor, setModalInitialCreditor] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'credit_record' | 'planned_repayment';
    id: string;
    itemName: string;
  }>({ isOpen: false, type: 'credit_record', id: '', itemName: '' });

  // ── Data Queries ─────────────────────────────────────────────────────────────
  const { data: records = [] } = useBorrowRepayRecordsQuery();
  const { data: plannedRepayments = [] } = usePlannedRepaymentsQuery();

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BORROW_REPAY_RECORDS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLANNED_REPAYMENTS });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLANNED_REPAY_CREDIT_MATRIX });
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
    mutationFn: async (plan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => {
      const d = new Date(plan.targetDate);
      const mIdx = !isNaN(d.getTime()) ? d.getMonth() + 1 : 10;
      const mName = !isNaN(d.getTime()) ? `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : 'October 2026';

      const creditItem: Omit<PlannedRepayCreditItem, 'id' | '_id'> = {
        targetDate: plan.targetDate,
        targetMonth: mName,
        monthIndex: mIdx,
        creditorName: plan.creditorName,
        plannedAmount: plan.plannedAmount,
        status: (plan.status === 'Paid' ? 'Completed' : 'In-Completed') as 'Completed' | 'In-Completed',
        notes: plan.notes || ''
      };

      try { await plannedRepayCreditApi.create(creditItem); }
      catch (e) { console.warn('Error saving to plannedRepayCreditApi:', e); }

      return borrowRepayApi.createPlannedRepayment(plan);
    },
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

  // ── Derived data ─────────────────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach(r => { const { year } = parseDateMonthYear(r.date); if (year) years.add(year); });
    plannedRepayments.forEach(p => { const { year } = parseDateMonthYear(p.targetDate); if (year) years.add(year); });
    const curYr = getCurrentYear();
    [curYr - 1, curYr, curYr + 1].forEach(y => years.add(String(y)));
    return Array.from(years).sort().reverse();
  }, [records, plannedRepayments]);

  const creditorSummaries = useMemo(() => borrowRepayApi.getCreditorSummaries(records), [records]);
  const stats = useMemo(() => borrowRepayApi.getOverallStats(records), [records]);

  const existingCreditors = useMemo(() => {
    const fromRecords = records.map(r => r.creditorName.trim());
    const fromPlans = plannedRepayments.map(p => p.creditorName.trim());
    return Array.from(new Set([...fromRecords, ...fromPlans])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [records, plannedRepayments]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesSearch = r.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
      const matchesCreditor = selectedCreditorFilter === 'ALL' ||
        r.creditorName.trim().toLowerCase() === selectedCreditorFilter.trim().toLowerCase();
      const { month, year } = parseDateMonthYear(r.date);
      const matchesMonth = selectedMonth === 'ALL' || month === selectedMonth;
      const matchesYear = selectedYear === 'ALL' || year === selectedYear;
      return matchesSearch && matchesType && matchesCreditor && matchesMonth && matchesYear;
    });
  }, [records, searchQuery, typeFilter, selectedCreditorFilter, selectedMonth, selectedYear]);

  const activeFilterTotals = useMemo(() => {
    let borrowed = 0, repaid = 0, creditGiven = 0;
    filteredRecords.forEach(r => {
      const amt = Math.abs(Number(r.amount) || 0);
      if (r.type === 'Credit Given' || (r.type === 'Borrow' && Number(r.amount) < 0)) {
        creditGiven += amt;
      } else if (r.type === 'Borrow') {
        borrowed += amt;
      } else {
        repaid += amt;
      }
    });
    return { borrowed, repaid, creditGiven, net: borrowed - repaid - creditGiven };
  }, [filteredRecords]);

  const filteredCreditorSummaries = useMemo(() => {
    return creditorSummaries.filter(c => {
      const matchesSearch = !aggSearchQuery.trim() || c.creditorName.toLowerCase().includes(aggSearchQuery.toLowerCase());
      const matchesStatus =
        aggStatusFilter === 'ALL' ||
        (aggStatusFilter === 'Due' && c.netBalance > 0) ||
        (aggStatusFilter === 'Settled' && c.netBalance === 0) ||
        (aggStatusFilter === 'Credit Given' && (c.status === 'Credit Given' || ((c.creditGiven || 0) > 0 && c.netBalance <= 0))) ||
        (aggStatusFilter === 'Overpaid' && c.status === 'Overpaid');
      return matchesSearch && matchesStatus;
    });
  }, [creditorSummaries, aggSearchQuery, aggStatusFilter]);

  const yearlySummaries = useMemo(() => {
    const yearMap: Record<string, { year: string; totalBorrowed: number; totalRepaid: number; creditGiven: number; txCount: number }> = {};
    records.forEach(r => {
      const { year } = parseDateMonthYear(r.date);
      if (!year) return;
      if (!yearMap[year]) yearMap[year] = { year, totalBorrowed: 0, totalRepaid: 0, creditGiven: 0, txCount: 0 };
      yearMap[year].txCount += 1;
      const amt = Math.abs(Number(r.amount) || 0);
      if (r.type === 'Credit Given' || (r.type === 'Borrow' && Number(r.amount) < 0)) {
        yearMap[year].creditGiven += amt;
      } else if (r.type === 'Borrow') {
        yearMap[year].totalBorrowed += amt;
      } else {
        yearMap[year].totalRepaid += amt;
      }
    });
    return Object.values(yearMap).sort((a, b) => b.year.localeCompare(a.year));
  }, [records]);

  const filteredPlannedRepayments = useMemo(() => {
    return plannedRepayments.filter(p => {
      const matchesSearch = p.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = plannedStatusFilter === 'ALL' || p.status === plannedStatusFilter;
      const { month, year } = parseDateMonthYear(p.targetDate);
      return matchesSearch && matchesStatus &&
        (selectedMonth === 'ALL' || month === selectedMonth) &&
        (selectedYear === 'ALL' || year === selectedYear);
    });
  }, [plannedRepayments, searchQuery, plannedStatusFilter, selectedMonth, selectedYear]);

  const plannedStats = useMemo(() => {
    const totalPlanned = plannedRepayments.reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const totalPaid = plannedRepayments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    return {
      totalPlanned, totalPaid,
      pendingScheduled: Math.max(0, totalPlanned - totalPaid),
      scheduledCount: plannedRepayments.filter(p => p.status === 'Scheduled').length
    };
  }, [plannedRepayments]);

  // ── Action handlers ──────────────────────────────────────────────────────────
  const handleAddCreditRecord = (newRecord: Omit<BorrowRepayRecord, 'id' | 'createdAt'>) => {
    createRecordMutation.mutate(newRecord);
  };

  const triggerDeleteCreditRecord = (item: BorrowRepayRecord) => {
    setDeleteConfirm({
      isOpen: true, type: 'credit_record', id: item.id,
      itemName: `${item.creditorName} (${item.type} ₹${item.amount}) on ${item.date}`
    });
  };

  const handleOpenCreditModal = (type: BorrowRepayType, creditorName: string = '') => {
    setModalInitialType(type);
    setModalInitialCreditor(creditorName);
    setIsCreditModalOpen(true);
  };

  const handleAddPlannedRepayment = (newPlan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => {
    createPlannedMutation.mutate(newPlan);
  };

  const triggerDeletePlannedRepayment = (plan: PlannedRepayment) => {
    setDeleteConfirm({
      isOpen: true, type: 'planned_repayment', id: plan.id,
      itemName: `${plan.creditorName} - Scheduled Repayment ₹${plan.plannedAmount} for ${plan.targetDate}`
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'credit_record') deleteRecordMutation.mutate(deleteConfirm.id);
    else deletePlannedMutation.mutate(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, type: 'credit_record', id: '', itemName: '' });
  };

  const handleMarkAsPaid = (id: string) => markAsPaidMutation.mutate(id);

  const resetFilters = () => {
    setSelectedMonth('ALL');
    setSelectedYear('ALL');
    setTypeFilter('ALL');
    setSelectedCreditorFilter('ALL');
    setSearchQuery('');
  };

  return {
    // State
    activeStep, setActiveStep,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    selectedCreditorFilter, setSelectedCreditorFilter,
    aggSearchQuery, setAggSearchQuery,
    aggStatusFilter, setAggStatusFilter,
    plannedStatusFilter, setPlannedStatusFilter,
    isCreditModalOpen, setIsCreditModalOpen,
    isPlannedModalOpen, setIsPlannedModalOpen,
    modalInitialType,
    modalInitialCreditor,
    deleteConfirm, setDeleteConfirm,
    // Data
    records, plannedRepayments,
    creditorSummaries, stats, existingCreditors,
    filteredRecords, activeFilterTotals,
    filteredCreditorSummaries, yearlySummaries,
    filteredPlannedRepayments, plannedStats,
    availableYears,
    // Mutations
    createRecordMutation, deleteRecordMutation, markAsPaidMutation,
    // Handlers
    handleAddCreditRecord,
    triggerDeleteCreditRecord,
    handleOpenCreditModal,
    handleAddPlannedRepayment,
    triggerDeletePlannedRepayment,
    handleConfirmDelete,
    handleMarkAsPaid,
    resetFilters,
    // Utilities
    formatINR,
    parseDateMonthYear,
  };
}
