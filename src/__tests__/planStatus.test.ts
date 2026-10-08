import { describe, it, expect } from 'vitest';
import {
  isPlanFulfilled,
  isPlanPartial,
  getEffectivePaidAmount,
  getPlanStatus,
} from '../utils/planStatus';
import type { PlannedExpense } from '../interface';

describe('planStatus canonical utility', () => {
  const basePlan: PlannedExpense = {
    id: 'plan-1',
    title: 'Health Insurance',
    month: 'Oct',
    year: 2026,
    plannedAmount: 500,
    paidAmount: 0,
    status: 'Planned',
    isFulfilled: false,
    createdAt: '2026-10-01T00:00:00Z',
  };

  describe('isPlanFulfilled', () => {
    it('returns false for null/undefined', () => {
      expect(isPlanFulfilled(null)).toBe(false);
      expect(isPlanFulfilled(undefined)).toBe(false);
    });

    it('returns true when isFulfilled is true', () => {
      expect(isPlanFulfilled({ ...basePlan, isFulfilled: true })).toBe(true);
    });

    it('returns true when status is Fulfilled', () => {
      expect(isPlanFulfilled({ ...basePlan, status: 'Fulfilled' })).toBe(true);
    });

    it('returns true when paidAmount >= plannedAmount (and plannedAmount > 0)', () => {
      expect(isPlanFulfilled({ ...basePlan, plannedAmount: 500, paidAmount: 500 })).toBe(true);
      expect(isPlanFulfilled({ ...basePlan, plannedAmount: 500, paidAmount: 600 })).toBe(true);
    });

    it('returns false when paidAmount < plannedAmount', () => {
      expect(isPlanFulfilled({ ...basePlan, plannedAmount: 500, paidAmount: 250 })).toBe(false);
      expect(isPlanFulfilled({ ...basePlan, plannedAmount: 500, paidAmount: 0 })).toBe(false);
    });

    it('returns false when plannedAmount is 0 and not explicitly marked fulfilled', () => {
      expect(isPlanFulfilled({ ...basePlan, plannedAmount: 0, paidAmount: 0 })).toBe(false);
    });
  });

  describe('isPlanPartial', () => {
    it('returns false for fulfilled plans', () => {
      expect(isPlanPartial({ ...basePlan, isFulfilled: true })).toBe(false);
      expect(isPlanPartial({ ...basePlan, plannedAmount: 500, paidAmount: 500 })).toBe(false);
    });

    it('returns true when 0 < paidAmount < plannedAmount', () => {
      expect(isPlanPartial({ ...basePlan, plannedAmount: 500, paidAmount: 200 })).toBe(true);
      expect(isPlanPartial({ ...basePlan, plannedAmount: 500, paidAmount: 499.99 })).toBe(true);
    });

    it('returns false when paidAmount is 0', () => {
      expect(isPlanPartial({ ...basePlan, plannedAmount: 500, paidAmount: 0 })).toBe(false);
    });
  });

  describe('getEffectivePaidAmount', () => {
    it('returns 0 for null/undefined', () => {
      expect(getEffectivePaidAmount(null)).toBe(0);
      expect(getEffectivePaidAmount(undefined)).toBe(0);
    });

    it('returns exact paidAmount when present', () => {
      expect(getEffectivePaidAmount({ ...basePlan, paidAmount: 350 })).toBe(350);
      expect(getEffectivePaidAmount({ ...basePlan, paidAmount: 0 })).toBe(0);
    });

    it('defaults to plannedAmount if paidAmount is omitted but plan is fulfilled', () => {
      expect(getEffectivePaidAmount({ ...basePlan, paidAmount: undefined, isFulfilled: true })).toBe(500);
    });

    it('defaults to 0 if paidAmount is omitted and not fulfilled', () => {
      expect(getEffectivePaidAmount({ ...basePlan, paidAmount: undefined, isFulfilled: false })).toBe(0);
    });
  });

  describe('getPlanStatus', () => {
    it('computes Fulfilled correctly', () => {
      expect(getPlanStatus({ ...basePlan, isFulfilled: true })).toBe('Fulfilled');
      expect(getPlanStatus({ ...basePlan, plannedAmount: 500, paidAmount: 500 })).toBe('Fulfilled');
    });

    it('computes Partial correctly', () => {
      expect(getPlanStatus({ ...basePlan, plannedAmount: 500, paidAmount: 250 })).toBe('Partial');
    });

    it('returns Planned for unpaid plan', () => {
      expect(getPlanStatus({ ...basePlan, plannedAmount: 500, paidAmount: 0 })).toBe('Planned');
    });
  });
});
