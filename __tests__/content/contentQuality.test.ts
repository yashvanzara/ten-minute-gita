/**
 * Content Quality Test Suite
 *
 * Quality checks for commentary and reflection content across all 239 snippets.
 * Catches: short content, wall-of-text, boilerplate openings, duplicates,
 * placeholder strings, and cross-language length disparities.
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
  shortReflection: string;
}

const enPath = path.resolve(__dirname, '../../data/gita_snippets.json');
const hiPath = path.resolve(__dirname, '../../data/gita_snippets_hindi.json');

const enData: Snippet[] = JSON.parse(fs.readFileSync(enPath, 'utf8')).snippets;
const hiData: Snippet[] = JSON.parse(fs.readFileSync(hiPath, 'utf8')).snippets;

// =====================================================================
// Reflection length checks
// =====================================================================

describe('Reflection quality', () => {
  it('no EN reflection under 400 chars', () => {
    const failures = enData
      .filter(s => s.reflection.length < 400)
      .map(s => `ID ${s.id}: ${s.reflection.length} chars`);
    expect(failures).toEqual([]);
  });

  it('no HI reflection under 400 chars', () => {
    const failures = hiData
      .filter(s => s.reflection.length < 400)
      .map(s => `ID ${s.id}: ${s.reflection.length} chars`);
    expect(failures).toEqual([]);
  });

  it('no EN reflection over 800 chars without paragraph breaks', () => {
    const failures = enData
      .filter(s => s.reflection.length > 800 && !s.reflection.includes('\n\n'))
      .map(s => `ID ${s.id}: ${s.reflection.length} chars, no paragraph break`);
    expect(failures).toEqual([]);
  });

  it('no HI reflection over 800 chars without paragraph breaks', () => {
    const failures = hiData
      .filter(s => s.reflection.length > 800 && !s.reflection.includes('\n\n'))
      .map(s => `ID ${s.id}: ${s.reflection.length} chars, no paragraph break`);
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// Commentary length checks
// =====================================================================

describe('Commentary quality', () => {
  it('no EN commentary under 500 chars', () => {
    const failures = enData
      .filter(s => s.commentary.length < 500)
      .map(s => `ID ${s.id}: ${s.commentary.length} chars`);
    expect(failures).toEqual([]);
  });

  it('no HI commentary under 500 chars', () => {
    const failures = hiData
      .filter(s => s.commentary.length < 500)
      .map(s => `ID ${s.id}: ${s.commentary.length} chars`);
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// Boilerplate detection
// =====================================================================

describe('No boilerplate openings', () => {
  const BOILERPLATE_PATTERNS = [
    /^We had been discussing/i,
    /^We have been discussing/i,
    /^In our previous session/i,
    /^In our last session/i,
    /^Welcome back/i,
    /^Far,\s/,
  ];

  it('no EN commentary starts with known boilerplate patterns', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      const text = s.commentary.trim();
      for (const pattern of BOILERPLATE_PATTERNS) {
        if (pattern.test(text)) {
          failures.push(`ID ${s.id}: matches ${pattern}`);
          break;
        }
      }
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// Duplicate detection
// =====================================================================

describe('No duplicate content', () => {
  it('no duplicate reflections between consecutive EN snippets', () => {
    const dupes: string[] = [];
    for (let i = 0; i < enData.length - 1; i++) {
      if (enData[i].reflection === enData[i + 1].reflection) {
        dupes.push(`IDs ${enData[i].id} & ${enData[i + 1].id}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('no duplicate reflections between consecutive HI snippets', () => {
    const dupes: string[] = [];
    for (let i = 0; i < hiData.length - 1; i++) {
      if (hiData[i].reflection === hiData[i + 1].reflection) {
        dupes.push(`IDs ${hiData[i].id} & ${hiData[i + 1].id}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('no duplicate commentaries between consecutive EN snippets (excluding known tech debt)', () => {
    // Known tech debt: ~86 days have repetitive podcast intro content in commentary.
    // These 28 pairs are documented in CLAUDE.md. This test catches NEW duplicates.
    const KNOWN_DUPLICATE_PAIRS = new Set([
      5, 15, 17, 19, 27, 37, 48, 70, 75, 77, 94, 107, 109, 114,
      124, 126, 152, 155, 157, 159, 169, 175, 185, 207, 210, 212, 232, 235,
    ]);
    const dupes: string[] = [];
    for (let i = 0; i < enData.length - 1; i++) {
      if (enData[i].commentary === enData[i + 1].commentary && !KNOWN_DUPLICATE_PAIRS.has(enData[i].id)) {
        dupes.push(`IDs ${enData[i].id} & ${enData[i + 1].id}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('no duplicate commentaries between consecutive HI snippets', () => {
    const dupes: string[] = [];
    for (let i = 0; i < hiData.length - 1; i++) {
      if (hiData[i].commentary === hiData[i + 1].commentary) {
        dupes.push(`IDs ${hiData[i].id} & ${hiData[i + 1].id}`);
      }
    }
    expect(dupes).toEqual([]);
  });
});

// =====================================================================
// Cross-language length ratios
// =====================================================================

describe('Cross-language content parity', () => {
  it('no HI reflection below 35% of EN length', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      const ratio = hi.reflection.length / en.reflection.length;
      if (ratio < 0.35) {
        failures.push(`ID ${en.id}: HI=${hi.reflection.length} EN=${en.reflection.length} ratio=${(ratio * 100).toFixed(1)}%`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('no HI commentary below 40% of EN length', () => {
    const failures: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      const ratio = hi.commentary.length / en.commentary.length;
      if (ratio < 0.40) {
        failures.push(`ID ${en.id}: HI=${hi.commentary.length} EN=${en.commentary.length} ratio=${(ratio * 100).toFixed(1)}%`);
      }
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// Placeholder string detection
// =====================================================================

describe('No placeholder strings', () => {
  const HI_PLACEHOLDER = 'एक क्षण के लिए विचार करें कि ये शिक्षाएँ आज आपके जीवन में कैसे लागू होती हैं।';

  it('no HI reflection is a known placeholder string', () => {
    const failures = hiData
      .filter(s => s.reflection.includes(HI_PLACEHOLDER))
      .map(s => `ID ${s.id}`);
    expect(failures).toEqual([]);
  });

  it('no EN reflection contains "TODO" or "PLACEHOLDER"', () => {
    const failures = enData
      .filter(s => /TODO|PLACEHOLDER/i.test(s.reflection))
      .map(s => `ID ${s.id}`);
    expect(failures).toEqual([]);
  });

  it('no EN commentary contains "TODO" or "PLACEHOLDER"', () => {
    const failures = enData
      .filter(s => /TODO|PLACEHOLDER/i.test(s.commentary))
      .map(s => `ID ${s.id}`);
    expect(failures).toEqual([]);
  });

  it('no HI reflection contains "TODO" or "PLACEHOLDER"', () => {
    const failures = hiData
      .filter(s => /TODO|PLACEHOLDER/i.test(s.reflection))
      .map(s => `ID ${s.id}`);
    expect(failures).toEqual([]);
  });

  it('no HI commentary contains "TODO" or "PLACEHOLDER"', () => {
    const failures = hiData
      .filter(s => /TODO|PLACEHOLDER/i.test(s.commentary))
      .map(s => `ID ${s.id}`);
    expect(failures).toEqual([]);
  });

  it('no identical placeholder string repeated across 3+ HI snippets', () => {
    const reflectionCounts = new Map<string, number[]>();
    hiData.forEach(s => {
      const key = s.reflection.trim().substring(0, 100);
      if (!reflectionCounts.has(key)) reflectionCounts.set(key, []);
      reflectionCounts.get(key)!.push(s.id);
    });
    const repeated = [...reflectionCounts.entries()]
      .filter(([, ids]) => ids.length >= 3)
      .map(([text, ids]) => `"${text.substring(0, 50)}..." in IDs: ${ids.join(', ')}`);
    expect(repeated).toEqual([]);
  });
});
