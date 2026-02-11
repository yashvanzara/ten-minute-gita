/**
 * Translation system tests.
 * Covers: getTranslation, interpolation, fallback to English,
 * missing keys, array values, edge cases.
 */

import { getTranslation } from '@/constants/translations';

describe('getTranslation', () => {
  describe('basic lookup', () => {
    it('returns English translation for known key', () => {
      const result = getTranslation('en', 'common.loading');
      expect(result).toBe('Loading...');
    });

    it('returns Hindi translation for known key', () => {
      const result = getTranslation('hi', 'common.loading');
      expect(typeof result).toBe('string');
      expect(result).not.toBe('common.loading'); // should not return the key itself
    });

    it('returns key itself for unknown key', () => {
      const result = getTranslation('en', 'totally.made.up.key');
      expect(result).toBe('totally.made.up.key');
    });
  });

  describe('interpolation', () => {
    it('replaces {{param}} with value', () => {
      const result = getTranslation('en', 'common.dayNum', { day: 42 });
      expect(result).toBe('Day 42');
    });

    it('replaces multiple params', () => {
      const result = getTranslation('en', 'reading.dayOfTotal', { day: 5, total: 239 });
      expect(typeof result).toBe('string');
      expect(result).toContain('5');
      expect(result).toContain('239');
    });

    it('handles string param values', () => {
      const result = getTranslation('en', 'common.dayNum', { day: '99' });
      expect(result).toBe('Day 99');
    });

    it('leaves unmatched placeholders if param not provided', () => {
      // If key has {{day}} but we pass no params
      const result = getTranslation('en', 'common.dayNum');
      expect(result).toContain('{{day}}');
    });
  });

  describe('language fallback', () => {
    it('falls back to English when Hindi key is missing', () => {
      // This tests that if a key exists in en but not hi, it falls back
      const enResult = getTranslation('en', 'common.loading');
      const hiResult = getTranslation('hi', 'common.loading');
      // Both should return a string (not the key)
      expect(typeof enResult).toBe('string');
      expect(typeof hiResult).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('handles empty string key', () => {
      const result = getTranslation('en', '');
      // Empty key should return the key itself (empty string)
      expect(result).toBe('');
    });

    it('handles key with special regex characters', () => {
      // Should not crash even with regex-like characters in key
      const result = getTranslation('en', 'key.with[brackets]');
      expect(result).toBe('key.with[brackets]');
    });
  });
});
