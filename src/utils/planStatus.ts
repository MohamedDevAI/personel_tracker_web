/**
 * Canonical plan fulfillment and payment calculation helper.
 * Single source of truth for planned expense statuses across the entire application.
 */

import type { PlannedExpense, PlannedExpenseStatus } from '../interface';

export type PlanCalculatedStatus = 'Fulfilled' | 'Partial' | 'Planned';

/**
 * Check whether a planned expense is fulfilled.
 * A plan is fulfilled if:
 * 1. It is explicitly marked fulfilled (isFulfilled === true or status === 'Fulfilled')
 * 2. OR its paidAmount is greater than or equal to plannedAmount (and plannedAmount > 0)
 */
export function isPlanFulfilled(p?: Partial<PlannedExpense> | null): boolean {
  if (!p) return false;
  if (p.isFulfilled || p.status === 'Fulfilled') return true;
  const planned = Number(p.plannedAmount || 0);
  const paid = Number(p.paidAmount ?? 0);
  return planned > 0 && paid >= planned;
}

/**
 * Check whether a planned expense is partially paid.
 * A plan is partial if:
 * - It is NOT fulfilled
 * - paidAmount is greater than 0 and strictly less than plannedAmount
 */
export function isPlanPartial(p?: Partial<PlannedExpense> | null): boolean {
  if (!p) return false;
  if (isPlanFulfilled(p)) return false;
  const planned = Number(p.plannedAmount || 0);
  const paid = Number(p.paidAmount ?? 0);
  return paid > 0 && paid < planned;
}

/**
 * Get the effective paid amount for a planned expense.
 * - If paidAmount is explicitly specified, uses that value (min 0).
 * - Else if the plan is fulfilled, defaults to plannedAmount.
 * - Else defaults to 0.
 */
export function getEffectivePaidAmount(p?: Partial<PlannedExpense> | null): number {
  if (!p) return 0;
  if (p.paidAmount !== undefined && p.paidAmount !== null) {
    return Math.max(0, Number(p.paidAmount));
  }
  return isPlanFulfilled(p) ? Math.max(0, Number(p.plannedAmount || 0)) : 0;
}

/**
 * Get the computed high-level status of a plan.
 */
export function getPlanStatus(p?: Partial<PlannedExpense> | null): PlannedExpenseStatus {
  if (!p) return 'Planned';
  if (isPlanFulfilled(p)) return 'Fulfilled';
  if (isPlanPartial(p)) return 'Partial';
  return (p.status as PlannedExpenseStatus) || 'Planned';
}
