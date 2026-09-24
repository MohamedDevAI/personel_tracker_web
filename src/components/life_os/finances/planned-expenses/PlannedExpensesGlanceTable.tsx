import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { PlannedExpense } from '../../../../types';
import { MONTH_NAMES, getCurrentYear, getCurrentMonth } from '../../../../utils/dateHelpers';
import GlanceToolbar from './GlanceToolbar';
import GlanceMonthCard from './GlanceMonthCard';
import GlanceAddModal from './GlanceAddModal';
import GlanceDeleteModal from './GlanceDeleteModal';
import './planned-expenses.css';

export interface PlannedExpensesGlanceTableProps {
  plans: PlannedExpense[];
  isLoading?: boolean;
  selectedYear?: number;
  onTogglePlanStatus?: (plan: PlannedExpense, e?: React.MouseEvent) => void;
  onDeletePlan?: (plan: PlannedExpense, e?: React.MouseEvent) => void;
  onAddPlan?: (newPlan: Partial<PlannedExpense>) => void;
  onRefresh?: () => void;
  onSelectMonth?: (monthShort: string, year?: number) => void;
}

export type GlanceViewMode = 'matrix' | 'table';
export type GlanceStatusFilter = 'ALL' | 'Completed' | 'In-Completed';

export interface GlanceColumn {
  monthIndex: number;
  year: number;
  mShort: string;
  targetMonth: string;
  targetDate: string;
  monthTotal: number;
  status: 'Completed' | 'In-Completed';
  itemCount: number;
  items: PlannedExpense[];
  isCurrent: boolean;
  isNextYear: boolean;
  isPast: boolean;
}

export default function PlannedExpensesGlanceTable({
  plans: initialPlans = [],
  isLoading = false,
  selectedYear: _selectedYear = getCurrentYear(),
  onTogglePlanStatus,
  onDeletePlan,
  onAddPlan,
  onRefresh,
  onSelectMonth
}: PlannedExpensesGlanceTableProps) {
  // Real-world Calendar Anchors
  const calendarYear = getCurrentYear();
  const calendarMonthShort = getCurrentMonth();
  const calendarMonthIdx = MONTH_NAMES.indexOf(calendarMonthShort as any);

  // Local state for interactive fallback / instant UI response
  const [localPlans, setLocalPlans] = useState<PlannedExpense[]>(initialPlans);
  const [viewMode, setViewMode] = useState<GlanceViewMode>('matrix');
  const [statusFilter, setStatusFilter] = useState<GlanceStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // DOM Refs for auto-scroll landing on current month
  const containerRef = useRef<HTMLDivElement>(null);
  const currentMonthCardRef = useRef<HTMLDivElement>(null);

  // Synchronize localPlans when initialPlans updates
  useEffect(() => {
    setLocalPlans(initialPlans);
  }, [initialPlans]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMonth, setNewMonth] = useState<string>(calendarMonthShort);
  const [newYear, setNewYear] = useState<number>(calendarYear);
  const [newNotes, setNewNotes] = useState('');
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<PlannedExpense | null>(null);

  // Unique Categories
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    localPlans.forEach(p => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [localPlans]);

  // 1-Click Toggle Item Fulfillment Status
  const handleToggleItem = (plan: PlannedExpense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const plannedVal = plan.plannedAmount || 0;
    const isCurrentlyFulfilled =
      plan.isFulfilled || plan.status === 'Fulfilled' || (plan.paidAmount ?? 0) >= plannedVal;
    const nextFulfilled = !isCurrentlyFulfilled;

    setLocalPlans(prev =>
      prev.map(p =>
        p.id === plan.id
          ? {
            ...p,
            isFulfilled: nextFulfilled,
            status: nextFulfilled ? 'Fulfilled' : 'Planned',
            paidAmount: nextFulfilled ? plannedVal : 0
          }
          : p
      )
    );

    if (onTogglePlanStatus) {
      onTogglePlanStatus(
        {
          ...plan,
          isFulfilled: nextFulfilled,
          status: nextFulfilled ? 'Fulfilled' : 'Planned',
          paidAmount: nextFulfilled ? plannedVal : 0
        },
        e
      );
    }
  };

  // Toggle All items in a Month Column
  const handleToggleColumn = (monthShort: string, colYear: number, isMonthCompleted: boolean) => {
    const targetFulfilled = !isMonthCompleted;
    setLocalPlans(prev =>
      prev.map(p => {
        const planYear = p.year || calendarYear;
        const matchesYear = planYear === colYear;
        const matchesMonth =
          (p.month || '').toLowerCase().slice(0, 3) === monthShort.toLowerCase().slice(0, 3);
        if (matchesYear && matchesMonth) {
          const plannedVal = p.plannedAmount || 0;
          return {
            ...p,
            isFulfilled: targetFulfilled,
            status: targetFulfilled ? 'Fulfilled' : 'Planned',
            paidAmount: targetFulfilled ? plannedVal : 0
          };
        }
        return p;
      })
    );
  };

  // Delete Item Handler
  const handleDeleteItem = (plan: PlannedExpense, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmPlan(plan);
  };

  const confirmDelete = () => {
    if (!deleteConfirmPlan) return;
    setLocalPlans(prev => prev.filter(p => p.id !== deleteConfirmPlan.id));
    if (onDeletePlan) {
      onDeletePlan(deleteConfirmPlan);
    }
    setDeleteConfirmPlan(null);
  };

  // Handle Add Item Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount || Number(newAmount) <= 0) return;

    const created: PlannedExpense = {
      id: `plan-${Date.now()}`,
      title: newTitle.trim(),
      month: newMonth,
      year: newYear,
      plannedAmount: parseFloat(newAmount),
      paidAmount: 0,
      isFulfilled: false,
      status: 'Planned',
      notes: newNotes.trim() || undefined
    };

    setLocalPlans(prev => [...prev, created]);
    if (onAddPlan) {
      onAddPlan(created);
    }

    setNewTitle('');
    setNewAmount('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  // ── Multi-Month Cross-Year Column Matrix Generation ─────────────────────────
  // Generates timeline ONLY for months that actually have planned expenses data
  const columns: GlanceColumn[] = useMemo(() => {
    const planYears = Array.from(
      new Set(localPlans.map(p => p.year || calendarYear))
    ).sort((a, b) => a - b);

    const minYear = planYears.length > 0 ? Math.min(...planYears) : calendarYear;
    const maxYear = planYears.length > 0 ? Math.max(...planYears) : calendarYear;

    const generated: GlanceColumn[] = [];

    // Loop through years present in data
    for (let yr = minYear; yr <= maxYear; yr++) {
      MONTH_NAMES.forEach((mShort, idx) => {
        const monthIndex = idx + 1;
        const targetMonth = `${mShort} ${yr}`;
        const monthPadded = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
        const targetDate = `${yr}-${monthPadded}-01`;

        const isCurrent = yr === calendarYear && idx === calendarMonthIdx;
        const isNextYear = yr > calendarYear;
        const isPast = yr < calendarYear || (yr === calendarYear && idx < calendarMonthIdx);

        // Find plans matching this specific month and year
        const monthItems = localPlans.filter(p => {
          const planYear = p.year || calendarYear;
          const matchesYear = planYear === yr;
          const matchesMonth =
            (p.month || '').toLowerCase().slice(0, 3) === mShort.toLowerCase().slice(0, 3);
          return matchesYear && matchesMonth;
        });

        // ONLY include month if it has data
        if (monthItems.length > 0) {
          const monthTotal = monthItems.reduce((acc, it) => acc + (it.plannedAmount || 0), 0);
          const isCompleted =
            monthItems.every(
              it => it.isFulfilled || it.status === 'Fulfilled' || (it.paidAmount ?? 0) >= it.plannedAmount
            );

          generated.push({
            monthIndex,
            year: yr,
            mShort,
            targetMonth,
            targetDate,
            monthTotal,
            status: isCompleted ? 'Completed' : 'In-Completed',
            itemCount: monthItems.length,
            items: monthItems,
            isCurrent,
            isNextYear,
            isPast
          });
        }
      });
    }

    return generated;
  }, [localPlans, calendarYear, calendarMonthIdx]);

  // ── Auto-Scroll Landing on Current Month ─────────────────────────────────────
  const scrollToCurrentMonth = (smooth = true) => {
    if (currentMonthCardRef.current && containerRef.current) {
      const container = containerRef.current;
      const card = currentMonthCardRef.current;
      const targetLeft = Math.max(0, card.offsetLeft - container.offsetLeft - 8);
      container.scrollTo({
        left: targetLeft,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrentMonth(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [columns.length]);

  // Overall KPI Stats across the entire schedule
  const kpiStats = useMemo(() => {
    const totalPlanned = localPlans.reduce((acc, p) => acc + (p.plannedAmount || 0), 0);
    const totalFulfilled = localPlans.reduce((acc, p) => {
      const isDone = p.isFulfilled || p.status === 'Fulfilled' || (p.paidAmount ?? 0) >= p.plannedAmount;
      return acc + (isDone ? p.plannedAmount : (p.paidAmount || 0));
    }, 0);
    const totalPending = Math.max(0, totalPlanned - totalFulfilled);
    const completedMonthsCount = columns.filter(c => c.status === 'Completed').length;
    const progressPercent =
      totalPlanned > 0 ? Math.min(100, Math.round((totalFulfilled / totalPlanned) * 100)) : 0;

    const fulfilledItemsCount = localPlans.filter(
      p => p.isFulfilled || p.status === 'Fulfilled' || (p.paidAmount ?? 0) >= (p.plannedAmount || 0)
    ).length;
    const pendingItemsCount = localPlans.length - fulfilledItemsCount;

    // Current month details
    const currentMonthPlans = localPlans.filter(p => {
      const pYear = p.year || calendarYear;
      return (
        pYear === calendarYear &&
        (p.month || '').toLowerCase().slice(0, 3) === calendarMonthShort.toLowerCase().slice(0, 3)
      );
    });
    const currentMonthTotal = currentMonthPlans.reduce((acc, p) => acc + (p.plannedAmount || 0), 0);
    const currentMonthFulfilled = currentMonthPlans.filter(
      p => p.isFulfilled || p.status === 'Fulfilled' || (p.paidAmount ?? 0) >= (p.plannedAmount || 0)
    ).length;
    const currentMonthPendingCount = currentMonthPlans.length - currentMonthFulfilled;

    // Category breakdown & Top Category
    const catMap: Record<string, number> = {};
    localPlans.forEach(p => {
      const cat = p.category?.trim() || 'General';
      catMap[cat] = (catMap[cat] || 0) + (p.plannedAmount || 0);
    });
    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const topCategory =
      sortedCats.length > 0 && totalPlanned > 0
        ? {
          name: sortedCats[0][0],
          amount: sortedCats[0][1],
          percentage: Math.round((sortedCats[0][1] / totalPlanned) * 100)
        }
        : undefined;

    // Next upcoming unfulfilled item
    const unfulfilledItems = localPlans
      .filter(
        p => !(p.isFulfilled || p.status === 'Fulfilled' || (p.paidAmount ?? 0) >= (p.plannedAmount || 0))
      )
      .sort((a, b) => {
        const yDiff = (a.year || calendarYear) - (b.year || calendarYear);
        if (yDiff !== 0) return yDiff;
        const mIdxA = MONTH_NAMES.findIndex(
          m => m.toLowerCase() === (a.month || '').toLowerCase().slice(0, 3)
        );
        const mIdxB = MONTH_NAMES.findIndex(
          m => m.toLowerCase() === (b.month || '').toLowerCase().slice(0, 3)
        );
        return mIdxA - mIdxB;
      });
    const nextUpcoming =
      unfulfilledItems.length > 0
        ? {
          title: unfulfilledItems[0].title,
          month: unfulfilledItems[0].month,
          year: unfulfilledItems[0].year || calendarYear,
          amount: unfulfilledItems[0].plannedAmount
        }
        : undefined;

    const nextYearPlans = localPlans.filter(p => (p.year || calendarYear) > calendarYear);
    const nextYearTotal = nextYearPlans.reduce((acc, p) => acc + (p.plannedAmount || 0), 0);

    return {
      totalPlanned,
      totalFulfilled,
      totalPending,
      completedMonthsCount,
      totalMonths: columns.length,
      totalItems: localPlans.length,
      fulfilledItemsCount,
      pendingItemsCount,
      progressPercent,
      currentMonthName: calendarMonthShort,
      currentMonthYear: calendarYear,
      currentMonthTotal,
      currentMonthItemCount: currentMonthPlans.length,
      currentMonthPendingCount,
      topCategory,
      nextUpcoming,
      nextYearTotal,
      nextYearCount: nextYearPlans.length
    };
  }, [localPlans, columns, calendarYear, calendarMonthShort]);

  // Filtered Columns for the Single Glance Matrix Track
  const filteredColumns = useMemo(() => {
    return columns.filter(col => {
      let matchesStatus = true;
      if (statusFilter === 'Completed') matchesStatus = col.status === 'Completed';
      else if (statusFilter === 'In-Completed') matchesStatus = col.status === 'In-Completed';

      const matchesSearch =
        !searchQuery.trim() ||
        col.targetMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.items.some(
          it =>
            it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (it.notes && it.notes.toLowerCase().includes(searchQuery.toLowerCase()))
        );

      const matchesCategory =
        selectedCategory === 'ALL' ||
        col.items.some(it => it.category === selectedCategory);

      return matchesStatus && matchesSearch && matchesCategory;
    });
  }, [columns, statusFilter, searchQuery, selectedCategory]);

  return (
    <div className="glance-schedule-wrapper">
      {/* ── 1. Hero KPI Banner ──────────────────────────────────────────────── */}


      {/* ── 2. Glance Toolbar ───────────────────────────────────────────────── */}
      <GlanceToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        uniqueCategories={uniqueCategories}
        calendarMonthShort={calendarMonthShort}
        calendarYear={calendarYear}
        totalMonths={kpiStats.totalMonths}
        completedMonthsCount={kpiStats.completedMonthsCount}
        isLoading={isLoading}
        onScrollToCurrentMonth={() => scrollToCurrentMonth(true)}
        onAddPlan={() => setIsAddModalOpen(true)}
        onRefresh={onRefresh}
      />

      {/* ── 3. Single Glance Matrix Board ───────────────────────────────────── */}
      {viewMode === 'matrix' && (
        <div className="glance-matrix-container" ref={containerRef}>
          <div className={`glance-columns-track ${filteredColumns.length === 0 ? 'glance-columns-track-full' : ''}`}>
            {filteredColumns.length === 0 ? (
              <div className="glance-empty-filter-state">
                <AlertCircle size={32} className="glance-empty-filter-icon" />
                <h4 className="glance-empty-filter-title">No Planned Expenses Found</h4>
                <p className="glance-empty-filter-desc">
                  There are no months with planned expense data matching your current filter.
                </p>
              </div>
            ) : (
              filteredColumns.map(col => (
                <GlanceMonthCard
                  key={`${col.mShort}-${col.year}`}
                  col={col}
                  isCurrent={col.isCurrent}
                  cardRef={col.isCurrent ? currentMonthCardRef : null}
                  onToggleItem={handleToggleItem}
                  onToggleColumn={handleToggleColumn}
                  onDeleteItem={handleDeleteItem}
                  onSelectMonth={onSelectMonth}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 4. Add Plan Modal ───────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <GlanceAddModal
          calendarYear={calendarYear}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newAmount={newAmount}
          setNewAmount={setNewAmount}
          newMonth={newMonth}
          setNewMonth={setNewMonth}
          newYear={newYear}
          setNewYear={setNewYear}
          newNotes={newNotes}
          setNewNotes={setNewNotes}
          onSubmit={handleAddSubmit}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* ── 5. Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteConfirmPlan && (
        <GlanceDeleteModal
          plan={deleteConfirmPlan}
          calendarYear={calendarYear}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmPlan(null)}
        />
      )}
    </div>
  );
}
