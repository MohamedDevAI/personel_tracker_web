/**
 * Hook that encapsulates all transaction filtering, stats computation,
 * and month navigation logic for the ExpenseTracker page.
 */

import { useState, useMemo, useCallback } from 'react';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear, parseTxDate } from '../utils/dateHelpers';
import type { Transaction } from '../types';

interface TransactionFilterState {
  selectedYear: number;
  selectedMonth: string;
  searchQuery: string;
  typeFilter: 'ALL' | 'Credit' | 'Debit';
  categoryFilter: string;
}

interface MonthlyStats {
  totalCredit: number;
  totalDebit: number;
  netBalance: number;
  count: number;
  pieData: Array<{ name: string; value: number }>;
}

export function useTransactionFilters(transactions: Transaction[]) {
  // ── Filter State ────────────────────────────────────────────────────────

  const [selectedYear, setSelectedYear] = useState<number>(() => getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonth());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Credit' | 'Debit'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // ── Available Years ─────────────────────────────────────────────────────

  const availableYears = useMemo(() => {
    const years = new Set<number>([getCurrentYear()]);
    transactions.forEach((t) => {
      const { year } = parseTxDate(t);
      if (!isNaN(year) && year > 1900 && year < 2100) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // ── Monthly Transaction Counts ──────────────────────────────────────────

  const monthlyTransactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MONTH_NAMES.forEach((m) => { counts[m] = 0; });

    transactions.forEach((tx) => {
      const { year, month } = parseTxDate(tx);
      if (year === selectedYear && counts[month] !== undefined) {
        counts[month]++;
      }
    });
    return counts;
  }, [transactions, selectedYear]);

  // ── Total For Year ──────────────────────────────────────────────────────

  const totalTransactionsForYear = useMemo(() => {
    return transactions.filter((t) => parseTxDate(t).year === selectedYear).length;
  }, [transactions, selectedYear]);

  // ── Filtered Transactions ───────────────────────────────────────────────

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
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

  // ── Monthly Stats ───────────────────────────────────────────────────────

  const monthlyStats: MonthlyStats = useMemo(() => {
    let credit = 0;
    let debit = 0;
    const catMap: Record<string, number> = {};

    filteredTransactions.forEach((tx) => {
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

    const pieData = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalCredit: credit,
      totalDebit: debit,
      netBalance: credit - debit,
      count: filteredTransactions.length,
      pieData,
    };
  }, [filteredTransactions]);

  // ── Month Navigation ────────────────────────────────────────────────────

  const handlePrevMonth = useCallback(() => {
    if (selectedMonth === 'All') {
      setSelectedMonth('Dec');
      return;
    }
    const idx = MONTH_NAMES.indexOf(selectedMonth as any);
    if (idx > 0) {
      setSelectedMonth(MONTH_NAMES[idx - 1]);
    } else {
      setSelectedMonth(MONTH_NAMES[11]);
      setSelectedYear((prev) => prev - 1);
    }
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    if (selectedMonth === 'All') {
      setSelectedMonth('Jan');
      return;
    }
    const idx = MONTH_NAMES.indexOf(selectedMonth as any);
    if (idx < 11) {
      setSelectedMonth(MONTH_NAMES[idx + 1]);
    } else {
      setSelectedMonth(MONTH_NAMES[0]);
      setSelectedYear((prev) => prev + 1);
    }
  }, [selectedMonth]);

  // ── Modal Default Date ──────────────────────────────────────────────────

  const modalDefaultDate = useMemo(() => {
    const now = new Date();
    const currentYr = now.getFullYear();
    const currentM = MONTH_NAMES[now.getMonth()];

    if (
      selectedYear === currentYr &&
      (selectedMonth === 'All' || selectedMonth.toLowerCase() === currentM.toLowerCase())
    ) {
      return now.toISOString().split('T')[0];
    }

    const monthIdx = selectedMonth !== 'All'
      ? MONTH_NAMES.indexOf(selectedMonth as any)
      : now.getMonth();
    const safeIdx = monthIdx >= 0 ? monthIdx : now.getMonth();
    const monthNum = String(safeIdx + 1).padStart(2, '0');
    return `${selectedYear}-${monthNum}-01`;
  }, [selectedMonth, selectedYear]);

  const modalDefaultMonth = useMemo(() => {
    const now = new Date();
    const monthIdx = selectedMonth !== 'All'
      ? MONTH_NAMES.indexOf(selectedMonth as any)
      : now.getMonth();
    return MONTH_NAMES[monthIdx >= 0 ? monthIdx : now.getMonth()];
  }, [selectedMonth]);

  return {
    // State
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,

    // Computed
    availableYears,
    monthlyTransactionCounts,
    totalTransactionsForYear,
    filteredTransactions,
    monthlyStats,
    modalDefaultDate,
    modalDefaultMonth,

    // Actions
    handlePrevMonth,
    handleNextMonth,
  };
}
