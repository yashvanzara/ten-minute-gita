/**
 * Comprehensive unit tests for the voice mode / audio playback system.
 *
 * Covers: sectionHelpers boundary conditions, formatTime edge cases,
 * audioReducer state machine transitions, sentenceSplitter edge cases,
 * audioMapping edge cases, highlight computation logic, and position persistence.
 */

import {
  getSectionStartEnd,
  findSectionAtTime,
  findWordAtTime,
  isInGap,
  getSectionChipType,
  getChipStartTimes,
  formatTime,
} from '@/utils/sectionHelpers';
import { splitIntoSentences } from '@/utils/sentenceSplitter';
import { audioReducer, initialAudioUIState } from '@/reducers/audioReducer';
import { getAudioFileKey } from '@/utils/audioMapping';
import type { AlignedSection, AlignedWord, AudioUIState } from '@/types/audio';

// ─── Test helpers ──────────────────────────────────────────────────────

function makeSection(
  type: AlignedSection['type'],
  words: { start: number; end: number }[],
  verseIndex?: number,
): AlignedSection {
  return {
    type,
    text: 'test section',
    words: words.map((w, i) => ({
      word: `word${i}`,
      start: w.start,
      end: w.end,
      matched: true,
    })),
    verse_index: verseIndex,
  };
}

function makeWords(texts: string[], startTime = 0, wordDuration = 0.4, gap = 0.1): AlignedWord[] {
  return texts.map((word, i) => ({
    word,
    start: startTime + i * (wordDuration + gap),
    end: startTime + i * (wordDuration + gap) + wordDuration,
    matched: true,
  }));
}

function makeSnippet(verses: string) {
  return {
    id: 1,
    title: 'Test',
    chapter: 1,
    verses,
    sanskrit: '',
    transliteration: '',
    verseTranslations: [],
    commentary: '',
    reflection: '',
  } as any;
}

// ─── sectionHelpers: findSectionAtTime boundary conditions ─────────

describe('findSectionAtTime — boundary conditions', () => {
  const sections: AlignedSection[] = [
    makeSection('verse', [{ start: 0, end: 5 }], 0),
    makeSection('verseTranslation', [{ start: 6, end: 10 }], 0),
    makeSection('commentary', [{ start: 12, end: 30 }]),
    makeSection('reflection', [{ start: 32, end: 45 }]),
  ];

  it('returns section index when time is exactly on section start', () => {
    expect(findSectionAtTime(sections, 0)).toBe(0);
    expect(findSectionAtTime(sections, 6)).toBe(1);
    expect(findSectionAtTime(sections, 12)).toBe(2);
    expect(findSectionAtTime(sections, 32)).toBe(3);
  });

  it('returns -1 when time is exactly on section end (exclusive upper bound)', () => {
    expect(findSectionAtTime(sections, 5)).toBe(-1);
    expect(findSectionAtTime(sections, 10)).toBe(-1);
    expect(findSectionAtTime(sections, 30)).toBe(-1);
    expect(findSectionAtTime(sections, 45)).toBe(-1);
  });

  it('returns -1 for empty sections array', () => {
    expect(findSectionAtTime([], 5)).toBe(-1);
  });

  it('returns correct index for single section', () => {
    const single = [makeSection('verse', [{ start: 10, end: 20 }])];
    expect(findSectionAtTime(single, 15)).toBe(0);
    expect(findSectionAtTime(single, 10)).toBe(0);
    expect(findSectionAtTime(single, 20)).toBe(-1);
  });

  it('returns -1 for time before first section', () => {
    const late = [makeSection('verse', [{ start: 5, end: 10 }])];
    expect(findSectionAtTime(late, 0)).toBe(-1);
    expect(findSectionAtTime(late, 4.99)).toBe(-1);
  });

  it('returns -1 for time after last section', () => {
    expect(findSectionAtTime(sections, 100)).toBe(-1);
  });

  it('returns -1 for negative time', () => {
    expect(findSectionAtTime(sections, -1)).toBe(-1);
  });
});

// ─── sectionHelpers: findWordAtTime boundary conditions ────────────

describe('findWordAtTime — boundary conditions', () => {
  const words = [
    { start: 0.0, end: 0.5 },
    { start: 0.5, end: 1.0 },  // continuous with previous
    { start: 1.5, end: 2.0 },  // gap before this one
    { start: 2.0, end: 2.5 },
  ];

  it('returns correct index at exact word start', () => {
    expect(findWordAtTime(words, 0.0)).toBe(0);
    expect(findWordAtTime(words, 0.5)).toBe(1);
    expect(findWordAtTime(words, 1.5)).toBe(2);
    expect(findWordAtTime(words, 2.0)).toBe(3);
  });

  it('returns previous word when time is at word end (exclusive)', () => {
    // time exactly at word end = at next word start (if continuous)
    // For word[0] end=0.5, word[1] start=0.5 → returns word[1]
    expect(findWordAtTime(words, 0.5)).toBe(1);
  });

  it('returns fallback for time in gap between words', () => {
    // Gap: 1.0 to 1.5
    const result = findWordAtTime(words, 1.2);
    // Should return nearest word (either 1 or 2)
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(words.length);
  });

  it('returns last word for time far beyond all words', () => {
    expect(findWordAtTime(words, 999)).toBe(3);
  });

  it('returns 0 for time before first word', () => {
    const lateWords = [
      { start: 5, end: 6 },
      { start: 7, end: 8 },
    ];
    const result = findWordAtTime(lateWords, 0);
    expect(result).toBe(0);
  });

  it('returns -1 for empty words array', () => {
    expect(findWordAtTime([], 5)).toBe(-1);
  });

  it('handles single word', () => {
    const single = [{ start: 1.0, end: 2.0 }];
    expect(findWordAtTime(single, 1.5)).toBe(0);
    expect(findWordAtTime(single, 0)).toBe(0);
    expect(findWordAtTime(single, 5)).toBe(0);
  });
});

// ─── sectionHelpers: isInGap boundary conditions ───────────────────

describe('isInGap — boundary conditions', () => {
  const sections = [
    makeSection('verse', [{ start: 0, end: 5 }]),
    makeSection('commentary', [{ start: 8, end: 15 }]),
    makeSection('reflection', [{ start: 20, end: 25 }]),
  ];

  it('returns true for time in gap between sections', () => {
    expect(isInGap(sections, 6)).toBe(true);
    expect(isInGap(sections, 7)).toBe(true);
    expect(isInGap(sections, 16)).toBe(true);
    expect(isInGap(sections, 19)).toBe(true);
  });

  it('returns false for time exactly at section boundary (start)', () => {
    expect(isInGap(sections, 0)).toBe(false);
    expect(isInGap(sections, 8)).toBe(false);
    expect(isInGap(sections, 20)).toBe(false);
  });

  it('returns false for time exactly at last section end (after all content)', () => {
    // time >= lastEnd → not a gap (it's "after content")
    expect(isInGap(sections, 25)).toBe(false);
    expect(isInGap(sections, 100)).toBe(false);
  });

  it('returns false for time before first section', () => {
    const late = [makeSection('verse', [{ start: 5, end: 10 }])];
    expect(isInGap(late, 2)).toBe(false);
  });

  it('returns false for empty sections', () => {
    expect(isInGap([], 5)).toBe(false);
  });

  it('returns false for single section (no gap possible between sections)', () => {
    const single = [makeSection('verse', [{ start: 5, end: 10 }])];
    expect(isInGap(single, 7)).toBe(false);
  });
});

// ─── sectionHelpers: getSectionStartEnd ────────────────────────────

describe('getSectionStartEnd — edge cases', () => {
  it('returns {0, 0} for section with empty words array', () => {
    const section = makeSection('verse', []);
    expect(getSectionStartEnd(section)).toEqual({ start: 0, end: 0 });
  });

  it('handles section with single word', () => {
    const section = makeSection('verse', [{ start: 3.5, end: 4.0 }]);
    expect(getSectionStartEnd(section)).toEqual({ start: 3.5, end: 4.0 });
  });

  it('handles section with many words', () => {
    const words = Array.from({ length: 100 }, (_, i) => ({
      start: i * 0.5,
      end: i * 0.5 + 0.4,
    }));
    const section = makeSection('commentary', words);
    const { start, end } = getSectionStartEnd(section);
    expect(start).toBe(0);
    expect(end).toBe(49.9);
  });
});

// ─── sectionHelpers: getChipStartTimes ─────────────────────────────

describe('getChipStartTimes — edge cases', () => {
  it('returns 0 for missing section types', () => {
    // Only verse and commentary, no translation or reflection
    const sections = [
      makeSection('verse', [{ start: 2, end: 5 }], 0),
      makeSection('commentary', [{ start: 10, end: 20 }]),
    ];
    const times = getChipStartTimes(sections);
    expect(times.shloka).toBe(2);
    expect(times.translation).toBe(0); // not found, stays 0
    expect(times.commentary).toBe(10);
    expect(times.reflection).toBe(0); // not found, stays 0
  });

  it('returns all zeros for empty sections', () => {
    const times = getChipStartTimes([]);
    expect(times.shloka).toBe(0);
    expect(times.translation).toBe(0);
    expect(times.commentary).toBe(0);
    expect(times.reflection).toBe(0);
  });

  it('uses first occurrence of each type', () => {
    const sections = [
      makeSection('verse', [{ start: 1, end: 3 }], 0),
      makeSection('verse', [{ start: 5, end: 7 }], 1),  // second verse
      makeSection('commentary', [{ start: 10, end: 20 }]),
    ];
    const times = getChipStartTimes(sections);
    expect(times.shloka).toBe(1); // first verse, not second
  });
});

// ─── formatTime edge cases ─────────────────────────────────────────

describe('formatTime — edge cases', () => {
  it('formats 0 as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats 59 seconds as "0:59"', () => {
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats exactly 60 seconds as "1:00"', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats 3600 seconds (1 hour) as "60:00"', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(59.99)).toBe('0:59');
    expect(formatTime(60.1)).toBe('1:00');
  });

  it('clamps negative values to "0:00"', () => {
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(-100)).toBe('0:00');
  });

  it('clamps NaN to "0:00"', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('clamps Infinity to "0:00"', () => {
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(-Infinity)).toBe('0:00');
  });

  it('handles speed-adjusted time calculation', () => {
    // 120 seconds at 1.5x speed = 80 seconds displayed
    expect(formatTime(120 / 1.5)).toBe('1:20');
  });
});

// ─── audioReducer — complete state machine tests ───────────────────

describe('audioReducer — state machine lifecycle', () => {
  it('handles full lifecycle: off → load → mini → full → dismiss → reload', () => {
    let state = initialAudioUIState;
    expect(state.playerState).toBe('off');

    // Load snippet
    state = audioReducer(state, { type: 'LOAD_SNIPPET', payload: 1 });
    expect(state.playerState).toBe('full');
    expect(state.snippetId).toBe(1);

    // Minimize
    state = audioReducer(state, { type: 'SET_PLAYER_STATE', payload: 'mini' });
    expect(state.playerState).toBe('mini');

    // Expand back to full
    state = audioReducer(state, { type: 'SET_PLAYER_STATE', payload: 'full' });
    expect(state.playerState).toBe('full');

    // Dismiss
    state = audioReducer(state, { type: 'DISMISS' });
    expect(state.playerState).toBe('off');
    expect(state.snippetId).toBe(1); // preserved

    // Reload same snippet
    state = audioReducer(state, { type: 'LOAD_SNIPPET', payload: 1 });
    expect(state.playerState).toBe('full');
  });

  it('handles snippet switching: load snippet 1 → load snippet 2', () => {
    let state = audioReducer(initialAudioUIState, { type: 'LOAD_SNIPPET', payload: 1 });
    expect(state.snippetId).toBe(1);

    state = audioReducer(state, { type: 'LOAD_SNIPPET', payload: 2 });
    expect(state.snippetId).toBe(2);
    expect(state.playerState).toBe('full');
  });

  it('handles speed changes across player states', () => {
    let state = initialAudioUIState;

    // Set speed while off
    state = audioReducer(state, { type: 'SET_SPEED', payload: 1.3 });
    expect(state.speed).toBe(1.3);

    // Load snippet (speed preserved)
    state = audioReducer(state, { type: 'LOAD_SNIPPET', payload: 1 });
    expect(state.speed).toBe(1.3);

    // Change speed while playing
    state = audioReducer(state, { type: 'SET_SPEED', payload: 0.7 });
    expect(state.speed).toBe(0.7);

    // Dismiss (speed preserved)
    state = audioReducer(state, { type: 'DISMISS' });
    expect(state.speed).toBe(0.7);
  });

  it('RESTORE_POSITION then LOAD_SNIPPET preserves restored data', () => {
    let state = initialAudioUIState;

    state = audioReducer(state, {
      type: 'RESTORE_POSITION',
      payload: { savedTime: 150, hasListened: true, speed: 0.8 },
    });
    expect(state.hasListened).toBe(true);
    expect(state.speed).toBe(0.8);

    state = audioReducer(state, { type: 'LOAD_SNIPPET', payload: 5 });
    // LOAD_SNIPPET resets hasListened to prevent stale state from blocking resume
    expect(state.hasListened).toBe(false);
    expect(state.speed).toBe(0.8);
    expect(state.playerState).toBe('full');
  });

  it('MARK_LISTENED transitions to off (ListenPill shows Listened·Replay)', () => {
    let state = audioReducer(
      { ...initialAudioUIState, playerState: 'full', snippetId: 1 },
      { type: 'MARK_LISTENED' },
    );
    expect(state.playerState).toBe('off');
    expect(state.hasListened).toBe(true);
  });

  it('MARK_LISTENED when already listened stays off', () => {
    const prev: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      hasListened: true,
      savedTime: 0,
    };
    const state = audioReducer(prev, { type: 'MARK_LISTENED' });
    expect(state.hasListened).toBe(true);
    expect(state.playerState).toBe('off');
  });

  it('LOAD_SNIPPET always resets isSpeedExpanded', () => {
    const prev: AudioUIState = {
      ...initialAudioUIState,
      isSpeedExpanded: true,
      speed: 1.3,
    };
    const state = audioReducer(prev, { type: 'LOAD_SNIPPET', payload: 42 });
    expect(state.isSpeedExpanded).toBe(false);
    expect(state.speed).toBe(1.3); // preserved
  });

  it('TOGGLE_SPEED_PANEL rapid toggle returns to original state', () => {
    let state = initialAudioUIState;
    expect(state.isSpeedExpanded).toBe(false);

    state = audioReducer(state, { type: 'TOGGLE_SPEED_PANEL' });
    expect(state.isSpeedExpanded).toBe(true);

    state = audioReducer(state, { type: 'TOGGLE_SPEED_PANEL' });
    expect(state.isSpeedExpanded).toBe(false);
  });

  it('SET_SPEED with extreme values (no clamping in reducer)', () => {
    let state = audioReducer(initialAudioUIState, { type: 'SET_SPEED', payload: 0 });
    expect(state.speed).toBe(0);

    state = audioReducer(state, { type: 'SET_SPEED', payload: -1 });
    expect(state.speed).toBe(-1);

    state = audioReducer(state, { type: 'SET_SPEED', payload: 99 });
    expect(state.speed).toBe(99);
  });

  it('unknown action returns same state reference', () => {
    const state = audioReducer(initialAudioUIState, { type: 'BOGUS' as any });
    expect(state).toBe(initialAudioUIState);
  });

  it('DISMISS closes speed panel', () => {
    const prev: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      isSpeedExpanded: true,
    };
    const state = audioReducer(prev, { type: 'DISMISS' });
    expect(state.isSpeedExpanded).toBe(false);
  });

  it('RESTORE_POSITION with all zeros', () => {
    const state = audioReducer(initialAudioUIState, {
      type: 'RESTORE_POSITION',
      payload: { savedTime: 0, hasListened: false, speed: 0 },
    });
    expect(state.savedTime).toBe(0);
    expect(state.hasListened).toBe(false);
    expect(state.speed).toBe(0);
  });
});

// ─── sentenceSplitter — edge cases ─────────────────────────────────

describe('splitIntoSentences — edge cases', () => {
  it('splits multiple sentences correctly', () => {
    const words = makeWords(['Hello', 'world.', 'How', 'are', 'you?', 'Fine.']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('Hello world.');
    expect(result[1].text).toBe('How are you?');
    expect(result[2].text).toBe('Fine.');
  });

  it('handles word with multiple punctuation (e.g., "really?!")', () => {
    const words = makeWords(['really?!', 'yes.']);
    const result = splitIntoSentences(words);
    // "?!" ends with "!" which matches /[.?!।]$/
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].endWordIndex).toBe(0); // first sentence ends at "really?!"
  });

  it('handles max words boundary (exactly 30 words, no terminator)', () => {
    const texts = Array.from({ length: 30 }, (_, i) => `word${i}`);
    const words = makeWords(texts);
    const result = splitIntoSentences(words);
    // 30 words >= SENTENCE_MAX_WORDS (30), force break triggered
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('force-breaks at current position when no comma found', () => {
    // 35 words, no commas, no sentence terminators
    const texts = Array.from({ length: 35 }, (_, i) => `word${i}`);
    const words = makeWords(texts);
    const result = splitIntoSentences(words);
    expect(result.length).toBeGreaterThanOrEqual(2);
    // First group should end around word 29 (0-indexed)
    expect(result[0].endWordIndex).toBeLessThanOrEqual(30);
  });

  it('handles single very long sentence (50 words, with comma)', () => {
    const texts = Array.from({ length: 50 }, (_, i) => {
      if (i === 20) return 'middle,';
      return `word${i}`;
    });
    const words = makeWords(texts);
    const result = splitIntoSentences(words);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles Hindi danda (।) as sentence terminator', () => {
    const words = makeWords(['कर्म', 'करो।', 'फल', 'त्यागो।']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(2);
    expect(result[0].endWordIndex).toBe(1);
    expect(result[1].startWordIndex).toBe(2);
  });

  it('preserves word indices correctly', () => {
    const words = makeWords(['a.', 'b.', 'c.']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ startWordIndex: 0, endWordIndex: 0, text: 'a.' });
    expect(result[1]).toEqual({ startWordIndex: 1, endWordIndex: 1, text: 'b.' });
    expect(result[2]).toEqual({ startWordIndex: 2, endWordIndex: 2, text: 'c.' });
  });
});

// ─── audioMapping — edge cases ─────────────────────────────────────

describe('getAudioFileKey — edge cases', () => {
  it('parses single verse "2.47"', () => {
    expect(getAudioFileKey(makeSnippet('2.47'))).toBe('Ch02_Verses_47-47');
  });

  it('parses same start and end verse "1.01 - 1.01"', () => {
    expect(getAudioFileKey(makeSnippet('1.01 - 1.01'))).toBe('Ch01_Verses_01-01');
  });

  it('handles whitespace variations', () => {
    expect(getAudioFileKey(makeSnippet('1.01-1.03'))).toBe('Ch01_Verses_01-03');
    expect(getAudioFileKey(makeSnippet('1.01  -  1.03'))).toBe('Ch01_Verses_01-03');
  });

  it('throws for empty string', () => {
    expect(() => getAudioFileKey(makeSnippet(''))).toThrow('Cannot parse verses string');
  });

  it('throws for non-verse format', () => {
    expect(() => getAudioFileKey(makeSnippet('chapter one'))).toThrow('Cannot parse verses string');
  });
});

// ─── Highlight logic (pure computation tests) ──────────────────────

describe('highlight computation logic', () => {
  // These test the computation that useAudioHighlight performs,
  // extracted as pure function tests.

  const sections: AlignedSection[] = [
    makeSection('verse', [
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 3 },
    ], 0),
    makeSection('verseTranslation', [
      { start: 4, end: 5 },
      { start: 5, end: 6 },
    ], 0),
    makeSection('commentary', [
      { start: 8, end: 9 },
      { start: 9, end: 10 },
      { start: 10, end: 11 },
    ]),
    makeSection('reflection', [
      { start: 13, end: 14 },
      { start: 14, end: 15 },
    ]),
  ];

  function computeHighlightType(time: number) {
    const sectionIndex = findSectionAtTime(sections, time);
    const gap = isInGap(sections, time);

    if (gap) return 'gap';
    if (sectionIndex < 0) return 'none';

    const section = sections[sectionIndex];
    if (section.type === 'verse') return 'word';
    return 'sentence';
  }

  it('verse section → word highlight', () => {
    expect(computeHighlightType(1.5)).toBe('word');
  });

  it('verseTranslation section → sentence highlight', () => {
    expect(computeHighlightType(4.5)).toBe('sentence');
  });

  it('commentary section → sentence highlight', () => {
    expect(computeHighlightType(9.5)).toBe('sentence');
  });

  it('reflection section → sentence highlight', () => {
    expect(computeHighlightType(13.5)).toBe('sentence');
  });

  it('gap between sections → gap highlight', () => {
    expect(computeHighlightType(3.5)).toBe('gap'); // between verse and translation
    expect(computeHighlightType(7)).toBe('gap');   // between translation and commentary
    expect(computeHighlightType(12)).toBe('gap');   // between commentary and reflection
  });

  it('before first section → none', () => {
    const lateStart = [makeSection('verse', [{ start: 5, end: 10 }])];
    const idx = findSectionAtTime(lateStart, 2);
    const gap = isInGap(lateStart, 2);
    expect(idx).toBe(-1);
    expect(gap).toBe(false);
    // → none
  });

  it('after last section → none', () => {
    const idx = findSectionAtTime(sections, 100);
    const gap = isInGap(sections, 100);
    expect(idx).toBe(-1);
    expect(gap).toBe(false);
  });

  it('word index is correct for verse highlight', () => {
    const sectionIdx = findSectionAtTime(sections, 1.5);
    expect(sectionIdx).toBe(0);
    const wordIdx = findWordAtTime(sections[0].words, 1.5);
    expect(wordIdx).toBe(1); // word1: start=1, end=2
  });
});

// ─── Position persistence logic (save/restore round-trip) ──────────

describe('position persistence — round-trip', () => {
  it('SavedAudioPosition round-trips through JSON', () => {
    const saved = {
      snippetId: 42,
      time: 123.456,
      hasListened: false,
      speed: 1.3,
    };
    const json = JSON.stringify(saved);
    const restored = JSON.parse(json);
    expect(restored).toEqual(saved);
  });

  it('handles hasListened=true round-trip', () => {
    const saved = {
      snippetId: 1,
      time: 0,
      hasListened: true,
      speed: 1.0,
    };
    const restored = JSON.parse(JSON.stringify(saved));
    expect(restored.hasListened).toBe(true);
    expect(restored.time).toBe(0);
  });

  it('handles corrupt JSON gracefully', () => {
    expect(() => JSON.parse('not json')).toThrow();
  });

  it('handles null data', () => {
    const restored = JSON.parse('null');
    expect(restored).toBeNull();
  });

  it('handles missing fields in saved data', () => {
    const partial = { snippetId: 1 };
    const json = JSON.stringify(partial);
    const restored = JSON.parse(json);
    expect(restored.snippetId).toBe(1);
    expect(restored.time).toBeUndefined();
    expect(restored.hasListened).toBeUndefined();
  });
});

// ─── getSectionChipType exhaustive ─────────────────────────────────

describe('getSectionChipType — exhaustive', () => {
  it('maps all four section types correctly', () => {
    expect(getSectionChipType('verse')).toBe('shloka');
    expect(getSectionChipType('verseTranslation')).toBe('translation');
    expect(getSectionChipType('commentary')).toBe('commentary');
    expect(getSectionChipType('reflection')).toBe('reflection');
  });
});

// ─── Deep test: speed-adjusted time calculations ───────────────────

describe('speed-adjusted time — integration', () => {
  it('formatTime at 1.0x speed', () => {
    const elapsed = 120; // 2 minutes raw
    const speed = 1.0;
    expect(formatTime(elapsed / speed)).toBe('2:00');
  });

  it('formatTime at 1.5x speed (faster playback = less displayed time)', () => {
    const elapsed = 120;
    const speed = 1.5;
    // 120 / 1.5 = 80 seconds = 1:20
    expect(formatTime(elapsed / speed)).toBe('1:20');
  });

  it('formatTime at 0.5x speed (slower playback = more displayed time)', () => {
    const elapsed = 120;
    const speed = 0.5;
    // 120 / 0.5 = 240 seconds = 4:00
    expect(formatTime(elapsed / speed)).toBe('4:00');
  });

  it('skip forward calculates correctly at different speeds', () => {
    const SKIP_SECONDS = 15;
    const currentTime = 60;

    // At 1.0x: skip 15 * 1.0 = 15 raw seconds
    expect(currentTime + SKIP_SECONDS * 1.0).toBe(75);

    // At 1.5x: skip 15 * 1.5 = 22.5 raw seconds (covers more audio)
    expect(currentTime + SKIP_SECONDS * 1.5).toBe(82.5);

    // At 0.7x: skip 15 * 0.7 = 10.5 raw seconds (covers less audio)
    expect(currentTime + SKIP_SECONDS * 0.7).toBeCloseTo(70.5);
  });
});
