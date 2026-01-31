import { getDateString, isToday, isYesterday, getWeekStart, calculateProgress } from '@/utils/storage';

describe('getDateString', () => {
  it('formats current date as YYYY-MM-DD', () => {
    const result = getDateString(new Date(2025, 0, 15)); // Jan 15, 2025
    expect(result).toBe('2025-01-15');
  });

  it('pads single-digit months and days', () => {
    expect(getDateString(new Date(2025, 2, 5))).toBe('2025-03-05');
  });

  it('defaults to now when no arg', () => {
    const result = getDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isToday', () => {
  it('returns true for today', () => {
    expect(isToday(getDateString())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(getDateString(yesterday))).toBe(false);
  });
});

describe('isYesterday', () => {
  it('returns true for yesterday date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isYesterday(getDateString(yesterday))).toBe(true);
  });

  it('returns false for two days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(isYesterday(getDateString(twoDaysAgo))).toBe(false);
  });
});

describe('getWeekStart', () => {
  it('returns Monday of current week', () => {
    // Wed Jan 15, 2025
    const result = getWeekStart(new Date(2025, 0, 15));
    expect(result).toBe('2025-01-13'); // Monday
  });

  it('handles Sunday', () => {
    // Sun Jan 19, 2025
    const result = getWeekStart(new Date(2025, 0, 19));
    expect(result).toBe('2025-01-13');
  });
});

describe('calculateProgress', () => {
  it('returns correct percentage and remaining', () => {
    const result = calculateProgress(120);
    expect(result.percentage).toBe(50);
    expect(result.daysRemaining).toBe(119);
  });

  it('handles zero', () => {
    const result = calculateProgress(0);
    expect(result.percentage).toBe(0);
    expect(result.daysRemaining).toBe(239);
  });
});
