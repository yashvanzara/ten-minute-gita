/**
 * Verse Integrity Test Suite
 *
 * Per-verse field completeness checks across all 239 snippets × 2 languages.
 * Encodes the 8 checks from the Definitive Verse Integrity Audit.
 *
 * The Bhagavad Gita in this app has 701 verses (Ch13 includes 13.01 intro verse).
 */

import * as fs from 'fs';
import * as path from 'path';

interface Snippet {
  id: number;
  title: string;
  chapter: number;
  verses: string;
  sanskrit: string;
  transliteration: string;
  verseTranslations: string[];
  commentary: string;
  reflection: string;
}

const enPath = path.resolve(__dirname, '../../data/gita_snippets.json');
const hiPath = path.resolve(__dirname, '../../data/gita_snippets_hindi.json');

const enData: Snippet[] = JSON.parse(fs.readFileSync(enPath, 'utf8')).snippets;
const hiData: Snippet[] = JSON.parse(fs.readFileSync(hiPath, 'utf8')).snippets;

// Chapter verse counts (sums to 701 — Ch13 counts 13.01 introductory verse)
const CHAPTER_COUNTS: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28,
  9: 34, 10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20,
  16: 24, 17: 28, 18: 78,
};
const TOTAL_VERSES = Object.values(CHAPTER_COUNTS).reduce((a, b) => a + b, 0);

function splitBlocks(text: string): string[] {
  return text.split('\n\n').filter(b => b.trim().length > 0);
}

function parseVerseRange(versesStr: string): string[] {
  const parts = versesStr.split(' - ');
  if (parts.length === 1) {
    const [ch, v] = parts[0].trim().split('.').map(Number);
    return [`${ch}.${String(v).padStart(2, '0')}`];
  }
  const [startCh, startV] = parts[0].trim().split('.').map(Number);
  const endV = parseInt(parts[1].trim().split('.')[1], 10);
  const result: string[] = [];
  for (let v = startV; v <= endV; v++) {
    result.push(`${startCh}.${String(v).padStart(2, '0')}`);
  }
  return result;
}

// =====================================================================
// CHECK 1: Count match — sanskrit blocks = transliteration blocks = verseTranslations.length
// =====================================================================

describe('Check 1: Per-verse count match', () => {
  it('EN: every snippet has matching counts for sanskrit, transliteration, and verseTranslations', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      const sCount = splitBlocks(s.sanskrit).length;
      const tCount = splitBlocks(s.transliteration).length;
      const vtCount = s.verseTranslations.length;
      if (sCount !== tCount || sCount !== vtCount) {
        failures.push(`ID ${s.id} (${s.verses}): sanskrit=${sCount}, transliteration=${tCount}, verseTranslations=${vtCount}`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('HI: every snippet has matching counts for sanskrit, transliteration, and verseTranslations', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      const sCount = splitBlocks(s.sanskrit).length;
      const tCount = splitBlocks(s.transliteration).length;
      const vtCount = s.verseTranslations.length;
      if (sCount !== tCount || sCount !== vtCount) {
        failures.push(`ID ${s.id} (${s.verses}): sanskrit=${sCount}, transliteration=${tCount}, verseTranslations=${vtCount}`);
      }
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// CHECK 2: No empty or too-short blocks
// =====================================================================

describe('Check 2: No empty or too-short blocks', () => {
  it('EN: no sanskrit block under 10 chars', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      splitBlocks(s.sanskrit).forEach((block, i) => {
        if (block.trim().length < 10) {
          failures.push(`ID ${s.id} sanskrit[${i}]: ${block.trim().length} chars`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('EN: no transliteration block under 10 chars', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      splitBlocks(s.transliteration).forEach((block, i) => {
        if (block.trim().length < 10) {
          failures.push(`ID ${s.id} transliteration[${i}]: ${block.trim().length} chars`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('EN: no verseTranslation under 20 chars', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      s.verseTranslations.forEach((vt, i) => {
        if (vt.trim().length < 20) {
          failures.push(`ID ${s.id} verseTranslations[${i}]: ${vt.trim().length} chars`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('HI: no sanskrit block under 10 chars', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      splitBlocks(s.sanskrit).forEach((block, i) => {
        if (block.trim().length < 10) {
          failures.push(`ID ${s.id} sanskrit[${i}]: ${block.trim().length} chars`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('HI: no transliteration block under 10 chars', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      splitBlocks(s.transliteration).forEach((block, i) => {
        if (block.trim().length < 10) {
          failures.push(`ID ${s.id} transliteration[${i}]: ${block.trim().length} chars`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('HI: no verseTranslation under 20 chars', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      s.verseTranslations.forEach((vt, i) => {
        if (vt.trim().length < 20) {
          failures.push(`ID ${s.id} verseTranslations[${i}]: ${vt.trim().length} chars`);
        }
      });
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// CHECK 3: Sanskrit verse structure — must contain danda markers
// =====================================================================

describe('Check 3: Sanskrit verse structure', () => {
  it('EN: every sanskrit block contains | or ।/॥ danda markers', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      splitBlocks(s.sanskrit).forEach((block, i) => {
        if (!block.includes('|') && !block.includes('।') && !block.includes('॥')) {
          failures.push(`ID ${s.id} sanskrit[${i}]: no danda markers`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('HI: every sanskrit block contains | or ।/॥ danda markers', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      splitBlocks(s.sanskrit).forEach((block, i) => {
        if (!block.includes('|') && !block.includes('।') && !block.includes('॥')) {
          failures.push(`ID ${s.id} sanskrit[${i}]: no danda markers`);
        }
      });
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// CHECK 4: Transliteration is Latin only (no Devanagari characters)
// =====================================================================

describe('Check 4: Transliteration is Latin script', () => {
  const DEVANAGARI = /[\u0900-\u097F]/;

  it('EN: no transliteration block contains Devanagari characters', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      splitBlocks(s.transliteration).forEach((block, i) => {
        if (DEVANAGARI.test(block)) {
          failures.push(`ID ${s.id} transliteration[${i}]: contains Devanagari`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('HI: no transliteration block contains Devanagari characters', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      splitBlocks(s.transliteration).forEach((block, i) => {
        if (DEVANAGARI.test(block)) {
          failures.push(`ID ${s.id} transliteration[${i}]: contains Devanagari`);
        }
      });
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// CHECK 5: Word count sanity — transliteration not suspiciously short
// Sanskrit compounds expand in transliteration, so translit may have MORE words.
// Only flag when transliteration has far fewer words than sanskrit.
// =====================================================================

describe('Check 5: Word count sanity', () => {
  it('EN: no transliteration block has < 40% of sanskrit word count', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      const sBlocks = splitBlocks(s.sanskrit);
      const tBlocks = splitBlocks(s.transliteration);
      const len = Math.min(sBlocks.length, tBlocks.length);
      for (let i = 0; i < len; i++) {
        const sWords = sBlocks[i].trim().split(/\s+/).length;
        const tWords = tBlocks[i].trim().split(/\s+/).length;
        if (tWords < sWords * 0.4 && Math.abs(sWords - tWords) > 3) {
          failures.push(`ID ${s.id} verse[${i}]: sanskrit=${sWords}w, translit=${tWords}w`);
        }
      }
    });
    expect(failures).toEqual([]);
  });

  it('HI: no transliteration block has < 40% of sanskrit word count', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      const sBlocks = splitBlocks(s.sanskrit);
      const tBlocks = splitBlocks(s.transliteration);
      const len = Math.min(sBlocks.length, tBlocks.length);
      for (let i = 0; i < len; i++) {
        const sWords = sBlocks[i].trim().split(/\s+/).length;
        const tWords = tBlocks[i].trim().split(/\s+/).length;
        if (tWords < sWords * 0.4 && Math.abs(sWords - tWords) > 3) {
          failures.push(`ID ${s.id} verse[${i}]: sanskrit=${sWords}w, translit=${tWords}w`);
        }
      }
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// CHECK 6: Cross-language identity
// =====================================================================

describe('Check 6: Cross-language identity', () => {
  it('sanskrit is byte-identical between EN and HI for every snippet', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.sanskrit !== hi.sanskrit) {
        failures.push(`ID ${en.id}: sanskrit differs`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('transliteration is byte-identical between EN and HI for every snippet', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.transliteration !== hi.transliteration) {
        failures.push(`ID ${en.id}: transliteration differs`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('verseTranslations array length matches between EN and HI', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.verseTranslations.length !== hi.verseTranslations.length) {
        failures.push(`ID ${en.id}: EN=${en.verseTranslations.length}, HI=${hi.verseTranslations.length}`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('verses field matches between EN and HI', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.verses !== hi.verses) {
        failures.push(`ID ${en.id}: EN="${en.verses}", HI="${hi.verses}"`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('chapter field matches between EN and HI', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.chapter !== hi.chapter) {
        failures.push(`ID ${en.id}: EN=${en.chapter}, HI=${hi.chapter}`);
      }
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// CHECK 7: All 701 verses present — no gaps, no duplicates
// =====================================================================

describe('Check 7: All verses present', () => {
  function collectVerses(data: Snippet[]): { verses: Set<string>; duplicates: string[] } {
    const verses = new Set<string>();
    const duplicates: string[] = [];
    const verseSnippetMap: Record<string, number> = {};
    data.forEach(s => {
      parseVerseRange(s.verses).forEach(v => {
        if (verses.has(v)) {
          duplicates.push(`${v} in snippets ${verseSnippetMap[v]} and ${s.id}`);
        }
        verses.add(v);
        verseSnippetMap[v] = s.id;
      });
    });
    return { verses, duplicates };
  }

  function buildExpected(): Set<string> {
    const expected = new Set<string>();
    for (const [ch, count] of Object.entries(CHAPTER_COUNTS)) {
      for (let v = 1; v <= count; v++) {
        expected.add(`${parseInt(ch)}.${String(v).padStart(2, '0')}`);
      }
    }
    return expected;
  }

  it(`EN: total verse count is ${TOTAL_VERSES}`, () => {
    const { verses } = collectVerses(enData);
    expect(verses.size).toBe(TOTAL_VERSES);
  });

  it(`HI: total verse count is ${TOTAL_VERSES}`, () => {
    const { verses } = collectVerses(hiData);
    expect(verses.size).toBe(TOTAL_VERSES);
  });

  it('EN: no duplicate verses', () => {
    const { duplicates } = collectVerses(enData);
    expect(duplicates).toEqual([]);
  });

  it('HI: no duplicate verses', () => {
    const { duplicates } = collectVerses(hiData);
    expect(duplicates).toEqual([]);
  });

  it('EN: no missing verses (continuous from 1.01 to 18.78)', () => {
    const { verses } = collectVerses(enData);
    const expected = buildExpected();
    const missing = [...expected].filter(v => !verses.has(v));
    expect(missing).toEqual([]);
  });

  it('HI: no missing verses (continuous from 1.01 to 18.78)', () => {
    const { verses } = collectVerses(hiData);
    const expected = buildExpected();
    const missing = [...expected].filter(v => !verses.has(v));
    expect(missing).toEqual([]);
  });

  it('EN: no unexpected verse numbers', () => {
    const { verses } = collectVerses(enData);
    const expected = buildExpected();
    const unexpected = [...verses].filter(v => !expected.has(v));
    expect(unexpected).toEqual([]);
  });

  it('HI: no unexpected verse numbers', () => {
    const { verses } = collectVerses(hiData);
    const expected = buildExpected();
    const unexpected = [...verses].filter(v => !expected.has(v));
    expect(unexpected).toEqual([]);
  });
});

// =====================================================================
// CHECK 8: Chapter boundaries
// =====================================================================

describe('Check 8: Chapter boundaries', () => {
  function chapterVerseCounts(data: Snippet[]): Record<number, number> {
    const counts: Record<number, number> = {};
    data.forEach(s => {
      parseVerseRange(s.verses).forEach(v => {
        const ch = parseInt(v.split('.')[0]);
        counts[ch] = (counts[ch] || 0) + 1;
      });
    });
    return counts;
  }

  it('EN: each chapter has the correct number of verses', () => {
    const counts = chapterVerseCounts(enData);
    const failures: string[] = [];
    for (const [ch, expected] of Object.entries(CHAPTER_COUNTS)) {
      const actual = counts[parseInt(ch)] || 0;
      if (actual !== expected) {
        failures.push(`Chapter ${ch}: expected ${expected}, got ${actual}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('HI: each chapter has the correct number of verses', () => {
    const counts = chapterVerseCounts(hiData);
    const failures: string[] = [];
    for (const [ch, expected] of Object.entries(CHAPTER_COUNTS)) {
      const actual = counts[parseInt(ch)] || 0;
      if (actual !== expected) {
        failures.push(`Chapter ${ch}: expected ${expected}, got ${actual}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
