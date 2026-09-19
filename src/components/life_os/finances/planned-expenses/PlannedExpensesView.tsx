import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, PlannedExpense, PlannedExpenseStatus, Transaction } from '../../../../types';
import { plannedExpenseApi } from '../../../../services/plannedExpenseApi';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear } from '../../../../utils/dateHelpers';
import MonthYearFilter from '../MonthYearFilter';
import PlannedExpenseModal from './PlannedExpenseModal';
import FulfillPaymentModal from '../FulfillPaymentModal';
import ConfirmDeleteModal from '../../../common/ConfirmDeleteModal';
import PlannedExpensesHeader from './PlannedExpensesHeader';
import PlannedExpensesKpiCards from './PlannedExpensesKpiCards';
import PlannedExpensesToolbar from './PlannedExpensesToolbar';
import PlannedExpensesTable from './PlannedExpensesTable';
import {
  syncPlanToTransactions,
  removeLinkedTransactionIfExists,
  formatSAR
} from './plannedExpenseSync';

interface PlannedExpensesViewProps {
  categories?: Category[];
  transactions?: Transaction[];
  initialMonth?: string;
  initialYear?: number;
}

export default function PlannedExpensesView({
  categories = [],
  transactions = [],
  initialMonth,
  initialYear
}: PlannedExpensesViewProps) {
  const queryClient = useQueryClient();

  // Selected Month & Year (defaults to initialMonth or current month)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => initialMonth || getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => initialYear || getCurrentYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlannedExpenseStatus>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlannedExpense | null>(null);
  const [activeFulfillPlan, setActiveFulfillPlan] = useState<PlannedExpense | null>(null);
  const [deletePlan, setDeletePlan] = useState<PlannedExpense | null>(null);

  // Live Query from MongoDB via Spring Boot API: /api/finance_planned
  // Fetching all months for the selected year populates the month picker counts and allows instant filtering
  const { data: plans = [], isLoading } = useQuery<PlannedExpense[]>({
    queryKey: ['plannedExpenses', selectedYear],
    queryFn: () => plannedExpenseApi.fetchFromDb('ALL', selectedYear)
  });

  // Available Years for the MonthYearFilter
  const currentCalendarYear = getCurrentYear();
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([
      currentCalendarYear - 2,
      currentCalendarYear - 1,
      currentCalendarYear,
      currentCalendarYear + 1,
      currentCalendarYear + 2,
      selectedYear
    ]);
    plans.forEach(p => {
      if (p.year) yearsSet.add(p.year);
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [plans, currentCalendarYear, selectedYear]);

  // Transaction / Item Counts per Month for the 12-Month Strip
  const monthlyPlanCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MONTH_NAMES.forEach(m => {
      counts[m] = 0;
    });
    plans.forEach(p => {
      if (p.year === selectedYear && p.month) {
        const m = MONTH_NAMES.find(
          name => name.toLowerCase() === p.month.toLowerCase().slice(0, 3)
        );
        if (m) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    });
    return counts;
  }, [plans, selectedYear]);

  const totalTransactionsForYear = useMemo(() => {
    return Object.values(monthlyPlanCounts).reduce((a, b) => a + b, 0);
  }, [monthlyPlanCounts]);

  // Month Navigation Handlers for MonthYearFilter
  const handlePrevMonth = () => {
    if (selectedMonth === 'All') {
      setSelectedMonth('Dec');
    } else {
      const idx = MONTH_NAMES.indexOf(selectedMonth as any);
      if (idx > 0) {
        setSelectedMonth(MONTH_NAMES[idx - 1]);
      } else {
        setSelectedMonth(MONTH_NAMES[11]);
        setSelectedYear(prev => prev - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'All') {
      setSelectedMonth('Jan');
    } else {
      const idx = MONTH_NAMES.indexOf(selectedMonth as any);
      if (idx < 11) {
        setSelectedMonth(MONTH_NAMES[idx + 1]);
      } else {
        setSelectedMonth(MONTH_NAMES[0]);
        setSelectedYear(prev => prev + 1);
      }
    }
  };

  // Mutations
  const savePlanMutation = useMutation({
    mutationFn: async (planData: Omit<PlannedExpense, 'id' | 'createdAt'>) => {
      let savedPlan: PlannedExpense | null = null;
      if (editingPlan) {
        savedPlan = await plannedExpenseApi.updatePlannedExpense(editingPlan.id, planData);
      } else {
        savedPlan = await plannedExpenseApi.createPlannedExpense(planData);
      }

      if (savedPlan) {
        try {
          await syncPlanToTransactions(savedPlan, transactions);
        } catch (syncErr) {
          console.error('Error syncing saved plan to transactions:', syncErr);
        }
      }
      return savedPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setEditingPlan(null);
      setIsAddModalOpen(false);
    }
  });

  const fulfillMutation = useMutation({
    mutationFn: async ({
      id,
      isFulfilled,
      paidAmount,
      plan
    }: {
      id: string;
      isFulfilled: boolean;
      paidAmount: number;
      plan?: PlannedExpense;
    }) => {
      const updatedPlan = await plannedExpenseApi.setFulfillmentAndPayment(id, isFulfilled, paidAmount, plan);
      const targetPlan = plan || plans.find(p => p.id === id) || updatedPlan;
      if (targetPlan) {
        try {
          await syncPlanToTransactions(
            { ...targetPlan, isFulfilled, paidAmount },
            transactions,
            { isFulfilled, paidAmount }
          );
        } catch (syncErr) {
          console.error('Error syncing fulfilled plan to transactions:', syncErr);
        }
      }
      return updatedPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setActiveFulfillPlan(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (plan: PlannedExpense) => {
      await plannedExpenseApi.deletePlannedExpense(plan.id);
      try {
        await removeLinkedTransactionIfExists(plan.id, plan.month, plan.year, transactions);
      } catch (syncErr) {
        console.error('Error removing linked transaction on plan deletion:', syncErr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannedExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setDeletePlan(null);
    }
  });

  // Compute actual spending by category for the selected month/year from live MongoDB transactions
  const actualCategoryExpenses = useMemo(() => {
    const expenses: Record<string, number> = {};
    for (const tx of transactions) {
      if (String(tx.type).toUpperCase() !== 'CREDIT') {
        const matchesMonth = selectedMonth === 'All' || tx.month === selectedMonth;
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

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category ? p.category.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
        (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Fulfilled') {
          matchesStatus = p.isFulfilled || p.status === 'Fulfilled' || (p.paidAmount ?? 0) >= p.plannedAmount;
        } else if (statusFilter === 'Partial') {
          matchesStatus = (p.paidAmount ?? 0) > 0 && (p.paidAmount ?? 0) < p.plannedAmount && !p.isFulfilled;
        } else {
          matchesStatus = p.status === statusFilter;
        }
      }

      const matchesMonth =
        selectedMonth === 'All' ||
        (p.month || '').toLowerCase().slice(0, 3) === selectedMonth.toLowerCase().slice(0, 3);

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [plans, searchQuery, statusFilter, selectedMonth]);

  // Budget summary with variance
  const budgetSummary = useMemo(() => {
    return plannedExpenseApi.getMonthlyBudgetSummary(filteredPlans, actualCategoryExpenses);
  }, [filteredPlans, actualCategoryExpenses]);

  const handleCreateOrUpdatePlan = (planData: Omit<PlannedExpense, 'id' | 'createdAt'>) => {
    savePlanMutation.mutate(planData);
  };

  const handleSaveFulfillment = (id: string, isFulfilled: boolean, paidAmount: number) => {
    const plan = plans.find(p => p.id === id) || activeFulfillPlan || undefined;
    fulfillMutation.mutate({ id, isFulfilled, paidAmount, plan });
  };

  const handleConfirmDeletePlan = () => {
    if (deletePlan) {
      deleteMutation.mutate(deletePlan);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (plan: PlannedExpense) => {
    setEditingPlan(plan);
    setIsAddModalOpen(true);
  };

  return (
    <div className="planned-expenses-container">
      {/* Header with Title & Action Button */}
      <PlannedExpensesHeader onAddPlan={handleOpenAddModal} />

      {/* Month & Year Filter Strip (exactly matching the user's reference) */}
      <MonthYearFilter
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        availableYears={availableYears}
        monthlyTransactionCounts={monthlyPlanCounts}
        totalTransactionsForYear={totalTransactionsForYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        countLabel="txs"
      />

      {/* KPI Cards */}
      <PlannedExpensesKpiCards
        budgetSummary={budgetSummary}
        selectedMonth={selectedMonth === 'All' ? 'All Year' : selectedMonth}
        selectedYear={selectedYear}
        overspentItemsCount={filteredPlans.filter(p => (p.paidAmount ?? 0) > p.plannedAmount).length}
      />

      {/* Search & Filter Bar */}
      <PlannedExpensesToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Planned Expenses Table */}
      <PlannedExpensesTable
        plans={filteredPlans}
        isLoading={isLoading}
        selectedMonth={selectedMonth === 'All' ? 'All Year' : selectedMonth}
        selectedYear={selectedYear}
        onPlanExpense={handleOpenAddModal}
        onFulfillPlan={setActiveFulfillPlan}
        onEditPlan={handleOpenEditModal}
        onDeletePlan={setDeletePlan}
      />

      {/* Add / Edit Plan Modal */}
      <PlannedExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={handleCreateOrUpdatePlan}
        categories={categories}
        initialMonth={selectedMonth !== 'All' ? selectedMonth : getCurrentMonth()}
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
        itemName={
          deletePlan
            ? `${deletePlan.title}${deletePlan.category ? ` (${deletePlan.category})` : ''} - ${formatSAR(
                deletePlan.plannedAmount
              )}`
            : ''
        }
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        onConfirm={handleConfirmDeletePlan}
        onCancel={() => setDeletePlan(null)}
      />
    </div>
  );
}
