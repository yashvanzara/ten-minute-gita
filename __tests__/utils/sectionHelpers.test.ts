import {
  getSectionStartEnd,
  findSectionAtTime,
  findWordAtTime,
  isInGap,
  getSectionChipType,
  getChipStartTimes,
  formatTime,
} from '@/utils/sectionHelpers';
import { AlignedSection } from '@/types/audio';

function makeSection(
  type: AlignedSection['type'],
  words: { start: number; end: number }[],
  verseIndex?: number,
): AlignedSection {
  return {
    type,
    text: 'test',
    words: words.map((w, i) => ({
      word: `word${i}`,
      start: w.start,
      end: w.end,
      matched: true,
    })),
    verse_index: verseIndex,
  };
}

describe('getSectionStartEnd', () => {
  it('derives start from first word and end from last word', () => {
    const section = makeSection('verse', [
      { start: 1.0, end: 1.5 },
      { start: 1.6, end: 2.0 },
      { start: 2.1, end: 3.0 },
    ]);
    const { start, end } = getSectionStartEnd(section);
    expect(start).toBe(1.0);
    expect(end).toBe(3.0);
  });

  it('returns { 0, 0 } for empty words array', () => {
    const section = makeSection('verse', []);
    const { start, end } = getSectionStartEnd(section);
    expect(start).toBe(0);
    expect(end).toBe(0);
  });

  it('handles single word', () => {
    const section = makeSection('verse', [{ start: 5.0, end: 5.5 }]);
    const { start, end } = getSectionStartEnd(section);
    expect(start).toBe(5.0);
    expect(end).toBe(5.5);
  });
});

describe('findWordAtTime', () => {
  const words = [
    { start: 0.0, end: 0.5 },
    { start: 0.6, end: 1.0 },
    { start: 1.1, end: 1.5 },
    { start: 1.6, end: 2.0 },
    { start: 2.1, end: 2.5 },
  ];

  it('returns correct word index for time within a word', () => {
    expect(findWordAtTime(words, 0.3)).toBe(0);
    expect(findWordAtTime(words, 0.8)).toBe(1);
    expect(findWordAtTime(words, 1.3)).toBe(2);
    expect(findWordAtTime(words, 1.8)).toBe(3);
    expect(findWordAtTime(words, 2.3)).toBe(4);
  });

  it('returns closest word for time in gap between words', () => {
    // Time 0.55 is between word 0 (end 0.5) and word 1 (start 0.6)
    const result = findWordAtTime(words, 0.55);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('returns -1 for empty words', () => {
    expect(findWordAtTime([], 1.0)).toBe(-1);
  });

  it('returns last word for time past all words', () => {
    expect(findWordAtTime(words, 10.0)).toBe(4);
  });

  it('returns first word at exact start', () => {
    expect(findWordAtTime(words, 0.0)).toBe(0);
  });
});

describe('findSectionAtTime', () => {
  const sections: AlignedSection[] = [
    makeSection('verse', [{ start: 0, end: 5 }], 0),
    makeSection('verseTranslation', [{ start: 6, end: 10 }], 0),
    makeSection('commentary', [{ start: 12, end: 30 }]),
    makeSection('reflection', [{ start: 32, end: 45 }]),
  ];

  it('returns correct section index for time within section', () => {
    expect(findSectionAtTime(sections, 3)).toBe(0);
    expect(findSectionAtTime(sections, 8)).toBe(1);
    expect(findSectionAtTime(sections, 20)).toBe(2);
    expect(findSectionAtTime(sections, 40)).toBe(3);
  });

  it('returns -1 for time in gap between sections', () => {
    expect(findSectionAtTime(sections, 5.5)).toBe(-1); // gap between 5 and 6
    expect(findSectionAtTime(sections, 11)).toBe(-1);   // gap between 10 and 12
    expect(findSectionAtTime(sections, 31)).toBe(-1);   // gap between 30 and 32
  });

  it('returns -1 for time before first section', () => {
    const sections2 = [makeSection('verse', [{ start: 5, end: 10 }])];
    expect(findSectionAtTime(sections2, 2)).toBe(-1);
  });
});

describe('isInGap', () => {
  const sections: AlignedSection[] = [
    makeSection('verse', [{ start: 0, end: 5 }], 0),
    makeSection('commentary', [{ start: 8, end: 15 }]),
  ];

  it('returns true for time between sections', () => {
    expect(isInGap(sections, 6)).toBe(true);
    expect(isInGap(sections, 7)).toBe(true);
  });

  it('returns false for time within a section', () => {
    expect(isInGap(sections, 3)).toBe(false);
    expect(isInGap(sections, 10)).toBe(false);
  });

  it('returns false for time before first section', () => {
    const s = [makeSection('verse', [{ start: 5, end: 10 }])];
    expect(isInGap(s, 2)).toBe(false);
  });

  it('returns false for time after last section', () => {
    expect(isInGap(sections, 20)).toBe(false);
  });

  it('returns false for empty sections', () => {
    expect(isInGap([], 5)).toBe(false);
  });
});

describe('getSectionChipType', () => {
  it('maps verse → shloka', () => {
    expect(getSectionChipType('verse')).toBe('shloka');
  });

  it('maps verseTranslation → translation', () => {
    expect(getSectionChipType('verseTranslation')).toBe('translation');
  });

  it('maps commentary → commentary', () => {
    expect(getSectionChipType('commentary')).toBe('commentary');
  });

  it('maps reflection → reflection', () => {
    expect(getSectionChipType('reflection')).toBe('reflection');
  });
});

describe('getChipStartTimes', () => {
  it('returns start times for each chip type', () => {
    const sections: AlignedSection[] = [
      makeSection('verse', [{ start: 0, end: 5 }], 0),
      makeSection('verseTranslation', [{ start: 6, end: 10 }], 0),
      makeSection('verse', [{ start: 11, end: 15 }], 1),
      makeSection('verseTranslation', [{ start: 16, end: 20 }], 1),
      makeSection('commentary', [{ start: 22, end: 40 }]),
      makeSection('reflection', [{ start: 42, end: 50 }]),
    ];

    const times = getChipStartTimes(sections);
    expect(times.shloka).toBe(0);       // First verse starts at 0
    expect(times.translation).toBe(6);  // First verseTranslation starts at 6
    expect(times.commentary).toBe(22);
    expect(times.reflection).toBe(42);
  });
});

describe('formatTime', () => {
  it('formats 0 as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats 65 as "1:05"', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('formats 600 as "10:00"', () => {
    expect(formatTime(600)).toBe('10:00');
  });

  it('formats fractional seconds by flooring', () => {
    expect(formatTime(65.9)).toBe('1:05');
  });
});
