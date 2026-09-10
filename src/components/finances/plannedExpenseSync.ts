/**
 * Sync logic between Planned Expenses and the Expense Tracked (MongoDB transactions).
 * Automatically creates/updates/removes linked transactions when planned expenses change.
 */

import type { Transaction } from '../../types';
import { MONTH_NAMES, isFromOctober2026Onwards, getMonthIndex } from '../../utils/dateHelpers';
import { formatSAR } from '../../utils/formatters';
import { expenseApi } from '../../services/expenseApi';

// Re-export for consumers that import from this module
export { formatSAR, isFromOctober2026Onwards };

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncablePlan {
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
}

interface SyncOverrides {
  isFulfilled?: boolean;
  paidAmount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find a transaction linked to a planned expense by ID or note tag */
const findLinkedTransaction = (
  planId: string,
  transactions: Transaction[]
): Transaction | undefined => {
  return transactions.find(
    (t) =>
      t.plannedExpenseId === planId ||
      (t.note && t.note.includes(`[PE-${planId}]`)) ||
      (t.description && t.description.includes(`[PE-${planId}]`))
  );
};

// ─── Sync Functions ───────────────────────────────────────────────────────────

/**
 * Sync a planned expense to the Expense Tracked transactions collection.
 * Only processes plans from October 2026 onwards to leave historical data untouched.
 */
export const syncPlanToTransactions = async (
  plan: SyncablePlan,
  currentTransactions: Transaction[],
  overrides?: SyncOverrides
): Promise<void> => {
  // Leave data until September untouched
  if (!isFromOctober2026Onwards(plan.month, plan.year)) return;

  const effectiveFulfilled = overrides?.isFulfilled !== undefined
    ? overrides.isFulfilled
    : Boolean(plan.isFulfilled);

  const effectivePaid = overrides?.paidAmount !== undefined
    ? overrides.paidAmount
    : (plan.paidAmount !== undefined ? plan.paidAmount : (effectiveFulfilled ? plan.plannedAmount : 0));

  const linkedTx = findLinkedTransaction(plan.id, currentTransactions);

  const mIdx = getMonthIndex(plan.month);
  const mNum = String((mIdx >= 0 ? mIdx : 9) + 1).padStart(2, '0');
  const dateStr = plan.dueDate || `${plan.year}-${mNum}-01`;

  if (effectiveFulfilled || effectivePaid > 0) {
    // Create or update the linked transaction
    const finalAmount = effectivePaid > 0 ? effectivePaid : plan.plannedAmount;
    const desc = plan.title;
    const note = plan.notes
      ? `${plan.notes} [PE-${plan.id}]`
      : `${plan.title} [PE-${plan.id}]`;
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
        month: plan.month,
        plannedExpenseId: plan.id,
      });
    } else {
      await expenseApi.createTransaction({
        date: dateStr,
        transactionDate: dateStr,
        month: plan.month,
        category: cat,
        categoryName: cat,
        description: desc,
        note: note,
        amount: finalAmount,
        amountSar: finalAmount,
        type: 'Debit',
        paymentMethod: 'Account',
        plannedExpenseId: plan.id,
      });
    }
  } else {
    // Not fulfilled and paidAmount is 0 — remove any existing linked transaction
    if (linkedTx && (linkedTx.id || linkedTx._id)) {
      await expenseApi.deleteTransaction(linkedTx.id || linkedTx._id!);
    }
  }
};

/**
 * Remove a linked transaction when a planned expense is deleted.
 * Only processes plans from October 2026 onwards.
 */
export const removeLinkedTransactionIfExists = async (
  planId: string,
  planMonth: string,
  planYear: number,
  currentTransactions: Transaction[]
): Promise<void> => {
  if (!isFromOctober2026Onwards(planMonth, planYear)) return;

  const linkedTx = findLinkedTransaction(planId, currentTransactions);
  if (linkedTx && (linkedTx.id || linkedTx._id)) {
    try {
      await expenseApi.deleteTransaction(linkedTx.id || linkedTx._id!);
    } catch (e) {
      console.warn('Failed to delete linked transaction:', e);
    }
  }
};
