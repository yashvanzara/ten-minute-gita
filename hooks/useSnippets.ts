import { useMemo } from 'react';
import snippetsDataEn from '@/data/gita_snippets.json';
import snippetsDataHi from '@/data/gita_snippets_hindi.json';
import { Snippet } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export function useSnippets() {
  const { language } = useLanguage();

  const snippets = useMemo(() => {
    const data = language === 'hi' ? snippetsDataHi : snippetsDataEn;
    return data.snippets as Snippet[];
  }, [language]);

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
