/**
 * Tests for notification content generation.
 * Covers: different streak levels, with/without translation function,
 * edge cases like streak=0, very high streaks.
 */

import { generateNotificationContent } from '@/utils/notifications';

describe('generateNotificationContent', () => {
  describe('without translation function', () => {
    it('generates begin journey message for streak=0', () => {
      const result = generateNotificationContent(1, 'The Battlefield', 0);
      expect(result.title).toBe('Begin your journey today');
      expect(result.body).toContain('Day 1');
      expect(result.body).toContain('The Battlefield');
    });

    it('generates keep going message for streak 1-6', () => {
      const result = generateNotificationContent(5, 'Arjuna Despairs', 3);
      expect(result.title).toContain('Day 5');
      expect(result.body).toContain('3-day');
    });

    it('generates strong streak message for streak >= 7', () => {
      const result = generateNotificationContent(10, 'Yoga of Knowledge', 10);
      expect(result.title).toContain('Day 10');
      expect(result.body).toContain('10 days strong');
    });

    it('handles very high streak', () => {
      const result = generateNotificationContent(200, 'Final Teachings', 199);
      expect(result.body).toContain('199 days strong');
    });
  });

  describe('with translation function', () => {
    const mockT = (key: string, params?: Record<string, string | number>): string => {
      if (key === 'notifications.beginJourney') return 'Begin your journey';
      if (key === 'notifications.dayIntro') return `Day ${params?.day}: ${params?.title}`;
      if (key === 'notifications.dayReady') return `Day ${params?.day} is ready`;
      if (key === 'notifications.keepGoing') return `${params?.title} · ${params?.streak}-day streak`;
      return key;
    };

    it('uses translation for streak=0', () => {
      const result = generateNotificationContent(1, 'The Battlefield', 0, mockT);
      expect(result.title).toBe('Begin your journey');
      expect(result.body).toContain('Day 1');
    });

    it('uses translation for active streak', () => {
      const result = generateNotificationContent(5, 'Arjuna Despairs', 3, mockT);
      expect(result.title).toBe('Day 5 is ready');
      expect(result.body).toContain('3-day streak');
    });
  });
});
