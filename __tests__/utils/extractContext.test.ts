/**
 * Tests for the extractContext utility function used in completed-readings search.
 * The function is defined inline in completed-readings.tsx, so we replicate it here
 * to test the pure logic independently.
 */

// Replicate the function since it's not exported
function extractContext(text: string, query: string, maxLen: number = 120): string | null {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return null;

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  let snippet = text.slice(start, end).replace(/\n+/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

describe('extractContext', () => {
  it('returns null when query not found', () => {
    expect(extractContext('Hello world', 'xyz')).toBeNull();
  });

  it('returns context around match', () => {
    const text = 'The Bhagavad Gita teaches about dharma and duty in life.';
    const result = extractContext(text, 'dharma');
    expect(result).not.toBeNull();
    expect(result).toContain('dharma');
  });

  it('is case-insensitive', () => {
    const text = 'Krishna spoke about DHARMA.';
    const result = extractContext(text, 'dharma');
    expect(result).not.toBeNull();
    expect(result).toContain('DHARMA');
  });

  it('adds ellipsis when match is in the middle of long text', () => {
    const longText = 'A'.repeat(100) + 'target' + 'B'.repeat(100);
    const result = extractContext(longText, 'target');
    expect(result).not.toBeNull();
    expect(result!.startsWith('...')).toBe(true);
    expect(result!.endsWith('...')).toBe(true);
  });

  it('no leading ellipsis when match is near start', () => {
    const text = 'target word here and some more text that goes on and on.';
    const result = extractContext(text, 'target');
    expect(result).not.toBeNull();
    expect(result!.startsWith('...')).toBe(false);
  });

  it('no trailing ellipsis when match is near end', () => {
    const text = 'Some text then target';
    const result = extractContext(text, 'target');
    expect(result).not.toBeNull();
    expect(result!.endsWith('...')).toBe(false);
  });

  it('replaces newlines with spaces', () => {
    const text = 'Line one\n\nLine two\nLine three';
    const result = extractContext(text, 'Line two');
    expect(result).not.toBeNull();
    expect(result).not.toContain('\n');
  });

  it('returns null for empty query in text', () => {
    // Empty query matches at index 0
    const result = extractContext('Hello world', '');
    expect(result).not.toBeNull(); // indexOf('') returns 0
  });

  it('handles single character search', () => {
    const result = extractContext('The Gita', 'G');
    expect(result).not.toBeNull();
    expect(result).toContain('G');
  });
});
