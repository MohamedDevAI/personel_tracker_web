import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  LayoutGrid,
  Table2,
  Plus,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Target,
  ArrowRight
} from 'lucide-react';
import { PlannedExpense } from '../../../../types';
import { formatSAR } from './plannedExpenseSync';
import { MONTH_NAMES, getCurrentYear, getCurrentMonth } from '../../../../utils/dateHelpers';

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
  // Generates timeline starting from Jan of current year (so user can scroll back),
  // through current month + next 5 months, and all months of next year (or beyond if data exists)
  const columns: GlanceColumn[] = useMemo(() => {
    const maxPlanYear = localPlans.reduce(
      (max, p) => (p.year && p.year > max ? p.year : max),
      calendarYear + 1
    );

    const generated: GlanceColumn[] = [];

    // Loop through years from current calendar year through at least next year (maxPlanYear)
    for (let yr = calendarYear; yr <= maxPlanYear; yr++) {
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

        const monthTotal = monthItems.reduce((acc, it) => acc + (it.plannedAmount || 0), 0);
        const isCompleted =
          monthItems.length > 0 &&
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
      });
    }

    return generated;
  }, [localPlans, calendarYear, calendarMonthIdx]);

  // ── Auto-Scroll Landing on Current Month ─────────────────────────────────────
  // Initial landing positions the current month at the left edge, so current + next 5 months are in view
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

    const nextYearPlans = localPlans.filter(p => (p.year || calendarYear) > calendarYear);
    const nextYearTotal = nextYearPlans.reduce((acc, p) => acc + (p.plannedAmount || 0), 0);

    return {
      totalPlanned,
      totalFulfilled,
      totalPending,
      completedMonthsCount,
      totalMonths: columns.length,
      totalItems: localPlans.length,
      progressPercent,
      nextYearTotal,
      nextYearCount: nextYearPlans.length
    };
  }, [localPlans, columns, calendarYear]);

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
    <div className="glance-schedule-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
      {/* ── 1. Hero KPI Banner (Planned Payback Design) ──────────────────────── */}
      <div className="glance-hero-banner glass-panel" style={{ width: '100%', marginBottom: 16 }}>
        <div className="glance-hero-top">
          <div className="glance-hero-info">
            <div className="glance-tag-row">
              <span className="glance-badge-pill emerald">
                <Sparkles size={12} />
                <span>Planned Expenses Horizon</span>
              </span>
            </div>
            <h2 className="glance-hero-title">Planned Budget Matrix</h2>

          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="btn btn-secondary btn-sm"
                title="Refresh schedule data"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderColor: '#10b981',
                fontWeight: 700
              }}
            >
              <Plus size={14} />
              <span>Add Planned Expense</span>
            </button>
          </div>
        </div>


      </div>

      {/* ── 2. Glance Toolbar (Planned Payback Design) ────────────────────────── */}
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
          </div>

          {/* Quick Jump to Current Month Button */}
          <button
            type="button"
            onClick={() => scrollToCurrentMonth(true)}
            className="glance-pill active"
            style={{
              background: 'rgba(16, 185, 129, 0.18)',
              color: '#34d399',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              fontWeight: 700
            }}
            title={`Center view on current month (${calendarMonthShort} ${calendarYear})`}
          >
            <Target size={13} /> Current Month ({calendarMonthShort})
          </button>

          {/* Status Filter Pills */}
          <div className="glance-status-pills">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`glance-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            >
              All ({kpiStats.totalMonths} Mos)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              className={`glance-pill completed ${statusFilter === 'Completed' ? 'active' : ''}`}
            >
              <CheckCircle2 size={13} /> Completed ({kpiStats.completedMonthsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('In-Completed')}
              className={`glance-pill incompleted ${statusFilter === 'In-Completed' ? 'active' : ''}`}
            >
              <Clock size={13} /> In-Completed ({kpiStats.totalMonths - kpiStats.completedMonthsCount})
            </button>
          </div>
        </div>

        <div className="glance-toolbar-right">
          {/* Search */}
          <div className="borrow-search-wrapper" style={{ minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search expense objective..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="borrow-search-input"
            />
          </div>

          {/* Category Dropdown */}
          {uniqueCategories.length > 0 && (
            <div className="filter-select-wrapper">
              <Filter size={13} className="filter-icon" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="borrow-select-filter"
              >
                <option value="ALL">All Categories ({uniqueCategories.length})</option>
                {uniqueCategories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Plan Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Plus size={15} /> + Add Expense
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              if (onRefresh) onRefresh();
            }}
            className="btn btn-secondary btn-sm"
            title="Refresh schedule"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* ── 3. Single Glance Matrix Board (Auto-scrolling to Current Month) ──── */}
      {viewMode === 'matrix' && (
        <div className="glance-matrix-container" ref={containerRef} style={{ scrollBehavior: 'smooth' }}>
          <div className="glance-columns-track">
            {filteredColumns.map(col => {
              const isColCompleted = col.status === 'Completed';
              const isCurrent = col.isCurrent;

              return (
                <div
                  key={`${col.mShort}-${col.year}`}
                  ref={isCurrent ? currentMonthCardRef : null}
                  className={`glance-month-card glass-panel ${isColCompleted ? 'completed-card' : 'incompleted-card'
                    }`}
                  style={
                    isCurrent
                      ? {
                        borderColor: 'rgba(52, 211, 153, 0.7)',
                        background:
                          'linear-gradient(180deg, rgba(16, 185, 129, 0.14) 0%, rgba(15, 23, 42, 0.9) 100%)',
                        boxShadow: '0 0 25px rgba(16, 185, 129, 0.22)'
                      }
                      : col.isNextYear
                        ? {
                          borderColor: 'rgba(99, 102, 241, 0.35)'
                        }
                        : undefined
                  }
                >
                  {/* Card Header */}
                  <div className="glance-card-header">
                    <div className="glance-month-meta">
                      <span className="glance-month-index">
                        Month {col.monthIndex < 10 ? `0${col.monthIndex}` : col.monthIndex} • {col.year}
                      </span>
                      {isCurrent ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(16, 185, 129, 0.28)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            letterSpacing: '0.04em'
                          }}
                        >
                          ★ CURRENT
                        </span>
                      ) : col.isNextYear ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '1px 6px'
                          }}
                        >
                          NEXT YEAR
                        </span>
                      ) : (
                        <span className="glance-target-date">{col.targetDate}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      <h4
                        className="glance-month-title"
                        style={{ cursor: onSelectMonth ? 'pointer' : 'default', margin: 0 }}
                        onClick={() => onSelectMonth && onSelectMonth(col.mShort, col.year)}
                        title={onSelectMonth ? `Click to open detailed view for ${col.targetMonth}` : undefined}
                      >
                        {col.targetMonth}
                      </h4>
                      {onSelectMonth && (
                        <button
                          type="button"
                          onClick={() => onSelectMonth(col.mShort, col.year)}
                          className="btn btn-secondary btn-xs"
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                          title={`Open detailed ${col.targetMonth} table`}
                        >
                          Details →
                        </button>
                      )}
                    </div>

                    <div className="glance-month-total-box">
                      <span className="glance-total-label">MONTH TOTAL</span>
                      <span className="glance-total-amount">{formatSAR(col.monthTotal)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleColumn(col.mShort, col.year, isColCompleted)}
                      className={`glance-col-status-pill ${isColCompleted ? 'completed' : 'incompleted'
                        }`}
                      title="Click to toggle all expense objectives in this month"
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

                  {/* Card Body: Items List */}
                  <div className="glance-card-body">
                    <div className="glance-items-heading">
                      <span>Expense Objectives ({col.itemCount})</span>
                      <span className="glance-hint-text">1-click to toggle</span>
                    </div>

                    <div className="glance-items-list">
                      {col.items.length === 0 ? (
                        <div
                          style={{
                            padding: '24px 12px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem',
                            fontStyle: 'italic',
                            border: '1px dashed rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px'
                          }}
                        >
                          No expenses planned
                        </div>
                      ) : (
                        col.items.map(item => {
                          const isItemFulfilled =
                            item.isFulfilled ||
                            item.status === 'Fulfilled' ||
                            (item.paidAmount ?? 0) >= item.plannedAmount;

                          return (
                            <div
                              key={item.id || item.title}
                              className={`glance-item-row ${isItemFulfilled ? 'item-done' : 'item-pending'
                                }`}
                            >
                              {/* 1. Expense Objective & Planned Budget */}
                              <div className="glance-item-info" style={{ flex: 1, minWidth: 0 }}>
                                <div className="glance-item-creditor-row">
                                  <span
                                    className="glance-creditor-name"
                                    title={item.title}
                                    style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                  >
                                    {item.title}
                                  </span>
                                  <span className="glance-item-amount" style={{ flexShrink: 0, marginLeft: 8 }}>
                                    {formatSAR(item.plannedAmount)}
                                  </span>
                                </div>

                                {item.notes && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      color: 'var(--text-secondary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'block',
                                      maxWidth: '100%'
                                    }}
                                    title={item.notes}
                                  >
                                    {item.notes}
                                  </span>
                                )}
                              </div>

                              {/* 2. Actions: Tick Mark (✓) or Close Mark (✕) Notification & Toggle */}
                              <div className="glance-item-actions-group">
                                <button
                                  type="button"
                                  onClick={e => handleToggleItem(item, e)}
                                  className={`glance-item-toggle-btn ${isItemFulfilled ? 'done' : 'pending'
                                    }`}
                                  title={
                                    isItemFulfilled
                                      ? 'Fulfilled (Click to mark Pending)'
                                      : 'Not Fulfilled (Click to mark Fulfilled)'
                                  }
                                >
                                  {isItemFulfilled ? (
                                    <>
                                      <CheckCircle2 size={13} className="emerald-icon" />
                                      <span>Done</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle
                                        size={13}
                                        className="amber-icon"
                                        style={{ color: '#ef4444' }}
                                      />
                                      <span>Pending</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={e => handleDeleteItem(item, e)}
                                  className="glance-item-del-btn"
                                  title={`Delete planned expense: ${item.title}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    className="glance-card-footer"
                    style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}
                  >
                    <span className="glance-footer-badge">
                      {col.items.length === 0
                        ? '— No Expenses Planned'
                        : isColCompleted
                          ? '✓ 100% Fulfilled on Schedule'
                          : '⏳ Action Required (Unfulfilled)'}
                    </span>
                    {onSelectMonth && (
                      <button
                        type="button"
                        onClick={() => onSelectMonth(col.mShort, col.year)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#34d399',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={`Expand full details for ${col.targetMonth}`}
                      >
                        <span>Expand {col.mShort} Details</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* ── 5. Add Plan Modal (Supports Current & Next Year) ─────────────────── */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(15, 23, 42, 0.95)'
            }}
          >
            <h4
              style={{
                margin: '0 0 16px 0',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Plus size={18} color="#34d399" /> Add Planned Expense
            </h4>

            <form
              onSubmit={handleAddSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: 4
                  }}
                >
                  Expense Objective *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apartment Rent, Groceries, WiFi..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="borrow-search-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: 4
                  }}
                >
                  Planned Budget (SAR) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="borrow-search-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginBottom: 4
                    }}
                  >
                    Target Month
                  </label>
                  <select
                    value={newMonth}
                    onChange={e => setNewMonth(e.target.value)}
                    className="borrow-select-filter"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    {MONTH_NAMES.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginBottom: 4
                    }}
                  >
                    Target Year
                  </label>
                  <select
                    value={newYear}
                    onChange={e => setNewYear(Number(e.target.value))}
                    className="borrow-select-filter"
                    style={{ width: '100%', padding: '8px 12px' }}
                  >
                    <option value={calendarYear}>{calendarYear}</option>
                    <option value={calendarYear + 1}>{calendarYear + 1} (Next Year)</option>
                    <option value={calendarYear + 2}>{calendarYear + 2}</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: 4
                  }}
                >
                  Notes / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via bank transfer..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="borrow-search-input"
                  style={{ width: '100%', padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  + Add Objective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteConfirmPlan && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(15, 23, 42, 0.95)'
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Trash2 size={18} /> Delete Planned Expense
            </h4>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                margin: '0 0 16px 0'
              }}
            >
              Are you sure you want to remove <strong>{deleteConfirmPlan.title}</strong> (
              {formatSAR(deleteConfirmPlan.plannedAmount)}) from {deleteConfirmPlan.month}{' '}
              {deleteConfirmPlan.year || calendarYear}?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmPlan(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn btn-danger btn-sm"
                style={{ background: '#dc2626', color: '#ffffff', fontWeight: 700 }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PlannedExpensesGlanceTable as PlannedExpensesGlanceBoard };
export { PlannedExpensesGlanceTable as PlannedExpensesGlanceView };
