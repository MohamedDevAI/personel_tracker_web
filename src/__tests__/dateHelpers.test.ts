import { describe, it, expect } from 'vitest';
import {
  getLocalDateISO,
  parseDateMonthYear,
  parseTxDate,
} from '../utils/dateHelpers';

describe('dateHelpers resilient date utilities', () => {
  describe('getLocalDateISO', () => {
    it('returns a YYYY-MM-DD formatted string matching local year, month, date', () => {
      const now = new Date();
      const iso = getLocalDateISO(now);
      const parts = iso.split('-');
      expect(parts.length).toBe(3);
      expect(Number(parts[0])).toBe(now.getFullYear());
      expect(Number(parts[1])).toBe(now.getMonth() + 1);
      expect(Number(parts[2])).toBe(now.getDate());
    });

    it('defaults to current date when called without arguments', () => {
      const result = getLocalDateISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseDateMonthYear', () => {
    it('parses YYYY-MM-DD directly without UTC boundary skew', () => {
      const res = parseDateMonthYear('2026-10-08');
      expect(res.year).toBe('2026');
      expect(res.month).toBe('Oct');
    });

    it('parses slash date M/D/YYYY', () => {
      const res = parseDateMonthYear('10/8/2026');
      expect(res.year).toBe('2026');
      expect(res.month).toBe('Oct');
    });

    it('parses MM-DD-YYYY formats properly', () => {
      const res = parseDateMonthYear('10-08-2026');
      expect(res.year).toBe('2026');
      expect(res.month).toBe('Oct');
    });

    it('handles empty input with empty string fallback', () => {
      const res = parseDateMonthYear('');
      expect(res.year).toBe('');
      expect(res.month).toBe('');
    });
  });

  describe('parseTxDate', () => {
    it('extracts year and month from transaction with ISO date string', () => {
      const tx = {
        id: '1',
        amount: 100,
        type: 'Debit' as const,
        date: '2026-10-15',
      };
      const { year, month } = parseTxDate(tx);
      expect(year).toBe(2026);
      expect(month).toBe('Oct');
    });

    it('respects transaction month override if provided', () => {
      const tx = {
        id: '2',
        amount: 200,
        type: 'Credit' as const,
        date: '2026-11-01',
        month: 'Nov',
      };
      const { year, month } = parseTxDate(tx);
      expect(year).toBe(2026);
      expect(month).toBe('Nov');
    });
  });
});
