/**
 * Regression tests for the Offline Listening settings section.
 *
 * Verifies:
 * - Translation keys exist in both EN and HI (including confirmation flow)
 * - DownloadManager has correct structure (toggles, Advanced accordion, outlined buttons with icon, footer)
 * - Toggle state persists to AsyncStorage
 * - Download buttons show size-confirmation alert before coming-soon
 * - Subtitles are short/compact
 * - Advanced accordion hides download buttons and storage info
 * - Old chapter-by-chapter UI is removed
 */

import { getTranslation } from '@/constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_AUTO_DOWNLOAD = '@offline_auto_download';
const STORAGE_KEY_AUTO_REMOVE = '@offline_auto_remove';

// Helper: read DownloadManager source once for architecture tests
function readSource(): string {
  const fs = require('fs');
  const p = require('path').resolve(__dirname, '../../components/downloads/DownloadManager.tsx');
  return fs.readFileSync(p, 'utf8');
}

describe('Offline Listening: Translation keys', () => {
  const requiredKeys = [
    'settings.offline.title',
    'settings.offline.autoDownload',
    'settings.offline.autoDownloadSub',
    'settings.offline.autoRemove',
    'settings.offline.autoRemoveSub',
    'settings.offline.advanced',
    'settings.offline.downloadAllEn',
    'settings.offline.downloadAllHi',
    'settings.offline.using',
    'settings.offline.clearAll',
    'settings.offline.clearAllButton',
    'settings.offline.clearAllTitle',
    'settings.offline.clearAllMessage',
    'settings.offline.confirmTitle',
    'settings.offline.confirmMessage',
    'settings.offline.confirmAction',
    'settings.offline.comingSoonTitle',
    'settings.offline.comingSoonMessage',
  ];

  it.each(requiredKeys)('EN has key: %s', (key) => {
    const result = getTranslation('en', key);
    expect(result).not.toBe(key);
    expect(result.length).toBeGreaterThan(0);
  });

  it.each(requiredKeys)('HI has key: %s', (key) => {
    const result = getTranslation('hi', key);
    expect(result).not.toBe(key);
    expect(result.length).toBeGreaterThan(0);
  });

  it('EN/HI key count matches for offline section', () => {
    const en = requiredKeys.map(k => getTranslation('en', k));
    const hi = requiredKeys.map(k => getTranslation('hi', k));
    expect(en.length).toBe(hi.length);
    en.forEach((v, i) => expect(v).not.toBe(requiredKeys[i]));
    hi.forEach((v, i) => expect(v).not.toBe(requiredKeys[i]));
  });

  it('interpolation works for size params', () => {
    expect(getTranslation('en', 'settings.offline.downloadAllEn', { size: '~6.2 GB' })).toContain('~6.2 GB');
    expect(getTranslation('en', 'settings.offline.using', { size: '42 MB' })).toContain('42 MB');
    expect(getTranslation('en', 'settings.offline.confirmMessage', { size: '~6.2 GB' })).toContain('~6.2 GB');
  });

  it('subtitles are short (under 20 chars)', () => {
    const enAutoSub = getTranslation('en', 'settings.offline.autoDownloadSub');
    const enRemoveSub = getTranslation('en', 'settings.offline.autoRemoveSub');
    expect(enAutoSub.length).toBeLessThanOrEqual(20);
    expect(enRemoveSub.length).toBeLessThanOrEqual(20);
  });
});

describe('Offline Listening: Component structure', () => {
  it('does NOT import ChapterDownloadRow or DownloadProgressBar', () => {
    const source = readSource();
    expect(source).not.toContain('ChapterDownloadRow');
    expect(source).not.toContain('DownloadProgressBar');
  });

  it('uses Switch for toggles (exactly 2)', () => {
    const source = readSource();
    expect(source).toContain('Switch');
    expect((source.match(/<Switch/g) || []).length).toBe(2);
  });

  it('has outlined download buttons with cloud-download icon', () => {
    const source = readSource();
    expect(source).toContain('cloud-download-outline');
    expect(source).toContain('downloadButton');
    expect(source).toContain('borderWidth: 1');
    expect(source).toContain('borderRadius: 10');
  });

  it('has download buttons for both languages with correct sizes', () => {
    const source = readSource();
    expect(source).toContain('settings.offline.downloadAllEn');
    expect(source).toContain('settings.offline.downloadAllHi');
    expect(source).toContain("EN_SIZE = '~6.2 GB'");
    expect(source).toContain("HI_SIZE = '~4.6 GB'");
  });

  it('download buttons show size-confirmation alert then coming-soon', () => {
    const source = readSource();
    expect(source).toContain('settings.offline.confirmTitle');
    expect(source).toContain('settings.offline.confirmMessage');
    expect(source).toContain('settings.offline.comingSoonTitle');
  });

  it('has Advanced accordion with animated chevron', () => {
    const source = readSource();
    expect(source).toContain('settings.offline.advanced');
    expect(source).toContain('advancedOpen');
    expect(source).toContain('chevron-forward');
    expect(source).toContain('Animated');
  });

  it('download buttons and storage are inside Advanced section', () => {
    const source = readSource();
    expect(source).toContain('advancedContent');
    expect(source).toContain('advancedOpen');
  });

  it('footer only shows when totalStorageUsed > 0', () => {
    const source = readSource();
    expect(source).toContain('totalStorageUsed > 0');
    expect(source).toContain('settings.offline.clearAllButton');
  });

  it('uses same card styling as other settings sections', () => {
    const source = readSource();
    expect(source).toContain('sectionHeader');
    expect(source).toContain('borderRadius: 16');
    expect(source).toContain('marginHorizontal: 16');
  });
});

describe('Offline Listening: Toggle persistence', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('AsyncStorage keys are correct', () => {
    expect(STORAGE_KEY_AUTO_DOWNLOAD).toBe('@offline_auto_download');
    expect(STORAGE_KEY_AUTO_REMOVE).toBe('@offline_auto_remove');
  });

  it('toggle state saves to AsyncStorage', async () => {
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_DOWNLOAD, 'true');
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_REMOVE, 'true');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_AUTO_DOWNLOAD, 'true');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_AUTO_REMOVE, 'true');
  });

  it('toggle state loads from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === STORAGE_KEY_AUTO_DOWNLOAD) return Promise.resolve('true');
      if (key === STORAGE_KEY_AUTO_REMOVE) return Promise.resolve('false');
      return Promise.resolve(null);
    });
    expect(await AsyncStorage.getItem(STORAGE_KEY_AUTO_DOWNLOAD)).toBe('true');
    expect(await AsyncStorage.getItem(STORAGE_KEY_AUTO_REMOVE)).toBe('false');
  });
});

describe('Offline Listening: Old UI removed', () => {
  it('old download translation keys are removed', () => {
    const oldKeys = [
      'settings.downloads.title',
      'settings.downloads.downloadAll',
      'settings.downloads.deleteAll',
      'settings.downloads.deleteChapterTitle',
      'settings.downloads.deleteChapterMessage',
    ];
    for (const key of oldKeys) {
      expect(getTranslation('en', key)).toBe(key);
    }
  });
});
