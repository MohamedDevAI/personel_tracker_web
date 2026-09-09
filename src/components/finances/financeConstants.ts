import { Transaction } from '../../types';
import { MONTH_NAMES } from '../../services/expenseApi';

export const CATEGORY_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#f97316', // Orange
  '#a855f7', // Purple
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
  '#64748b'  // Slate
];

export const PAYMENT_METHODS = ['Account', 'Card', 'Cash', 'Transfer', 'UPI'] as const;

export const getCategoryColor = (index: number): string => {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
};

export const parseTxDate = (tx: Transaction): { year: number; month: string } => {
  let year = 2026;
  let month = tx.month || 'Mar';

  const rawDate = tx.date || tx.transactionDate || '';
  if (typeof rawDate === 'string') {
    const match = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      year = parseInt(match[1], 10);
      const mIdx = parseInt(match[2], 10) - 1;
      if (!tx.month && mIdx >= 0 && mIdx < 12) {
        month = MONTH_NAMES[mIdx];
      }
    } else {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        if (!tx.month) {
          month = MONTH_NAMES[d.getMonth()];
        }
      }
    }
  }

  if (month) {
    const formatted = month.slice(0, 3);
    const found = MONTH_NAMES.find(m => m.toLowerCase() === formatted.toLowerCase());
    if (found) month = found;
  }

  return { year, month };
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
