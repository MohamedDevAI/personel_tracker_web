/**
 * Hook that encapsulates all state and logic for the Borrow & Repay module.
 * Extracts ~300 lines of logic from BorrowRepayView.tsx.
 */

import { useState, useMemo, useCallback } from 'react';
import { borrowRepayApi } from '../services/borrowRepayApi';
import { parseDateMonthYear, MONTH_NAMES } from '../utils/dateHelpers';
import { formatINR } from '../utils/formatters';
import type {
  BorrowRepayRecord,
  BorrowRepayType,
  PlannedRepayment,
  PlannedRepaymentStatus,
} from '../types';

// Re-export for convenience
export { formatINR };

type BorrowRepayStep = 'credit_tracker' | 'planned_repayment';

export function useBorrowRepay() {
  // ── Step Navigation ─────────────────────────────────────────────────────

  const [activeStep, setActiveStep] = useState<BorrowRepayStep>('credit_tracker');

  // ── Shared Filters ──────────────────────────────────────────────────────

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Credit Tracker State ────────────────────────────────────────────────

  const [records, setRecords] = useState<BorrowRepayRecord[]>(() => borrowRepayApi.getRecords());
  const [typeFilter, setTypeFilter] = useState<'ALL' | BorrowRepayType>('ALL');
  const [selectedCreditorFilter, setSelectedCreditorFilter] = useState<string>('ALL');

  // ── Planned Repayments State ────────────────────────────────────────────

  const [plannedRepayments, setPlannedRepayments] = useState<PlannedRepayment[]>(
    () => borrowRepayApi.getPlannedRepayments()
  );
  const [plannedStatusFilter, setPlannedStatusFilter] = useState<'ALL' | PlannedRepaymentStatus>('ALL');

  // ── Data Refresh ────────────────────────────────────────────────────────

  const refreshAllData = useCallback(() => {
    setRecords(borrowRepayApi.getRecords());
    setPlannedRepayments(borrowRepayApi.getPlannedRepayments());
  }, []);

  // ── Available Years ─────────────────────────────────────────────────────

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach((r) => {
      const { year } = parseDateMonthYear(r.date);
      if (year) years.add(year);
    });
    plannedRepayments.forEach((p) => {
      const { year } = parseDateMonthYear(p.targetDate);
      if (year) years.add(year);
    });
    ['2024', '2025', '2026'].forEach((y) => years.add(y));
    return Array.from(years).sort().reverse();
  }, [records, plannedRepayments]);

  // ── Creditor Data ───────────────────────────────────────────────────────

  const creditorSummaries = useMemo(
    () => borrowRepayApi.getCreditorSummaries(),
    [records]
  );

  const stats = useMemo(
    () => borrowRepayApi.getOverallStats(),
    [records]
  );

  const existingCreditors = useMemo(() => {
    const fromRecords = records.map((r) => r.creditorName.trim());
    const fromPlans = plannedRepayments.map((p) => p.creditorName.trim());
    return Array.from(new Set([...fromRecords, ...fromPlans])).filter(Boolean);
  }, [records, plannedRepayments]);

  // ── Filtered Records ────────────────────────────────────────────────────

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || r.type === typeFilter;
      const matchesCreditor = selectedCreditorFilter === 'ALL' || r.creditorName === selectedCreditorFilter;

      const { month, year } = parseDateMonthYear(r.date);
      const matchesMonth = selectedMonth === 'ALL' || month === selectedMonth;
      const matchesYear = selectedYear === 'ALL' || year === selectedYear;

      return matchesSearch && matchesType && matchesCreditor && matchesMonth && matchesYear;
    });
  }, [records, searchQuery, typeFilter, selectedCreditorFilter, selectedMonth, selectedYear]);

  // ── Filtered Planned Repayments ─────────────────────────────────────────

  const filteredPlannedRepayments = useMemo(() => {
    return plannedRepayments.filter((p) => {
      const matchesSearch =
        p.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = plannedStatusFilter === 'ALL' || p.status === plannedStatusFilter;

      const { month, year } = parseDateMonthYear(p.targetDate);
      const matchesMonth = selectedMonth === 'ALL' || month === selectedMonth;
      const matchesYear = selectedYear === 'ALL' || year === selectedYear;

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [plannedRepayments, searchQuery, plannedStatusFilter, selectedMonth, selectedYear]);

  // ── Planned Stats ───────────────────────────────────────────────────────

  const plannedStats = useMemo(() => {
    const totalPlanned = plannedRepayments.reduce((acc, p) => acc + Number(p.plannedAmount), 0);
    const totalPaid = plannedRepayments
      .filter((p) => p.status === 'Paid')
      .reduce((acc, p) => acc + Number(p.plannedAmount), 0);

    return {
      totalPlanned,
      totalPaid,
      pendingScheduled: Math.max(0, totalPlanned - totalPaid),
      scheduledCount: plannedRepayments.filter((p) => p.status === 'Scheduled').length,
    };
  }, [plannedRepayments]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleAddCreditRecord = useCallback(
    (newRecord: Omit<BorrowRepayRecord, 'id' | 'createdAt'>) => {
      borrowRepayApi.createRecord(newRecord);
      refreshAllData();
    },
    [refreshAllData]
  );

  const handleDeleteCreditRecord = useCallback(
    (id: string) => {
      borrowRepayApi.deleteRecord(id);
      refreshAllData();
    },
    [refreshAllData]
  );

  const handleAddPlannedRepayment = useCallback(
    (newPlan: Omit<PlannedRepayment, 'id' | 'createdAt'>) => {
      borrowRepayApi.createPlannedRepayment(newPlan);
      refreshAllData();
    },
    [refreshAllData]
  );

  const handleDeletePlannedRepayment = useCallback(
    (id: string) => {
      borrowRepayApi.deletePlannedRepayment(id);
      refreshAllData();
    },
    [refreshAllData]
  );

  const handleMarkAsPaid = useCallback(
    (id: string) => {
      const res = borrowRepayApi.markPlannedRepaymentAsPaid(id);
      if (res) refreshAllData();
    },
    [refreshAllData]
  );

  return {
    // Step navigation
    activeStep,
    setActiveStep,

    // Shared filters
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    searchQuery,
    setSearchQuery,

    // Credit tracker filters
    typeFilter,
    setTypeFilter,
    selectedCreditorFilter,
    setSelectedCreditorFilter,

    // Planned repayment filters
    plannedStatusFilter,
    setPlannedStatusFilter,

    // Data
    records,
    plannedRepayments,
    availableYears,
    creditorSummaries,
    stats,
    existingCreditors,
    filteredRecords,
    filteredPlannedRepayments,
    plannedStats,

    // Actions
    handleAddCreditRecord,
    handleDeleteCreditRecord,
    handleAddPlannedRepayment,
    handleDeletePlannedRepayment,
    handleMarkAsPaid,
    refreshAllData,
  };
}
