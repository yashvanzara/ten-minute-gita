/**
 * Content locking logic tests.
 * The reading screen determines content access based on:
 * - completedSnippets (REVIEW mode)
 * - currentSnippet match (CURRENT)
 * - hasReadToday (NEXT_DAY preview)
 * - snippetId > currentSnippet (FUTURE_DAY locked)
 *
 * These tests replicate the logic from reading/[id].tsx to verify correctness.
 */

import { getDateString } from '@/utils/storage';

// Replicate the content locking logic from reading/[id].tsx
function getContentState(params: {
  snippetId: number;
  completedSnippets: number[];
  currentSnippet: number;
  readingHistory: Record<string, number>;
  today: string;
}) {
  const { snippetId, completedSnippets, currentSnippet, readingHistory, today } = params;

  const isCompleted = completedSnippets.includes(snippetId);
  const isNextToRead = snippetId === currentSnippet;
  const hasReadToday = today in readingHistory;

  const isReviewMode = isCompleted;
  const canMarkComplete = isNextToRead && !hasReadToday && !isCompleted;
  const isNextDay = hasReadToday && snippetId === currentSnippet && !isCompleted;
  const isFutureDay = snippetId > currentSnippet && !isCompleted;
  const isContentLocked = isFutureDay;
  const isPreviewLimited = isNextDay;

  return {
    isReviewMode,
    canMarkComplete,
    isNextDay,
    isFutureDay,
    isContentLocked,
    isPreviewLimited,
  };
}

describe('Content locking logic', () => {
  const today = getDateString();

  it('today\'s reading — can mark complete', () => {
    const result = getContentState({
      snippetId: 5,
      completedSnippets: [1, 2, 3, 4],
      currentSnippet: 5,
      readingHistory: {},
      today,
    });

    expect(result.canMarkComplete).toBe(true);
    expect(result.isReviewMode).toBe(false);
    expect(result.isContentLocked).toBe(false);
    expect(result.isPreviewLimited).toBe(false);
  });

  it('already completed reading — review mode', () => {
    const result = getContentState({
      snippetId: 3,
      completedSnippets: [1, 2, 3, 4],
      currentSnippet: 5,
      readingHistory: {},
      today,
    });

    expect(result.isReviewMode).toBe(true);
    expect(result.canMarkComplete).toBe(false);
    expect(result.isContentLocked).toBe(false);
  });

  it('tomorrow\'s reading after today read — preview limited', () => {
    const result = getContentState({
      snippetId: 6,
      completedSnippets: [1, 2, 3, 4, 5],
      currentSnippet: 6,
      readingHistory: { [today]: 5 },
      today,
    });

    expect(result.isNextDay).toBe(true);
    expect(result.isPreviewLimited).toBe(true);
    expect(result.canMarkComplete).toBe(false);
  });

  it('future day — locked', () => {
    const result = getContentState({
      snippetId: 10,
      completedSnippets: [1, 2, 3],
      currentSnippet: 4,
      readingHistory: {},
      today,
    });

    expect(result.isFutureDay).toBe(true);
    expect(result.isContentLocked).toBe(true);
    expect(result.canMarkComplete).toBe(false);
  });

  it('day 1 fresh start — can mark complete', () => {
    const result = getContentState({
      snippetId: 1,
      completedSnippets: [],
      currentSnippet: 1,
      readingHistory: {},
      today,
    });

    expect(result.canMarkComplete).toBe(true);
    expect(result.isReviewMode).toBe(false);
    expect(result.isContentLocked).toBe(false);
  });

  it('last day (239) — can mark complete if current', () => {
    const allExcept239 = Array.from({ length: 238 }, (_, i) => i + 1);
    const result = getContentState({
      snippetId: 239,
      completedSnippets: allExcept239,
      currentSnippet: 239,
      readingHistory: {},
      today,
    });

    expect(result.canMarkComplete).toBe(true);
  });

  it('cannot re-complete already completed day', () => {
    const result = getContentState({
      snippetId: 5,
      completedSnippets: [1, 2, 3, 4, 5],
      currentSnippet: 6,
      readingHistory: { [today]: 5 },
      today,
    });

    expect(result.canMarkComplete).toBe(false);
    expect(result.isReviewMode).toBe(true);
  });

  it('reading after already read today — cannot mark complete', () => {
    const result = getContentState({
      snippetId: 5,
      completedSnippets: [1, 2, 3, 4],
      currentSnippet: 5,
      readingHistory: { [today]: 4 },
      today,
    });

    // Already read today (day 4), now looking at day 5 which is currentSnippet
    // hasReadToday = true, isNextToRead = true, !isCompleted = true
    // canMarkComplete = isNextToRead && !hasReadToday && !isCompleted = false
    expect(result.canMarkComplete).toBe(false);
    // isNextDay = hasReadToday && snippetId === currentSnippet && !isCompleted
    expect(result.isNextDay).toBe(true);
    expect(result.isPreviewLimited).toBe(true);
  });
});
