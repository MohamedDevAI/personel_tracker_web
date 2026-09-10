import { Transaction } from '../../types';
import { MONTH_NAMES, expenseApi } from '../../services/expenseApi';

export const formatSAR = (val: number): string => {
  return `SAR ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to verify if the plan belongs to future months starting from October 2026 onwards
export const isFromOctober2026Onwards = (month: string, year: number): boolean => {
  const mIdx = MONTH_NAMES.indexOf(month as any);
  if (year > 2026) return true;
  if (year === 2026 && mIdx >= 9) return true; // Oct = 9, Nov = 10, Dec = 11
  return false;
};

// Automatically sync planned expenses to Expense Tracked transactions (MongoDB collection)
export const syncPlanToTransactions = async (
  plan: {
    id: string;
    title: string;
    category?: string;
    month: string;
    year: number;
    plannedAmount: number;
    paidAmount?: number;
    isFulfilled?: boolean;
    dueDate?: string;
    notes?: string;
  },
  currentTransactions: Transaction[],
  overrides?: { isFulfilled?: boolean; paidAmount?: number }
): Promise<void> => {
  const month = plan.month;
  const year = plan.year;

  // Leave data until September untouched; only sync from October 2026 onwards
  if (!isFromOctober2026Onwards(month, year)) {
    return;
  }

  const effectiveFulfilled = overrides?.isFulfilled !== undefined ? overrides.isFulfilled : Boolean(plan.isFulfilled);
  const effectivePaid = overrides?.paidAmount !== undefined 
    ? overrides.paidAmount 
    : (plan.paidAmount !== undefined ? plan.paidAmount : (effectiveFulfilled ? plan.plannedAmount : 0));

  // Find linked transaction if one exists
  const linkedTx = currentTransactions.find(t => 
    t.plannedExpenseId === plan.id ||
    (t.note && t.note.includes(`[PE-${plan.id}]`)) ||
    (t.description && t.description.includes(`[PE-${plan.id}]`))
  );

  const mIdx = MONTH_NAMES.indexOf(month as any);
  const mNum = String((mIdx >= 0 ? mIdx : 9) + 1).padStart(2, '0');
  const dateStr = plan.dueDate ? plan.dueDate : `${year}-${mNum}-01`;

  // If fulfilled or paid amount > 0: create or update transaction in Expense Tracked
  if (effectiveFulfilled || effectivePaid > 0) {
    const finalAmount = effectivePaid > 0 ? effectivePaid : plan.plannedAmount;
    const desc = plan.title;
    const note = plan.notes ? `${plan.notes} [PE-${plan.id}]` : `${plan.title} [PE-${plan.id}]`;
    const cat = plan.category || 'General';

    if (linkedTx && (linkedTx.id || linkedTx._id)) {
      const txId = linkedTx.id || linkedTx._id!;
      await expenseApi.updateTransaction(txId, {
        amount: finalAmount,
        amountSar: finalAmount,
        category: cat,
        categoryName: cat,
        description: desc,
        note: note,
        date: dateStr,
        transactionDate: dateStr,
        month: month,
        plannedExpenseId: plan.id
      });
    } else {
      await expenseApi.createTransaction({
        date: dateStr,
        transactionDate: dateStr,
        month: month,
        category: cat,
        categoryName: cat,
        description: desc,
        note: note,
        amount: finalAmount,
        amountSar: finalAmount,
        type: 'Debit',
        paymentMethod: 'Account',
        plannedExpenseId: plan.id
      });
    }
  } else {
    // If not fulfilled and paidAmount is 0, remove any existing linked transaction
    if (linkedTx && (linkedTx.id || linkedTx._id)) {
      await expenseApi.deleteTransaction(linkedTx.id || linkedTx._id!);
    }
  }
};

export const removeLinkedTransactionIfExists = async (
  planId: string,
  planMonth: string,
  planYear: number,
  currentTransactions: Transaction[]
): Promise<void> => {
  if (!isFromOctober2026Onwards(planMonth, planYear)) return;
  const linkedTx = currentTransactions.find(t => 
    t.plannedExpenseId === planId ||
    (t.note && t.note.includes(`[PE-${planId}]`)) ||
    (t.description && t.description.includes(`[PE-${planId}]`))
  );
  if (linkedTx && (linkedTx.id || linkedTx._id)) {
    try {
      await expenseApi.deleteTransaction(linkedTx.id || linkedTx._id!);
    } catch (e) {
      console.warn('Failed to delete linked transaction:', e);
    }
  }
};
