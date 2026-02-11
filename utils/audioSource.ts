import { File } from 'expo-file-system';
import { Snippet } from '@/types';
import { AlignedData } from '@/types/audio';
import { getAudioFileKey, getAudioFilePath, getAlignedDataPath } from './audioMapping';
import { getLocalAudioPath, getLocalAlignedJsonPath } from './downloadStorage';
import { CONFIG } from '@/constants/config';

// In-memory cache for aligned JSON data fetched from CDN
const alignedJsonCache: Record<string, AlignedData> = {};

/**
 * Resolve the audio URI for a snippet.
 * Priority: 1. Local download, 2. Local dev file (in __DEV__), 3. CDN URL
 */
export async function resolveAudioSource(
  snippet: Snippet,
  language: 'en' | 'hi',
): Promise<{ uri: string; isLocal: boolean }> {
  // 1. Check local download
  const localPath = await getLocalAudioPath(snippet.id, language);
  if (localPath) {
    return { uri: localPath, isLocal: true };
  }

  // 2. In development, use local filesystem audio files
  if (__DEV__) {
    const devPath = getAudioFilePath(snippet, language);
    return { uri: devPath, isLocal: true };
  }

  // 3. CDN URL (production only)
  const fileKey = getAudioFileKey(snippet);
  const cdnUri = `${CONFIG.AUDIO_CDN_BASE_URL}/${language}/${fileKey}.m4a`;
  return { uri: cdnUri, isLocal: false };
}

/**
 * Resolve aligned JSON data for a snippet.
 * Priority: 1. Local download, 2. In-memory cache, 3. Local dev file (in __DEV__), 4. CDN fetch
 */
export async function resolveAlignedJson(
  snippet: Snippet,
  language: 'en' | 'hi',
): Promise<AlignedData> {
  const cacheKey = `${language}_${snippet.id}`;

  // 1. Check local download
  const localPath = await getLocalAlignedJsonPath(snippet.id, language);
  if (localPath) {
    const file = new File(localPath);
    const content = await file.text();
    const data = JSON.parse(content) as AlignedData;
    alignedJsonCache[cacheKey] = data;
    return data;
  }

  // 2. Check in-memory cache
  if (alignedJsonCache[cacheKey]) {
    return alignedJsonCache[cacheKey];
  }

  // 3. In development, load from local dev filesystem first (avoid CDN dependency)
  if (__DEV__) {
    const devPath = getAlignedDataPath(snippet, language);
    const devResponse = await fetch(`file://${devPath}`);
    if (devResponse.ok) {
      const data = await devResponse.json() as AlignedData;
      alignedJsonCache[cacheKey] = data;
      return data;
    }
  }

  // 4. Fetch from CDN (production, or dev fallback if dev file missing)
  const fileKey = getAudioFileKey(snippet);
  const cdnUrl = `${CONFIG.AUDIO_CDN_BASE_URL}/${language}/${fileKey}_aligned.json`;
  try {
    const response = await fetch(cdnUrl);
    if (response.ok) {
      const data = await response.json() as AlignedData;
      alignedJsonCache[cacheKey] = data;
      return data;
    }
  } catch {
    // CDN fetch failed
  }

  throw new Error(`Failed to load aligned data for snippet ${snippet.id}: no local download, dev file, or CDN available`);
}

/**
 * Legacy audio source interface - still used by AudioPlayerContext.
 * Now delegates to the async resolution functions.
 */
export interface AudioSource {
  getAudioUri(snippet: Snippet, language: 'en' | 'hi'): string;
  getAlignedData(snippet: Snippet, language: 'en' | 'hi'): Promise<AlignedData>;
}

class HybridAudioSource implements AudioSource {
  /**
   * Synchronous URI for immediate use.
   * In dev, returns local filesystem path. In production, returns CDN URL.
   */
  getAudioUri(snippet: Snippet, language: 'en' | 'hi'): string {
    if (__DEV__) {
      return getAudioFilePath(snippet, language);
    }
    const fileKey = getAudioFileKey(snippet);
    return `${CONFIG.AUDIO_CDN_BASE_URL}/${language}/${fileKey}.m4a`;
  }

  async getAlignedData(snippet: Snippet, language: 'en' | 'hi'): Promise<AlignedData> {
    return resolveAlignedJson(snippet, language);
  }
}

export const audioSource: AudioSource = new HybridAudioSource();
