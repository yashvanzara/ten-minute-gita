import { getAudioFileKey, getAudioFilePath, getAlignedDataPath } from '@/utils/audioMapping';
import { Snippet } from '@/types';

// Helper to create a minimal snippet with given verses
function makeSnippet(verses: string): Snippet {
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
  } as Snippet;
}

describe('getAudioFileKey', () => {
  it('parses "1.01 - 1.03" → "Ch01_Verses_01-03"', () => {
    expect(getAudioFileKey(makeSnippet('1.01 - 1.03'))).toBe('Ch01_Verses_01-03');
  });

  it('parses "18.76 - 18.78" → "Ch18_Verses_76-78"', () => {
    expect(getAudioFileKey(makeSnippet('18.76 - 18.78'))).toBe('Ch18_Verses_76-78');
  });

  it('parses "2.11 - 2.15" → "Ch02_Verses_11-15"', () => {
    expect(getAudioFileKey(makeSnippet('2.11 - 2.15'))).toBe('Ch02_Verses_11-15');
  });

  it('parses "10.01 - 10.07" → "Ch10_Verses_01-07"', () => {
    expect(getAudioFileKey(makeSnippet('10.01 - 10.07'))).toBe('Ch10_Verses_01-07');
  });

  it('handles single-digit verses "3.01 - 3.05"', () => {
    expect(getAudioFileKey(makeSnippet('3.01 - 3.05'))).toBe('Ch03_Verses_01-05');
  });

  it('throws for invalid verse format', () => {
    expect(() => getAudioFileKey(makeSnippet('invalid'))).toThrow('Cannot parse verses string');
  });
});

describe('getAudioFilePath', () => {
  it('returns Hindi path for hi language', () => {
    const result = getAudioFilePath(makeSnippet('1.01 - 1.03'), 'hi');
    expect(result).toContain('Audio_Hindi_AAC');
    expect(result).toContain('Ch01_Verses_01-03.m4a');
  });

  it('returns English path for en language', () => {
    const result = getAudioFilePath(makeSnippet('1.01 - 1.03'), 'en');
    expect(result).toContain('Audio_English_AAC');
    expect(result).toContain('Ch01_Verses_01-03.m4a');
  });
});

describe('getAlignedDataPath', () => {
  it('returns _aligned.json path', () => {
    const result = getAlignedDataPath(makeSnippet('1.01 - 1.03'), 'hi');
    expect(result).toContain('Ch01_Verses_01-03_aligned.json');
  });
});
