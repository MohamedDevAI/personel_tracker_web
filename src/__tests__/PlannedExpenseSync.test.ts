import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findLinkedTransaction,
  syncPlanToTransactions,
  removeLinkedTransactionIfExists
} from '../components/life_os/finances/planned-expenses/plannedExpenseSync';
import { expenseApi } from '../services/expenseApi';
import { PlannedExpense, Transaction } from '../types';

vi.mock('../services/expenseApi', () => ({
  expenseApi: {
    getTransactions: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

describe('plannedExpenseSync', () => {
  const samplePlan: PlannedExpense = {
    id: 'pe-test-123',
    title: 'New Laptop',
    category: 'Equipment',
    plannedAmount: 1500,
    paidAmount: 1500,
    status: 'Fulfilled',
    month: 'Oct',
    year: 2026,
    createdAt: '2026-10-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findLinkedTransaction', () => {
    it('matches by plannedExpenseId', () => {
      const txs: Transaction[] = [
        {
          id: 'tx-1',
          date: '2026-10-05',
          description: 'Custom Note',
          amount: 1500,
          type: 'Debit',
          category: 'Equipment',
          plannedExpenseId: 'pe-test-123',
        },
      ];

      const match = findLinkedTransaction(samplePlan, txs);
      expect(match?.id).toBe('tx-1');
    });

    it('matches by [PE-id] in description or note', () => {
      const txs: Transaction[] = [
        {
          id: 'tx-2',
          date: '2026-10-05',
          description: 'New Laptop [PE-pe-test-123]',
          amount: 1500,
          type: 'Debit',
          category: 'Equipment',
        },
      ];

      const match = findLinkedTransaction(samplePlan, txs);
      expect(match?.id).toBe('tx-2');
    });

    it('matches fallback by title, month and Debit type', () => {
      const txs: Transaction[] = [
        {
          id: 'tx-3',
          date: '2026-10-15',
          description: 'New Laptop',
          amount: 1500,
          type: 'Debit',
          category: 'Equipment',
        },
      ];

      const match = findLinkedTransaction(samplePlan, txs);
      expect(match?.id).toBe('tx-3');
    });
  });

  describe('syncPlanToTransactions', () => {
    it('creates a new transaction when marked Fulfilled for Oct 2026', async () => {
      vi.mocked(expenseApi.getTransactions).mockResolvedValue([]);
      vi.mocked(expenseApi.createTransaction).mockResolvedValue({
        id: 'tx-created',
        date: '2026-10-01',
        description: 'New Laptop [PE-pe-test-123]',
        amount: 1500,
        type: 'Debit',
        category: 'Equipment',
      });

      await syncPlanToTransactions(samplePlan, []);

      expect(expenseApi.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1500,
          type: 'Debit',
          category: 'Equipment',
          description: 'New Laptop [PE-pe-test-123]',
          plannedExpenseId: 'pe-test-123',
        })
      );
    });

    it('removes linked transaction when status is Planned/Unfulfilled', async () => {
      const unfulfilledPlan: PlannedExpense = {
        ...samplePlan,
        status: 'Planned',
        paidAmount: 0,
      };

      const existingTxs: Transaction[] = [
        {
          id: 'tx-existing',
          date: '2026-10-01',
          description: 'New Laptop [PE-pe-test-123]',
          amount: 1500,
          type: 'Debit',
          category: 'Equipment',
          plannedExpenseId: 'pe-test-123',
        },
      ];

      vi.mocked(expenseApi.getTransactions).mockResolvedValue(existingTxs);
      vi.mocked(expenseApi.deleteTransaction).mockResolvedValue(undefined as any);

      await syncPlanToTransactions(unfulfilledPlan, existingTxs);

      expect(expenseApi.deleteTransaction).toHaveBeenCalledWith('tx-existing');
    });
  });

  describe('removeLinkedTransactionIfExists', () => {
    it('deletes linked transaction properly', async () => {
      const existingTxs: Transaction[] = [
        {
          id: 'tx-to-delete',
          date: '2026-10-01',
          description: 'New Laptop',
          amount: 1500,
          type: 'Debit',
          category: 'Equipment',
        },
      ];

      vi.mocked(expenseApi.getTransactions).mockResolvedValue(existingTxs);
      vi.mocked(expenseApi.deleteTransaction).mockResolvedValue(undefined as any);

      await removeLinkedTransactionIfExists(samplePlan, existingTxs);

      expect(expenseApi.deleteTransaction).toHaveBeenCalledWith('tx-to-delete');
    });
  });
});
