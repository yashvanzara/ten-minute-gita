import { useMemo } from 'react';
import snippetsData from '@/data/gita_snippets.json';
import { Snippet } from '@/types';

export function useSnippets() {
  const snippets = useMemo(() => {
    return snippetsData.snippets as Snippet[];
  }, []);

  const getSnippet = (id: number): Snippet | undefined => {
    return snippets.find((s) => s.id === id);
  };

  const getNextSnippet = (currentId: number): Snippet | undefined => {
    return snippets.find((s) => s.id === currentId + 1);
  };

  const getPrevSnippet = (currentId: number): Snippet | undefined => {
    return snippets.find((s) => s.id === currentId - 1);
  };

  return {
    snippets,
    getSnippet,
    getNextSnippet,
    getPrevSnippet,
    totalCount: snippets.length,
  };
}
