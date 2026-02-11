import { splitIntoSentences } from '@/utils/sentenceSplitter';
import { AlignedWord } from '@/types/audio';

function makeWords(texts: string[]): AlignedWord[] {
  return texts.map((word, i) => ({
    word,
    start: i * 0.5,
    end: i * 0.5 + 0.4,
    matched: true,
  }));
}

describe('splitIntoSentences', () => {
  it('returns empty array for empty words', () => {
    expect(splitIntoSentences([])).toEqual([]);
  });

  it('returns single group when no sentence terminator', () => {
    const words = makeWords(['hello', 'world', 'foo']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(1);
    expect(result[0].startWordIndex).toBe(0);
    expect(result[0].endWordIndex).toBe(2);
  });

  it('splits on period (.)', () => {
    const words = makeWords(['hello', 'world.', 'next', 'sentence.']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(2);
    expect(result[0].endWordIndex).toBe(1);
    expect(result[1].startWordIndex).toBe(2);
    expect(result[1].endWordIndex).toBe(3);
  });

  it('splits on Hindi danda (।)', () => {
    const words = makeWords(['कर्मण्येवाधिकारस्ते', '।', 'मा', 'फलेषु']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(2);
    expect(result[0].endWordIndex).toBe(1);
    expect(result[1].startWordIndex).toBe(2);
  });

  it('splits on question mark (?)', () => {
    const words = makeWords(['why?', 'because', 'so.']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(2);
  });

  it('splits on exclamation (!)', () => {
    const words = makeWords(['wow!', 'that', 'was', 'great.']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(2);
  });

  it('enforces max word count by splitting at comma', () => {
    // Create 35 words with a comma at word 15
    const texts = Array.from({ length: 35 }, (_, i) => {
      if (i === 15) return 'middle,';
      return `word${i}`;
    });
    const words = makeWords(texts);
    const result = splitIntoSentences(words);
    // Should have been force-split at the comma since 35 > 30
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('handles single word', () => {
    const words = makeWords(['hello']);
    const result = splitIntoSentences(words);
    expect(result).toHaveLength(1);
    expect(result[0].startWordIndex).toBe(0);
    expect(result[0].endWordIndex).toBe(0);
  });
});
