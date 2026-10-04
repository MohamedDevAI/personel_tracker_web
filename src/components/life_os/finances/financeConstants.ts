import { Transaction } from '../../../types';
import { MONTH_NAMES, getCurrentYear, getCurrentMonth } from '../../../utils/dateHelpers';

export const CATEGORY_PALETTE = [
  '#f97316', // Orange 500
  '#9a3412', // Orange 800
  '#fdba74', // Orange 300
  '#57534e', // Stone 600
  '#f59e0b', // Amber 500
  '#c2410c', // Orange 700
  '#fed7aa', // Orange 200
  '#78350f', // Amber 900
  '#fb923c', // Orange 400
  '#a8a29e', // Stone 400
  '#ea580c', // Orange 600
  '#fcd34d', // Amber 300
  '#7c2d12', // Orange 900
  '#d97706', // Amber 600
  '#ffedd5', // Orange 100
  '#292524'  // Stone 800
];

export const PAYMENT_METHODS = ['Account', 'Card', 'Cash', 'Transfer', 'UPI'] as const;

export const getCategoryColor = (index: number): string => {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
};

export const parseTxDate = (tx: Transaction): { year: number; month: string } => {
  let year = getCurrentYear();
  let month = tx.month || getCurrentMonth();

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
    const found = MONTH_NAMES.find((m: string) => m.toLowerCase() === formatted.toLowerCase());
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
