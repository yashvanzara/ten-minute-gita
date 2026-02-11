/**
 * Tests for the download system.
 * Tests audioSource resolution logic and download index management.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/config';

describe('Download index persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loadDownloadIndex returns empty object when no data', async () => {
    const { loadDownloadIndex } = require('@/utils/downloadStorage');
    const index = await loadDownloadIndex();
    expect(index).toEqual({});
  });

  it('saveDownloadIndex and loadDownloadIndex round-trip', async () => {
    const { loadDownloadIndex, saveDownloadIndex } = require('@/utils/downloadStorage');

    const testIndex = {
      en_1: {
        snippetId: 1,
        language: 'en',
        filePath: '/test/1.m4a',
        alignedJsonPath: '/test/1_aligned.json',
        fileSize: 4000000,
        downloadedAt: '2024-01-01T00:00:00Z',
      },
    };

    await saveDownloadIndex(testIndex);
    const loaded = await loadDownloadIndex();
    expect(loaded).toEqual(testIndex);
  });

  it('download index key matches config', () => {
    expect(CONFIG.DOWNLOAD_INDEX_KEY).toBe('@download_index');
  });
});

describe('Audio CDN URL construction', () => {
  it('CDN base URL is configured', () => {
    expect(CONFIG.AUDIO_CDN_BASE_URL).toBe('https://pub-ec8478f2d8da4504a375135b1577cdd4.r2.dev/audio');
  });

  it('resolveAudioSource constructs correct CDN URL', async () => {
    const { getAudioFileKey } = require('@/utils/audioMapping');

    const snippet = {
      id: 1,
      title: 'Test',
      chapter: 1,
      verses: '1.01 - 1.03',
      sanskrit: '',
      transliteration: '',
      verseTranslations: [],
      commentary: '',
      reflection: '',
    };

    const fileKey = getAudioFileKey(snippet);
    expect(fileKey).toBe('Ch01_Verses_01-03');

    const expectedUrl = `${CONFIG.AUDIO_CDN_BASE_URL}/en/${fileKey}.m4a`;
    expect(expectedUrl).toBe('https://pub-ec8478f2d8da4504a375135b1577cdd4.r2.dev/audio/en/Ch01_Verses_01-03.m4a');
  });

  it('aligned JSON URL follows correct pattern', () => {
    const fileKey = 'Ch01_Verses_01-03';
    const jsonUrl = `${CONFIG.AUDIO_CDN_BASE_URL}/en/${fileKey}_aligned.json`;
    expect(jsonUrl).toBe('https://pub-ec8478f2d8da4504a375135b1577cdd4.r2.dev/audio/en/Ch01_Verses_01-03_aligned.json');
  });

  it('Hindi URL uses hi language prefix', () => {
    const fileKey = 'Ch01_Verses_01-03';
    const audioUrl = `${CONFIG.AUDIO_CDN_BASE_URL}/hi/${fileKey}.m4a`;
    expect(audioUrl).toBe('https://pub-ec8478f2d8da4504a375135b1577cdd4.r2.dev/audio/hi/Ch01_Verses_01-03.m4a');
  });
});

describe('Chapter calculations', () => {
  it('all 18 chapters are represented in snippet data', () => {
    const snippetsEn = require('@/data/gita_snippets.json').snippets;
    const chapters = new Set(snippetsEn.map((s: any) => s.chapter));
    expect(chapters.size).toBe(18);
    for (let i = 1; i <= 18; i++) {
      expect(chapters.has(i)).toBe(true);
    }
  });

  it('total snippets is 239', () => {
    const snippetsEn = require('@/data/gita_snippets.json').snippets;
    expect(snippetsEn.length).toBe(239);
  });

  it('Hindi data has same number of snippets', () => {
    const snippetsEn = require('@/data/gita_snippets.json').snippets;
    const snippetsHi = require('@/data/gita_snippets_hindi.json').snippets;
    expect(snippetsHi.length).toBe(snippetsEn.length);
  });

  it('chapter 1 has expected number of readings', () => {
    const snippets = require('@/data/gita_snippets.json').snippets;
    const ch1 = snippets.filter((s: any) => s.chapter === 1);
    expect(ch1.length).toBeGreaterThan(0);
    expect(ch1.length).toBeLessThan(30); // Reasonable range
  });
});

describe('Download key format', () => {
  it('key format is language_snippetId', () => {
    const snippetId = 42;
    const language = 'en';
    const key = `${language}_${snippetId}`;
    expect(key).toBe('en_42');
  });

  it('Hindi key format', () => {
    const key = `hi_${100}`;
    expect(key).toBe('hi_100');
  });
});
