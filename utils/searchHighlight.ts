// Global store for search highlight state.
// Set before navigating, read on mount in reading screen.

let _query: string | null = null;
let _section: string | null = null;
let _id: number = 0;

export function setSearchHighlight(query: string, section: string) {
  _query = query;
  _section = section;
  _id++;
}

/** Returns current highlight data and its unique id. Never expires, never auto-clears. */
export function getSearchHighlight(): { query: string; section: string; id: number } | null {
  if (_query && _section) {
    return { query: _query, section: _section, id: _id };
  }
  return null;
}
