import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnippets } from '@/hooks/useSnippets';
import { useLanguage } from '@/contexts/LanguageContext';
import { DownloadedReading, ChapterDownloadInfo, DownloadState } from '@/types/downloads';
import {
  downloadReading as downloadReadingFile,
  deleteReading as deleteReadingFile,
  deleteAllDownloads as deleteAllFiles,
  loadDownloadIndex,
  saveDownloadIndex,
  getStorageUsed,
} from '@/utils/downloadStorage';

const CHAPTER_TITLES: Record<number, { en: string; hi: string }> = {
  1: { en: "Arjuna's Dilemma", hi: 'अर्जुन विषाद' },
  2: { en: 'Transcendent Knowledge', hi: 'सांख्य योग' },
  3: { en: 'Path of Action', hi: 'कर्म योग' },
  4: { en: 'Path of Wisdom', hi: 'ज्ञान कर्म संन्यास योग' },
  5: { en: 'Path of Renunciation', hi: 'कर्म संन्यास योग' },
  6: { en: 'Path of Meditation', hi: 'आत्मसंयम योग' },
  7: { en: 'Knowledge & Realization', hi: 'ज्ञान विज्ञान योग' },
  8: { en: 'The Imperishable Absolute', hi: 'अक्षर ब्रह्म योग' },
  9: { en: 'Royal Knowledge', hi: 'राजविद्या राजगुह्य योग' },
  10: { en: 'Divine Manifestations', hi: 'विभूति योग' },
  11: { en: 'Universal Form', hi: 'विश्वरूप दर्शन योग' },
  12: { en: 'Path of Devotion', hi: 'भक्ति योग' },
  13: { en: 'Field & Knower', hi: 'क्षेत्र क्षेत्रज्ञ विभाग योग' },
  14: { en: 'Three Gunas', hi: 'गुणत्रय विभाग योग' },
  15: { en: 'Supreme Person', hi: 'पुरुषोत्तम योग' },
  16: { en: 'Divine & Demonic', hi: 'दैवासुर सम्पद विभाग योग' },
  17: { en: 'Three Divisions of Faith', hi: 'श्रद्धात्रय विभाग योग' },
  18: { en: 'Liberation Through Renunciation', hi: 'मोक्ष संन्यास योग' },
};

export function useDownloadManager() {
  const { snippets: allSnippets, getSnippet } = useSnippets();
  const { language } = useLanguage();
  const [state, setState] = useState<DownloadState>({
    downloads: {},
    activeDownloads: {},
    totalStorageUsed: 0,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load download index on mount
  useEffect(() => {
    (async () => {
      const index = await loadDownloadIndex();
      const storage = await getStorageUsed();
      if (mountedRef.current) {
        setState(prev => ({ ...prev, downloads: index, totalStorageUsed: storage }));
      }
    })();
  }, []);

  const getChapterInfo = useCallback(
    (lang: 'en' | 'hi'): ChapterDownloadInfo[] => {
      const snippets = allSnippets;
      const chapterMap = new Map<number, { total: number; downloaded: number; downloadedSize: number }>();

      for (const snippet of snippets) {
        const ch = snippet.chapter;
        if (!chapterMap.has(ch)) {
          chapterMap.set(ch, { total: 0, downloaded: 0, downloadedSize: 0 });
        }
        const info = chapterMap.get(ch)!;
        info.total++;

        const key = `${lang}_${snippet.id}`;
        if (state.downloads[key]) {
          info.downloaded++;
          info.downloadedSize += state.downloads[key].fileSize;
        }
      }

      const chapters: ChapterDownloadInfo[] = [];
      for (const [chapterNumber, info] of chapterMap.entries()) {
        const titles = CHAPTER_TITLES[chapterNumber];
        chapters.push({
          chapterNumber,
          chapterTitle: titles ? titles[lang] : `Chapter ${chapterNumber}`,
          totalReadings: info.total,
          downloadedReadings: info.downloaded,
          totalSize: info.total * 4_000_000, // ~4MB estimate per reading
          downloadedSize: info.downloadedSize,
        });
      }

      return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    },
    [allSnippets, state.downloads],
  );

  const downloadSingleReading = useCallback(
    async (snippetId: number, lang?: string) => {
      const l = (lang || language) as 'en' | 'hi';
      const snippet = getSnippet(snippetId);
      if (!snippet) return;

      const key = `${l}_${snippetId}`;
      setState(prev => ({
        ...prev,
        activeDownloads: { ...prev.activeDownloads, [key]: 0 },
      }));

      try {
        const result = await downloadReadingFile(snippet, l, (progress) => {
          if (mountedRef.current) {
            setState(prev => ({
              ...prev,
              activeDownloads: { ...prev.activeDownloads, [key]: progress },
            }));
          }
        });

        const newIndex = { ...state.downloads, [key]: result };
        await saveDownloadIndex(newIndex);
        const storage = await getStorageUsed();

        if (mountedRef.current) {
          setState(prev => {
            const { [key]: _, ...restActive } = prev.activeDownloads;
            return {
              downloads: newIndex,
              activeDownloads: restActive,
              totalStorageUsed: storage,
            };
          });
        }
      } catch {
        if (mountedRef.current) {
          setState(prev => {
            const { [key]: _, ...restActive } = prev.activeDownloads;
            return { ...prev, activeDownloads: restActive };
          });
        }
      }
    },
    [language, allSnippets, state.downloads],
  );

  const downloadChapter = useCallback(
    async (chapterNumber: number, lang?: string) => {
      const l = (lang || language) as 'en' | 'hi';
      const snippets = allSnippets.filter(s => s.chapter === chapterNumber);

      for (const snippet of snippets) {
        const key = `${l}_${snippet.id}`;
        if (state.downloads[key]) continue; // Already downloaded
        await downloadSingleReading(snippet.id, l);
      }
    },
    [language, allSnippets, state.downloads, downloadSingleReading],
  );

  const deleteSingleReading = useCallback(
    async (snippetId: number, lang?: string) => {
      const l = (lang || language) as 'en' | 'hi';
      const key = `${l}_${snippetId}`;

      await deleteReadingFile(snippetId, l);
      const { [key]: _, ...rest } = state.downloads;
      await saveDownloadIndex(rest);
      const storage = await getStorageUsed();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          downloads: rest,
          totalStorageUsed: storage,
        }));
      }
    },
    [language, state.downloads],
  );

  const deleteChapter = useCallback(
    async (chapterNumber: number, lang?: string) => {
      const l = (lang || language) as 'en' | 'hi';
      const snippets = allSnippets.filter(s => s.chapter === chapterNumber);

      let newDownloads = { ...state.downloads };
      for (const snippet of snippets) {
        const key = `${l}_${snippet.id}`;
        await deleteReadingFile(snippet.id, l);
        delete newDownloads[key];
      }
      await saveDownloadIndex(newDownloads);
      const storage = await getStorageUsed();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          downloads: newDownloads,
          totalStorageUsed: storage,
        }));
      }
    },
    [language, allSnippets, state.downloads],
  );

  const deleteAll = useCallback(
    async (lang?: string) => {
      const l = (lang || language) as 'en' | 'hi';
      await deleteAllFiles(l);

      const newDownloads = { ...state.downloads };
      for (const key of Object.keys(newDownloads)) {
        if (key.startsWith(`${l}_`)) {
          delete newDownloads[key];
        }
      }
      await saveDownloadIndex(newDownloads);
      const storage = await getStorageUsed();

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          downloads: newDownloads,
          totalStorageUsed: storage,
        }));
      }
    },
    [language, state.downloads],
  );

  const isDownloaded = useCallback(
    (snippetId: number, lang?: string): boolean => {
      const l = lang || language;
      return !!state.downloads[`${l}_${snippetId}`];
    },
    [language, state.downloads],
  );

  const getDownloadProgress = useCallback(
    (snippetId: number, lang?: string): number | null => {
      const l = lang || language;
      const key = `${l}_${snippetId}`;
      return key in state.activeDownloads ? state.activeDownloads[key] : null;
    },
    [language, state.activeDownloads],
  );

  return {
    downloads: state.downloads,
    activeDownloads: state.activeDownloads,
    totalStorageUsed: state.totalStorageUsed,
    getChapterInfo,
    downloadSingleReading,
    downloadChapter,
    deleteSingleReading,
    deleteChapter,
    deleteAll,
    isDownloaded,
    getDownloadProgress,
  };
}
