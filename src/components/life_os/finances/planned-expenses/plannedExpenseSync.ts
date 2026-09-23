/**
 * Sync logic between Planned Expenses and the Expense Tracked (MongoDB transactions).
 * Automatically creates/updates/removes linked transactions when planned expenses change.
 */

import type { Transaction } from '../../../../types';
import { isFromOctober2026Onwards, getMonthIndex, MONTH_NAMES } from '../../../../utils/dateHelpers';
import { formatSAR } from '../../../../utils/formatters';
import { expenseApi } from '../../../../services/expenseApi';

// Re-export for consumers that import from this module
export { formatSAR, isFromOctober2026Onwards };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncablePlan {
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

export interface SyncOverrides {
  isFulfilled?: boolean;
  paidAmount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find a transaction linked to a planned expense by ID, tag, or matching metadata */
export const findLinkedTransaction = (
  plan: SyncablePlan | string,
  transactions: Transaction[]
): Transaction | undefined => {
  const planId = typeof plan === 'string' ? plan : plan.id;
  const tag = `[PE-${planId}]`;

  // 1. Exact match by plannedExpenseId property
  const byProperty = transactions.find((t) => t.plannedExpenseId === planId);
  if (byProperty) return byProperty;

  // 2. Exact match by [PE-{id}] tag in description or note
  const byTag = transactions.find(
    (t) =>
      (t.description && t.description.includes(tag)) ||
      (t.note && t.note.includes(tag))
  );
  if (byTag) return byTag;

  // 3. Fallback: match by title, month & Debit type (for transactions created before tag was stored in description)
  if (typeof plan === 'object' && plan.title) {
    const normTitle = plan.title.trim().toLowerCase();
    const byTitleAndMonth = transactions.find((t) => {
      const desc = (t.description || '').toLowerCase();
      const note = (t.note || '').toLowerCase();
      const matchesTitle = desc === normTitle || note === normTitle || desc.startsWith(normTitle);
      const txMonth = t.month || (t.date ? MONTH_NAMES[new Date(t.date).getMonth()] : undefined);
      const matchesMonth = !plan.month || (txMonth &&
        txMonth.toLowerCase().slice(0, 3) === plan.month.toLowerCase().slice(0, 3));
      const isDebit = String(t.type).toUpperCase() === 'DEBIT';
      return matchesTitle && matchesMonth && isDebit;
    });
    if (byTitleAndMonth) return byTitleAndMonth;
  }

  return undefined;
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

  // Find linked transaction, querying latest if not in currentTransactions
  let linkedTx = findLinkedTransaction(plan, currentTransactions);
  if (!linkedTx) {
    try {
      const freshTxs = await expenseApi.getTransactions();
      linkedTx = findLinkedTransaction(plan, freshTxs);
    } catch {
      /* ignore */
    }
  }

  const mIdx = getMonthIndex(plan.month);
  const mNum = String((mIdx >= 0 ? mIdx : 9) + 1).padStart(2, '0');
  const dateStr = plan.dueDate || `${plan.year}-${mNum}-01`;

  if (effectiveFulfilled || effectivePaid > 0) {
    // Create or update the linked transaction
    const finalAmount = effectivePaid > 0 ? effectivePaid : plan.plannedAmount;
    // Always store [PE-{id}] in description so MongoDB document preserves the link
    const desc = plan.notes
      ? `${plan.title} [PE-${plan.id}] - ${plan.notes}`
      : `${plan.title} [PE-${plan.id}]`;
    const note = desc;
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
  planOrId: SyncablePlan | string,
  planMonthOrTxs?: string | Transaction[],
  planYear?: number,
  currentTransactions?: Transaction[]
): Promise<void> => {
  let planObj: SyncablePlan;
  let txList: Transaction[];

  if (typeof planOrId === 'object') {
    planObj = planOrId;
    txList = Array.isArray(planMonthOrTxs) ? planMonthOrTxs : [];
  } else {
    planObj = {
      id: planOrId,
      title: '',
      month: typeof planMonthOrTxs === 'string' ? planMonthOrTxs : '',
      year: planYear || 2026,
      plannedAmount: 0,
    };
    txList = currentTransactions || [];
  }

  if (!isFromOctober2026Onwards(planObj.month, planObj.year)) return;

  let linkedTx = findLinkedTransaction(planObj, txList);
  if (!linkedTx) {
    try {
      const freshTxs = await expenseApi.getTransactions();
      linkedTx = findLinkedTransaction(planObj, freshTxs);
    } catch {
      /* ignore */
    }
  }

  if (linkedTx && (linkedTx.id || linkedTx._id)) {
    try {
      await expenseApi.deleteTransaction(linkedTx.id || linkedTx._id!);
    } catch (e) {
      console.warn('Failed to delete linked transaction:', e);
    }
  }
};
