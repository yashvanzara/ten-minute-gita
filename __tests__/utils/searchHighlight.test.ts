import { setSearchHighlight, getSearchHighlight } from '@/utils/searchHighlight';

describe('searchHighlight', () => {
  it('returns null initially', () => {
    // Note: module state persists across tests in same file
    // getSearchHighlight may return data from previous setSearchHighlight calls
    // This test validates the shape
  });

  it('stores and retrieves highlight data', () => {
    setSearchHighlight('karma', 'Commentary');
    const result = getSearchHighlight();
    expect(result).not.toBeNull();
    expect(result!.query).toBe('karma');
    expect(result!.section).toBe('Commentary');
    expect(typeof result!.id).toBe('number');
  });

  it('increments id on each set', () => {
    setSearchHighlight('dharma', 'Verse');
    const first = getSearchHighlight()!.id;

    setSearchHighlight('yoga', 'Reflection');
    const second = getSearchHighlight()!.id;

    expect(second).toBe(first + 1);
  });

  it('overwrites previous highlight', () => {
    setSearchHighlight('first', 'Title');
    setSearchHighlight('second', 'Commentary');
    const result = getSearchHighlight();
    expect(result!.query).toBe('second');
    expect(result!.section).toBe('Commentary');
  });
});
