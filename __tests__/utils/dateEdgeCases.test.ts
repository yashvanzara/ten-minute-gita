/**
 * Date utility edge case tests.
 * Covers: getDateString with various dates, isToday/isYesterday boundaries,
 * timezone-safe local date formatting.
 */

import { getDateString, isToday, isYesterday } from '@/utils/storage';

describe('getDateString — edge cases', () => {
  it('formats leap year date', () => {
    expect(getDateString(new Date(2024, 1, 29))).toBe('2024-02-29');
  });

  it('formats end of year', () => {
    expect(getDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('formats start of year', () => {
    expect(getDateString(new Date(2025, 0, 1))).toBe('2025-01-01');
  });

  it('handles December correctly', () => {
    expect(getDateString(new Date(2025, 11, 1))).toBe('2025-12-01');
  });

  it('handles double-digit day and month', () => {
    expect(getDateString(new Date(2025, 10, 25))).toBe('2025-11-25');
  });
});

describe('isToday — edge cases', () => {
  it('returns false for a completely different date', () => {
    expect(isToday('2020-01-01')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isToday('')).toBe(false);
  });

  it('returns false for invalid date format', () => {
    expect(isToday('not-a-date')).toBe(false);
  });
});

describe('isYesterday — edge cases', () => {
  it('returns false for 3 days ago', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(isYesterday(getDateString(threeDaysAgo))).toBe(false);
  });

  it('returns false for future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isYesterday(getDateString(tomorrow))).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isYesterday('')).toBe(false);
  });

  it('returns true for actual yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isYesterday(getDateString(yesterday))).toBe(true);
  });
});
