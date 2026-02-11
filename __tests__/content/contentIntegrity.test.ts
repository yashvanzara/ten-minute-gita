/**
 * Content Integrity Test Suite
 *
 * Validates the JSON data files that power the app.
 * Catches the exact classes of bugs found during the content audit:
 * - placeholder reflections, duplicate commentaries, truncated text,
 *   wall-of-text formatting, boilerplate openings, cross-language gaps.
 *
 * Tiers:
 *   1. Structural  — broken data (missing fields, bad IDs, parse errors)
 *   2. Quality     — the bugs we actually found and fixed
 *   3. Parity      — translation gaps between EN and HI
 *   4. Audio sync  — aligned JSON consistency (skipped if audio files absent)
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

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

interface AlignedSection {
  type: string;
  words: { word: string; start: number; end: number }[];
}

interface AlignedData {
  audio_file: string;
  snippet_key: string;
  language: string;
  duration_seconds: number;
  sections: AlignedSection[];
}

const TOTAL_SNIPPETS = 239;
const REQUIRED_FIELDS: (keyof Snippet)[] = [
  'id', 'title', 'chapter', 'verses', 'sanskrit',
  'transliteration', 'verseTranslations', 'commentary',
  'reflection', 'shortReflection',
];

const enPath = path.resolve(__dirname, '../../data/gita_snippets.json');
const hiPath = path.resolve(__dirname, '../../data/gita_snippets_hindi.json');

const enData: Snippet[] = JSON.parse(fs.readFileSync(enPath, 'utf8')).snippets;
const hiData: Snippet[] = JSON.parse(fs.readFileSync(hiPath, 'utf8')).snippets;

// Helper: count verses implied by a verses string like "1.01 - 1.03"
function expectedVerseCount(verses: string): number {
  const parts = verses.split(' - ');
  if (parts.length === 1) return 1;
  const start = parseInt(parts[0].split('.')[1], 10);
  const end = parseInt(parts[1].split('.')[1], 10);
  return end - start + 1;
}

// Audio paths (may not exist on all machines)
const AUDIO_BASE = '/Users/anishmoonka/Desktop/gita_podcast';
const audioAvailable = fs.existsSync(AUDIO_BASE);

function getAlignedPath(snippet: Snippet, lang: 'en' | 'hi'): string {
  const v = snippet.verses.trim();
  const match = v.match(/^(\d+)\.(\d+)\s*-\s*\d+\.(\d+)$/);
  if (!match) {
    const single = v.match(/^(\d+)\.(\d+)$/);
    if (single) {
      const ch = single[1].padStart(2, '0');
      const vs = single[2].padStart(2, '0');
      return path.join(AUDIO_BASE, lang === 'hi' ? 'Audio_Hindi' : 'Audio_English',
        `Ch${ch}_Verses_${vs}-${vs}_aligned.json`);
    }
    return '';
  }
  const ch = match[1].padStart(2, '0');
  const sv = match[2].padStart(2, '0');
  const ev = match[3].padStart(2, '0');
  return path.join(AUDIO_BASE, lang === 'hi' ? 'Audio_Hindi' : 'Audio_English',
    `Ch${ch}_Verses_${sv}-${ev}_aligned.json`);
}

// =====================================================================
// TIER 1: STRUCTURAL
// =====================================================================

describe('Tier 1: Structural integrity', () => {
  it('EN JSON parses without error and has snippets array', () => {
    expect(Array.isArray(enData)).toBe(true);
  });

  it('HI JSON parses without error and has snippets array', () => {
    expect(Array.isArray(hiData)).toBe(true);
  });

  it(`EN has exactly ${TOTAL_SNIPPETS} snippets`, () => {
    expect(enData).toHaveLength(TOTAL_SNIPPETS);
  });

  it(`HI has exactly ${TOTAL_SNIPPETS} snippets`, () => {
    expect(hiData).toHaveLength(TOTAL_SNIPPETS);
  });

  it('EN IDs are sequential 1-239', () => {
    const ids = enData.map(s => s.id);
    const expected = Array.from({ length: TOTAL_SNIPPETS }, (_, i) => i + 1);
    expect(ids).toEqual(expected);
  });

  it('HI IDs are sequential 1-239', () => {
    const ids = hiData.map(s => s.id);
    const expected = Array.from({ length: TOTAL_SNIPPETS }, (_, i) => i + 1);
    expect(ids).toEqual(expected);
  });

  it('every EN snippet has all 10 required fields, none empty', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      REQUIRED_FIELDS.forEach(field => {
        const val = s[field];
        if (val === undefined || val === null) {
          failures.push(`ID ${s.id}: ${field} is missing`);
        } else if (typeof val === 'string' && val.trim() === '') {
          failures.push(`ID ${s.id}: ${field} is empty string`);
        } else if (Array.isArray(val) && val.length === 0) {
          failures.push(`ID ${s.id}: ${field} is empty array`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('every HI snippet has all 10 required fields, none empty', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      REQUIRED_FIELDS.forEach(field => {
        const val = s[field];
        if (val === undefined || val === null) {
          failures.push(`ID ${s.id}: ${field} is missing`);
        } else if (typeof val === 'string' && val.trim() === '') {
          failures.push(`ID ${s.id}: ${field} is empty string`);
        } else if (Array.isArray(val) && val.length === 0) {
          failures.push(`ID ${s.id}: ${field} is empty array`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('verse numbering is continuous from 1.01 through 18.78', () => {
    let lastChapter = 0;
    let lastEndVerse = 0;
    const failures: string[] = [];

    enData.forEach(s => {
      const parts = s.verses.split(' - ');
      const [ch, startV] = parts[0].split('.').map(Number);
      const endV = parts.length > 1 ? parseInt(parts[1].split('.')[1], 10) : startV;

      if (ch < lastChapter) {
        failures.push(`ID ${s.id}: chapter ${ch} < previous ${lastChapter}`);
      } else if (ch === lastChapter && startV !== lastEndVerse + 1) {
        failures.push(`ID ${s.id}: verse gap — expected start ${lastEndVerse + 1}, got ${startV}`);
      } else if (ch > lastChapter && ch !== lastChapter + 1 && lastChapter !== 0) {
        // Allow chapter jumps only by 1
        failures.push(`ID ${s.id}: chapter jumped from ${lastChapter} to ${ch}`);
      }

      lastChapter = ch;
      lastEndVerse = endV;
    });

    // Should start at 1.01 and end at 18.78
    expect(enData[0].verses.startsWith('1.01')).toBe(true);
    expect(lastChapter).toBe(18);
    expect(lastEndVerse).toBe(78);
    expect(failures).toEqual([]);
  });

  it('verseTranslation count matches verse range for every EN snippet', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      const expected = expectedVerseCount(s.verses);
      if (s.verseTranslations.length !== expected) {
        failures.push(`ID ${s.id}: verses "${s.verses}" implies ${expected} translations, got ${s.verseTranslations.length}`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('verseTranslation count matches verse range for every HI snippet', () => {
    const failures: string[] = [];
    hiData.forEach(s => {
      const expected = expectedVerseCount(s.verses);
      if (s.verseTranslations.length !== expected) {
        failures.push(`ID ${s.id}: verses "${s.verses}" implies ${expected} translations, got ${s.verseTranslations.length}`);
      }
    });
    expect(failures).toEqual([]);
  });
});

// =====================================================================
// TIER 2: QUALITY
// =====================================================================

describe('Tier 2: Content quality', () => {
  it('no EN reflection under 400 chars', () => {
    const short = enData
      .filter(s => s.reflection.length < 400)
      .map(s => `ID ${s.id}: ${s.reflection.length} chars`);
    expect(short).toEqual([]);
  });

  it('no HI reflection under 400 chars', () => {
    const short = hiData
      .filter(s => s.reflection.length < 400)
      .map(s => `ID ${s.id}: ${s.reflection.length} chars`);
    expect(short).toEqual([]);
  });

  it('no EN commentary under 500 chars', () => {
    const short = enData
      .filter(s => s.commentary.length < 500)
      .map(s => `ID ${s.id}: ${s.commentary.length} chars`);
    expect(short).toEqual([]);
  });

  it('no HI commentary under 500 chars', () => {
    const short = hiData
      .filter(s => s.commentary.length < 500)
      .map(s => `ID ${s.id}: ${s.commentary.length} chars`);
    expect(short).toEqual([]);
  });

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

  it('no duplicate commentaries between consecutive HI snippets', () => {
    const dupes: string[] = [];
    for (let i = 0; i < hiData.length - 1; i++) {
      if (hiData[i].commentary === hiData[i + 1].commentary) {
        dupes.push(`IDs ${hiData[i].id} & ${hiData[i + 1].id}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('no EN reflection over 800 chars without paragraph breaks', () => {
    const wallOfText = enData
      .filter(s => s.reflection.length > 800 && !s.reflection.includes('\n\n'))
      .map(s => `ID ${s.id}: ${s.reflection.length} chars, no \\n\\n`);
    expect(wallOfText).toEqual([]);
  });

  it('no HI reflection over 800 chars without paragraph breaks', () => {
    const wallOfText = hiData
      .filter(s => s.reflection.length > 800 && !s.reflection.includes('\n\n'))
      .map(s => `ID ${s.id}: ${s.reflection.length} chars, no \\n\\n`);
    expect(wallOfText).toEqual([]);
  });

  it('no EN commentary starts with known boilerplate patterns', () => {
    const boilerplate = [
      /^We had been discussing/i,
      /^We have been discussing/i,
      /^In our previous session/i,
      /^In our last session/i,
      /^Welcome back/i,
      /^Far,\s/,  // truncated "So far"
    ];
    const matches: string[] = [];
    enData.forEach(s => {
      const opening = s.commentary.trim();
      for (const pattern of boilerplate) {
        if (pattern.test(opening)) {
          matches.push(`ID ${s.id}: matches ${pattern}`);
          break;
        }
      }
    });
    expect(matches).toEqual([]);
  });

  it('no HI reflection is a known placeholder string', () => {
    const placeholder = 'एक क्षण के लिए विचार करें कि ये शिक्षाएँ आज आपके जीवन में कैसे लागू होती हैं।';
    const matches = hiData
      .filter(s => s.reflection.includes(placeholder))
      .map(s => `ID ${s.id}`);
    expect(matches).toEqual([]);
  });
});

// =====================================================================
// TIER 3: CROSS-LANGUAGE PARITY
// =====================================================================

describe('Tier 3: Cross-language parity', () => {
  it('every EN snippet ID exists in HI and vice versa', () => {
    const enIds = new Set(enData.map(s => s.id));
    const hiIds = new Set(hiData.map(s => s.id));
    const missingInHi = enData.filter(s => !hiIds.has(s.id)).map(s => s.id);
    const missingInEn = hiData.filter(s => !enIds.has(s.id)).map(s => s.id);
    expect(missingInHi).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('sanskrit fields are identical across languages', () => {
    const mismatches: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.sanskrit !== hi.sanskrit) {
        mismatches.push(`ID ${en.id}`);
      }
    });
    expect(mismatches).toEqual([]);
  });

  it('transliteration fields are identical across languages', () => {
    const mismatches: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.transliteration !== hi.transliteration) {
        mismatches.push(`ID ${en.id}`);
      }
    });
    expect(mismatches).toEqual([]);
  });

  it('verses fields are identical across languages', () => {
    const mismatches: string[] = [];
    enData.forEach(en => {
      const hi = hiData.find(h => h.id === en.id)!;
      if (en.verses !== hi.verses) {
        mismatches.push(`ID ${en.id}: EN="${en.verses}" HI="${hi.verses}"`);
      }
    });
    expect(mismatches).toEqual([]);
  });

  it('no HI reflection below 35% of EN counterpart length', () => {
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

  it('no HI commentary below 40% of EN counterpart length', () => {
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

  it('no identical placeholder string repeated across 3+ HI snippets', () => {
    // Check reflections
    const reflectionCounts = new Map<string, number[]>();
    hiData.forEach(s => {
      const key = s.reflection.trim().substring(0, 100);
      if (!reflectionCounts.has(key)) reflectionCounts.set(key, []);
      reflectionCounts.get(key)!.push(s.id);
    });
    const repeated = [...reflectionCounts.entries()]
      .filter(([_, ids]) => ids.length >= 3)
      .map(([text, ids]) => `"${text.substring(0, 50)}..." in IDs: ${ids.join(', ')}`);
    expect(repeated).toEqual([]);
  });
});

// =====================================================================
// TIER 4: AUDIO SYNC
// =====================================================================

const describeAudio = audioAvailable ? describe : describe.skip;

describeAudio('Tier 4: Audio sync', () => {
  it('every EN snippet has a corresponding aligned JSON', () => {
    const missing: string[] = [];
    enData.forEach(s => {
      const alignedPath = getAlignedPath(s, 'en');
      if (alignedPath && !fs.existsSync(alignedPath)) {
        missing.push(`ID ${s.id}: ${path.basename(alignedPath)}`);
      }
    });
    expect(missing).toEqual([]);
  });

  it('every HI snippet has a corresponding aligned JSON', () => {
    // These HI snippets had content rewritten and need audio re-recording.
    // Sourced from content_changes_manifest.json audio_regen_needed.hi.
    // Remove IDs from this set as their audio gets regenerated.
    const KNOWN_MISSING_HI = new Set([3, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 131, 151, 170, 174, 176, 178, 194, 203, 239]);
    const missing: string[] = [];
    hiData.forEach(s => {
      if (KNOWN_MISSING_HI.has(s.id)) return;
      const alignedPath = getAlignedPath(s, 'hi');
      if (alignedPath && !fs.existsSync(alignedPath)) {
        missing.push(`ID ${s.id}: ${path.basename(alignedPath)}`);
      }
    });
    expect(missing).toEqual([]);
  });

  it('no aligned JSON section has duration under 0.1s (excluding known compressed verses)', () => {
    // Known tech debt: 53 short verses with borderline timing (see CLAUDE.md)
    const KNOWN_COMPRESSED: Record<number, number[]> = { 120: [4] };
    const failures: string[] = [];
    enData.forEach(s => {
      const alignedPath = getAlignedPath(s, 'en');
      if (!alignedPath || !fs.existsSync(alignedPath)) return;
      const aligned: AlignedData = JSON.parse(fs.readFileSync(alignedPath, 'utf8'));
      aligned.sections.forEach((sec, i) => {
        if (sec.words.length === 0) return;
        if (KNOWN_COMPRESSED[s.id]?.includes(i)) return;
        const start = sec.words[0].start;
        const end = sec.words[sec.words.length - 1].end;
        const duration = end - start;
        if (duration < 0.1) {
          failures.push(`ID ${s.id} section ${i} (${sec.type}): ${duration.toFixed(3)}s`);
        }
      });
    });
    expect(failures).toEqual([]);
  });

  it('aligned sections include expected types (verse, verseTranslation, commentary, reflection)', () => {
    const failures: string[] = [];
    enData.forEach(s => {
      const alignedPath = getAlignedPath(s, 'en');
      if (!alignedPath || !fs.existsSync(alignedPath)) return;
      const aligned: AlignedData = JSON.parse(fs.readFileSync(alignedPath, 'utf8'));
      const types = new Set(aligned.sections.map(sec => sec.type));

      const numVerses = expectedVerseCount(s.verses);
      const verseSections = aligned.sections.filter(sec => sec.type.startsWith('verse') && !sec.type.startsWith('verseTranslation'));
      const translationSections = aligned.sections.filter(sec => sec.type.startsWith('verseTranslation'));

      if (verseSections.length !== numVerses) {
        failures.push(`ID ${s.id}: expected ${numVerses} verse sections, got ${verseSections.length}`);
      }
      if (translationSections.length !== numVerses) {
        failures.push(`ID ${s.id}: expected ${numVerses} translation sections, got ${translationSections.length}`);
      }
      if (!types.has('commentary')) {
        failures.push(`ID ${s.id}: missing commentary section`);
      }
      if (!types.has('reflection')) {
        failures.push(`ID ${s.id}: missing reflection section`);
      }
    });
    expect(failures).toEqual([]);
  });
});
