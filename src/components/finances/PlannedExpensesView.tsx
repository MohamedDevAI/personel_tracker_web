import React, { useState, useMemo } from 'react';
import { 
  Target, Plus, Search, Filter, Calendar, Trash2, CheckCircle2, 
  Clock, AlertTriangle, TrendingDown, DollarSign
} from 'lucide-react';
import { Category, PlannedExpense, PlannedExpenseStatus, Transaction } from '../../types';
import { MONTH_NAMES } from '../../services/expenseApi';
import { plannedExpenseApi } from '../../services/plannedExpenseApi';
import PlannedExpenseModal from './PlannedExpenseModal';
import ConfirmDeleteModal from '../common/ConfirmDeleteModal';

interface PlannedExpensesViewProps {
  categories?: Category[];
  transactions?: Transaction[];
}

export default function PlannedExpensesView({
  categories = [],
  transactions = []
}: PlannedExpensesViewProps) {
  const [plans, setPlans] = useState<PlannedExpense[]>(() => plannedExpenseApi.getPlannedExpenses());
  const [selectedMonth, setSelectedMonth] = useState<string>('Mar');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlannedExpenseStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reload plans
  const refreshPlans = () => {
    setPlans(plannedExpenseApi.getPlannedExpenses());
  };

  // Compute actual spending by category for the selected month and year from live MongoDB transactions
  const actualCategoryExpenses = useMemo(() => {
    const expenses: Record<string, number> = {};
    for (const tx of transactions) {
      if (String(tx.type).toUpperCase() !== 'CREDIT') {
        // match month and year
        const matchesMonth = tx.month === selectedMonth;
        let matchesYear = true;
        if (tx.date) {
          const d = new Date(tx.date);
          if (!isNaN(d.getFullYear())) {
            matchesYear = d.getFullYear() === selectedYear;
          }
        }
        if (matchesMonth && matchesYear) {
          const cat = tx.category || tx.categoryName || 'Other';
          const amt = Math.abs(Number(tx.amount || tx.amountSar || 0));
          expenses[cat] = (expenses[cat] || 0) + amt;
        }
      }
    }
    return expenses;
  }, [transactions, selectedMonth, selectedYear]);

  // Budget summary with variance
  const budgetSummary = useMemo(() => {
    return plannedExpenseApi.getMonthlyBudgetSummary(selectedMonth, selectedYear, actualCategoryExpenses);
  }, [plans, selectedMonth, selectedYear, actualCategoryExpenses]);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesMonth = p.month === selectedMonth;
      const matchesYear = p.year === selectedYear;
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesMonth && matchesYear && matchesSearch && matchesStatus;
    });
  }, [plans, selectedMonth, selectedYear, searchQuery, statusFilter]);

  const handleAddPlan = (newPlan: Omit<PlannedExpense, 'id' | 'createdAt'>) => {
    plannedExpenseApi.createPlannedExpense(newPlan);
    refreshPlans();
  };

  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deletePlanTitle, setDeletePlanTitle] = useState<string>('');

  const triggerDeletePlan = (plan: PlannedExpense) => {
    setDeletePlanId(plan.id);
    setDeletePlanTitle(`${plan.title} (${plan.category} - SAR ${plan.plannedAmount})`);
  };

  const handleConfirmDeletePlan = () => {
    if (deletePlanId) {
      plannedExpenseApi.deletePlannedExpense(deletePlanId);
      refreshPlans();
      setDeletePlanId(null);
      setDeletePlanTitle('');
    }
  };

  const handleToggleStatus = (plan: PlannedExpense) => {
    const nextStatus: PlannedExpenseStatus = plan.status === 'Fulfilled' ? 'Planned' : 'Fulfilled';
    plannedExpenseApi.updatePlannedExpense(plan.id, { status: nextStatus });
    refreshPlans();
  };

  const formatSAR = (val: number) => {
    return `SAR ${Math.round(val).toLocaleString('en-US')}`;
  };

  return (
    <div className="planned-expenses-container">
      
      {/* Header & Controls */}
      <div className="planned-header-row">
        <div>
          <h2 className="planned-header-title">
            Planned Expenses & <span className="emerald-gradient-text">Budget Allocation</span>
          </h2>
          <p className="planned-header-subtitle">
            Set expected spending limits per category, track Planned vs Actual variance in Saudi Riyals (SAR), and control monthly cash outflow.
          </p>
        </div>

        <div className="planned-header-actions">
          {/* Month & Year Filter Pills */}
          <div className="month-year-select-bar">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="select-custom-pill"
            >
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="select-custom-pill"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> + Add Planned Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="planned-kpi-grid">
        <div className="planned-kpi-card total-planned">
          <div className="planned-kpi-label">TOTAL PLANNED BUDGET</div>
          <div className="planned-kpi-val">{formatSAR(budgetSummary.totalPlanned)}</div>
          <div className="planned-kpi-meta">{selectedMonth} {selectedYear} allocation</div>
        </div>

        <div className="planned-kpi-card actual-spent">
          <div className="planned-kpi-label">ACTUAL SPENT SO FAR</div>
          <div className="planned-kpi-val">{formatSAR(budgetSummary.totalActualSpent)}</div>
          <div className="planned-kpi-meta">Across planned categories</div>
        </div>

        <div className={`planned-kpi-card ${budgetSummary.remainingBudget >= 0 ? 'remaining-budget' : 'over-budget'}`}>
          <div className="planned-kpi-label">
            {budgetSummary.remainingBudget >= 0 ? 'REMAINING BUDGET' : 'OVER BUDGET'}
          </div>
          <div className={`planned-kpi-val ${budgetSummary.remainingBudget >= 0 ? 'remaining-text' : 'over-text'}`}>
            {formatSAR(Math.abs(budgetSummary.remainingBudget))}
          </div>
          <div className="planned-kpi-meta">
            {budgetSummary.remainingBudget >= 0 ? 'Available surplus' : 'Exceeded allocated budget'}
          </div>
        </div>

        <div className="planned-kpi-card burn-rate">
          <div className="planned-kpi-label">BUDGET UTILIZATION</div>
          <div className="planned-kpi-val">{budgetSummary.adherenceRate}%</div>
          <div className="planned-kpi-meta">
            <div className="mini-progress-bar">
              <div 
                className={`mini-progress-fill ${budgetSummary.adherenceRate > 90 ? 'alert' : ''}`}
                style={{ width: `${Math.min(100, budgetSummary.adherenceRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Variance Progress Bars */}
      {budgetSummary.categoryVariance.length > 0 && (
        <div className="category-variance-card glass-panel">
          <h3 className="variance-title">Category Budget Health ({selectedMonth} {selectedYear})</h3>
          <div className="variance-grid">
            {budgetSummary.categoryVariance.map(item => {
              const isOver = item.actual > item.planned;
              return (
                <div key={item.category} className="variance-item">
                  <div className="variance-item-header">
                    <span className="variance-cat-name">{item.category}</span>
                    <span className="variance-numbers">
                      {formatSAR(item.actual)} / {formatSAR(item.planned)}
                      <span className={`variance-badge ${isOver ? 'badge-alert' : 'badge-good'}`}>
                        {isOver ? `+${formatSAR(item.actual - item.planned)} Over` : `${formatSAR(item.variance)} Left`}
                      </span>
                    </span>
                  </div>
                  <div className="variance-meter-track">
                    <div 
                      className={`variance-meter-fill ${isOver ? 'fill-danger' : 'fill-success'}`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="borrow-table-toolbar">
        <div className="borrow-search-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search planned items or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="borrow-search-input"
          />
        </div>

        <div className="filter-select-wrapper">
          <Filter size={14} className="filter-icon" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="borrow-select-filter"
          >
            <option value="ALL">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="borrow-table-container glass-panel">
        <table className="borrow-data-table">
          <thead>
            <tr>
              <th>Expense Objective</th>
              <th>Category</th>
              <th>Target Month</th>
              <th>Due Date</th>
              <th className="th-amount">Planned Budget</th>
              <th>Status</th>
              <th className="th-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-table-cell">
                  <div className="empty-table-placeholder">
                    <Target size={28} />
                    <p>No planned expenses recorded for {selectedMonth} {selectedYear}.</p>
                    <button onClick={() => setIsModalOpen(true)} className="btn btn-secondary btn-sm">
                      + Plan An Expense
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPlans.map(plan => {
                const isFulfilled = plan.status === 'Fulfilled';
                return (
                  <tr key={plan.id} className="borrow-row">
                    {/* Title */}
                    <td>
                      <div className="plan-title-cell">
                        <span className="plan-title-main">{plan.title}</span>
                        {plan.notes && <span className="plan-notes-sub">{plan.notes}</span>}
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="badge badge-category-soft">
                        {plan.category}
                      </span>
                    </td>

                    {/* Month */}
                    <td>{plan.month} {plan.year}</td>

                    {/* Due Date */}
                    <td>
                      <div className="date-cell-flex">
                        <Calendar size={13} className="date-icon" />
                        <span>{plan.dueDate || 'End of Month'}</span>
                      </div>
                    </td>

                    {/* Planned Amount */}
                    <td className="td-amount plan-amt">
                      {formatSAR(plan.plannedAmount)}
                    </td>

                    {/* Status */}
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(plan)}
                        className={`badge badge-interactive ${isFulfilled ? 'badge-emerald' : 'badge-amber'}`}
                        title="Click to toggle status"
                      >
                        {isFulfilled ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {plan.status}
                      </button>
                    </td>

                    {/* Action */}
                    <td className="td-action">
                      <button
                        onClick={() => triggerDeletePlan(plan)}
                        className="btn-icon-delete"
                        title="Delete Plan"
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

      {/* Modal */}
      <PlannedExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPlan}
        categories={categories}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletePlanId)}
        title="Delete Planned Expense"
        message="Are you sure you want to delete this planned expense? Please choose Yes to delete or No to cancel."
        itemName={deletePlanTitle}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        onConfirm={handleConfirmDeletePlan}
        onCancel={() => {
          setDeletePlanId(null);
          setDeletePlanTitle('');
        }}
      />

    </div>
  );
}
