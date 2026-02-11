import { AlignedSection, ChipType } from '@/types/audio';

/**
 * Gets the start and end timestamps of a section from its first/last word.
 */
export function getSectionStartEnd(section: AlignedSection): { start: number; end: number } {
  if (section.words.length === 0) {
    return { start: 0, end: 0 };
  }
  return {
    start: section.words[0].start,
    end: section.words[section.words.length - 1].end,
  };
}

/**
 * Maps section type to UI chip type.
 */
export function getSectionChipType(sectionType: AlignedSection['type']): ChipType {
  switch (sectionType) {
    case 'verse':
      return 'shloka';
    case 'verseTranslation':
      return 'translation';
    case 'commentary':
      return 'commentary';
    case 'reflection':
      return 'reflection';
  }
}

/**
 * Finds which section index currentTime falls in.
 * Returns -1 if in a gap between sections.
 */
export function findSectionAtTime(sections: AlignedSection[], time: number): number {
  for (let i = 0; i < sections.length; i++) {
    const { start, end } = getSectionStartEnd(sections[i]);
    if (time >= start && time < end) {
      return i;
    }
  }
  return -1;
}

/**
 * Binary search for the word at a given time within a section's words array.
 * Returns the index of the word where word.start <= time < word.end.
 * Returns -1 if no word found.
 */
export function findWordAtTime(words: { start: number; end: number }[], time: number): number {
  if (words.length === 0) return -1;

  let low = 0;
  let high = words.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const word = words[mid];

    if (time < word.start) {
      high = mid - 1;
    } else if (time >= word.end) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  // Fallback: if time is between words, return the closest word
  if (low < words.length && time < words[low].start) {
    return low > 0 ? low - 1 : 0;
  }
  return words.length - 1;
}

/**
 * Checks if currentTime is in a gap between sections (no section covers it).
 */
export function isInGap(sections: AlignedSection[], time: number): boolean {
  if (sections.length === 0) return false;

  // Before first section or after last section is not a gap in the "breathing dots" sense
  const firstStart = getSectionStartEnd(sections[0]).start;
  const lastEnd = getSectionStartEnd(sections[sections.length - 1]).end;
  if (time < firstStart || time >= lastEnd) return false;

  return findSectionAtTime(sections, time) === -1;
}

/**
 * Returns the start times for each of the 4 chip types.
 * Uses the FIRST section of each type.
 */
export function getChipStartTimes(sections: AlignedSection[]): Record<ChipType, number> {
  const result: Record<ChipType, number> = {
    shloka: 0,
    translation: 0,
    commentary: 0,
    reflection: 0,
  };

  const found: Partial<Record<ChipType, boolean>> = {};

  for (const section of sections) {
    const chipType = getSectionChipType(section.type);
    if (!found[chipType]) {
      found[chipType] = true;
      result[chipType] = getSectionStartEnd(section).start;
    }
  }

  return result;
}

/**
 * Formats seconds into MM:SS string.
 * Clamps negative/NaN/Infinity to 0.
 */
export function formatTime(seconds: number): string {
  const safe = (!Number.isFinite(seconds) || seconds < 0) ? 0 : seconds;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
