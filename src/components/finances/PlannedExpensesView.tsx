import React, { useState, useMemo } from 'react';
import { 
  Target, Plus, Search, Filter, Calendar, Trash2, CheckCircle2, 
  Clock, AlertTriangle, TrendingDown, DollarSign, CheckSquare,
  Pencil, ArrowUpRight, Check, XCircle
} from 'lucide-react';
import { Category, PlannedExpense, PlannedExpenseStatus, Transaction } from '../../types';
import { MONTH_NAMES } from '../../services/expenseApi';
import { plannedExpenseApi } from '../../services/plannedExpenseApi';
import PlannedExpenseModal from './PlannedExpenseModal';
import FulfillPaymentModal from './FulfillPaymentModal';
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
  const [selectedMonth, setSelectedMonth] = useState<string>('Jul');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlannedExpenseStatus>('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlannedExpense | null>(null);
  const [activeFulfillPlan, setActiveFulfillPlan] = useState<PlannedExpense | null>(null);
  const [deletePlan, setDeletePlan] = useState<PlannedExpense | null>(null);

  // Reload plans
  const refreshPlans = () => {
    setPlans(plannedExpenseApi.getPlannedExpenses());
  };

  // Compute actual spending by category for the selected month and year from live MongoDB transactions
  const actualCategoryExpenses = useMemo(() => {
    const expenses: Record<string, number> = {};
    for (const tx of transactions) {
      if (String(tx.type).toUpperCase() !== 'CREDIT') {
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
      
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Fulfilled') {
          matchesStatus = p.isFulfilled || p.status === 'Fulfilled' || ((p.paidAmount ?? 0) >= p.plannedAmount);
        } else if (statusFilter === 'Partial') {
          matchesStatus = (p.paidAmount ?? 0) > 0 && (p.paidAmount ?? 0) < p.plannedAmount && !p.isFulfilled;
        } else {
          matchesStatus = p.status === statusFilter;
        }
      }

      return matchesMonth && matchesYear && matchesSearch && matchesStatus;
    });
  }, [plans, selectedMonth, selectedYear, searchQuery, statusFilter]);

  const handleCreateOrUpdatePlan = (planData: Omit<PlannedExpense, 'id' | 'createdAt'>) => {
    if (editingPlan) {
      plannedExpenseApi.updatePlannedExpense(editingPlan.id, planData);
      setEditingPlan(null);
    } else {
      plannedExpenseApi.createPlannedExpense(planData);
    }
    refreshPlans();
  };

  const handleSaveFulfillment = (id: string, isFulfilled: boolean, paidAmount: number) => {
    plannedExpenseApi.setFulfillmentAndPayment(id, isFulfilled, paidAmount);
    refreshPlans();
  };

  const handleConfirmDeletePlan = () => {
    if (deletePlan) {
      plannedExpenseApi.deletePlannedExpense(deletePlan.id);
      refreshPlans();
      setDeletePlan(null);
    }
  };

  const formatSAR = (val: number) => {
    return `SAR ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="planned-expenses-container">
      
      {/* Header & Controls */}
      <div className="planned-header-row">
        <div>
          <h2 className="planned-header-title">
            Planned Expenses & <span className="emerald-gradient-text">Fulfillment Tracker</span>
          </h2>
          <p className="planned-header-subtitle">
            Plan monthly expenses, track fulfilled vs unfulfilled items, and manage exactly how much you paid (all figures in SAR).
          </p>
        </div>

        <div className="planned-header-actions">
          {/* Month & Year Filter Pills */}
          <div className="month-year-select-bar">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="select-custom-pill"
              title="Select Month"
            >
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="select-custom-pill"
              title="Select Year"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button 
            onClick={() => {
              setEditingPlan(null);
              setIsAddModalOpen(true);
            }} 
            className="btn btn-primary"
          >
            <Plus size={16} /> + Plan An Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="planned-kpi-grid">
        <div className="planned-kpi-card total-planned">
          <div className="planned-kpi-label">TOTAL PLANNED BUDGET</div>
          <div className="planned-kpi-val">{formatSAR(budgetSummary.totalPlanned)}</div>
          <div className="planned-kpi-meta">{selectedMonth} {selectedYear} ({filteredPlans.length} items)</div>
        </div>

        <div className="planned-kpi-card actual-spent">
          <div className="planned-kpi-label">TOTAL AMOUNT PAID</div>
          <div className="planned-kpi-val text-emerald">{formatSAR(budgetSummary.totalPaid)}</div>
          <div className="planned-kpi-meta">Paid towards planned goals</div>
        </div>

        <div className={`planned-kpi-card ${budgetSummary.totalRemaining === 0 ? 'remaining-budget' : 'over-budget'}`}>
          <div className="planned-kpi-label">
            {budgetSummary.totalRemaining === 0 ? 'REMAINING UNPAID' : 'PENDING PAYMENT'}
          </div>
          <div className={`planned-kpi-val ${budgetSummary.totalRemaining === 0 ? 'remaining-text' : 'over-text'}`}>
            {formatSAR(budgetSummary.totalRemaining)}
          </div>
          <div className="planned-kpi-meta">
            {budgetSummary.totalRemaining === 0 ? 'All planned expenses fulfilled!' : 'Balance left to pay'}
          </div>
        </div>

        <div className="planned-kpi-card burn-rate">
          <div className="planned-kpi-label">FULFILLMENT STATUS</div>
          <div className="planned-kpi-val">{budgetSummary.fulfillmentRate}%</div>
          <div className="planned-kpi-meta">
            <span>{budgetSummary.fulfilledCount} of {budgetSummary.totalItems} items fulfilled</span>
            <div className="mini-progress-bar">
              <div 
                className="mini-progress-fill"
                style={{ width: `${Math.min(100, budgetSummary.fulfillmentRate)}%` }}
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
            <option value="Fulfilled">Fulfilled (Complete)</option>
            <option value="Partial">Partially Paid</option>
            <option value="Planned">Unfulfilled / Planned</option>
          </select>
        </div>
      </div>

      {/* Planned Expenses Table */}
      <div className="borrow-table-container glass-panel">
        <table className="borrow-data-table">
          <thead>
            <tr>
              <th>Expense Objective</th>
              <th>Category</th>
              <th>Period</th>
              <th className="th-amount">Planned Budget</th>
              <th className="th-amount">Amount Paid</th>
              <th className="th-amount">Remaining</th>
              <th>Fulfillment Status</th>
              <th className="th-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-table-cell">
                  <div className="empty-table-placeholder">
                    <Target size={28} />
                    <p>No planned expenses recorded for {selectedMonth} {selectedYear}.</p>
                    <button 
                      onClick={() => {
                        setEditingPlan(null);
                        setIsAddModalOpen(true);
                      }} 
                      className="btn btn-secondary btn-sm"
                    >
                      + Plan An Expense
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPlans.map(plan => {
                const isFulfilled = plan.isFulfilled || plan.status === 'Fulfilled' || ((plan.paidAmount ?? 0) >= plan.plannedAmount);
                const paidVal = isFulfilled 
                  ? plan.plannedAmount 
                  : (plan.paidAmount !== undefined ? plan.paidAmount : 0);
                const remainingVal = Math.max(0, plan.plannedAmount - paidVal);
                const isPartial = !isFulfilled && paidVal > 0;

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

                    {/* Month / Year */}
                    <td>
                      <span className="text-secondary font-medium">
                        {plan.month} {plan.year}
                      </span>
                    </td>

                    {/* Planned Amount */}
                    <td className="td-amount plan-amt">
                      {formatSAR(plan.plannedAmount)}
                    </td>

                    {/* Amount Paid */}
                    <td className="td-amount td-paid">
                      {formatSAR(paidVal)}
                    </td>

                    {/* Remaining Due */}
                    <td className={`td-amount td-remaining ${remainingVal === 0 ? 'zero-due' : ''}`}>
                      {remainingVal === 0 ? 'SAR 0.00' : formatSAR(remainingVal)}
                    </td>

                    {/* Status Badge (Click to open fulfillment modal) */}
                    <td>
                      <button 
                        onClick={() => setActiveFulfillPlan(plan)}
                        className={`badge badge-interactive ${isFulfilled ? 'badge-fulfilled' : (isPartial ? 'badge-partial' : 'badge-unfulfilled')}`}
                        title="Click to update fulfillment or paid amount"
                      >
                        {isFulfilled ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Fulfilled (100%)</span>
                          </>
                        ) : isPartial ? (
                          <>
                            <Clock size={13} />
                            <span>Partial ({Math.round((paidVal / plan.plannedAmount) * 100)}%)</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Not Fulfilled</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="td-action">
                      <div className="table-actions-cluster">
                        <button
                          onClick={() => setActiveFulfillPlan(plan)}
                          className="btn-icon-fulfill"
                          title="Update Fulfillment & How much paid"
                        >
                          <CheckSquare size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsAddModalOpen(true);
                          }}
                          className="btn-icon"
                          title="Edit Plan"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletePlan(plan)}
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

      {/* Add / Edit Plan Modal */}
      <PlannedExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={handleCreateOrUpdatePlan}
        categories={categories}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        initialPlan={editingPlan}
      />

      {/* Dedicated Fulfillment & Payment Modal */}
      <FulfillPaymentModal
        isOpen={Boolean(activeFulfillPlan)}
        onClose={() => setActiveFulfillPlan(null)}
        plan={activeFulfillPlan}
        onSave={handleSaveFulfillment}
      />

      {/* Delete Confirmation Modal (Yes / No) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletePlan)}
        title="Delete Planned Expense"
        message="Are you sure you want to delete this planned expense? Please choose Yes to delete or No to cancel."
        itemName={deletePlan ? `${deletePlan.title} (${deletePlan.category} - ${formatSAR(deletePlan.plannedAmount)})` : ''}
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        onConfirm={handleConfirmDeletePlan}
        onCancel={() => setDeletePlan(null)}
      />

    </div>
  );
}
