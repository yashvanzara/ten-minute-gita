import { Paths, Directory, File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/config';
import { DownloadedReading } from '@/types/downloads';
import { getAudioFileKey } from '@/utils/audioMapping';
import { Snippet } from '@/types';

function getDownloadDir(language: string): Directory {
  return new Directory(Paths.document, `audio/${language}`);
}

function getLocalFilePath(snippetId: number, language: string, ext: string): string {
  const dir = getDownloadDir(language);
  return `${dir.uri}${snippetId}${ext}`;
}

export async function getLocalAudioPath(snippetId: number, language: string): Promise<string | null> {
  const path = getLocalFilePath(snippetId, language, '.m4a');
  const file = new File(path);
  return file.exists ? path : null;
}

export async function getLocalAlignedJsonPath(snippetId: number, language: string): Promise<string | null> {
  const path = getLocalFilePath(snippetId, language, '_aligned.json');
  const file = new File(path);
  return file.exists ? path : null;
}

export async function downloadReading(
  snippet: Snippet,
  language: string,
  onProgress?: (progress: number) => void,
): Promise<DownloadedReading> {
  const dir = getDownloadDir(language);
  dir.create();

  const fileKey = getAudioFileKey(snippet);
  const baseUrl = CONFIG.AUDIO_CDN_BASE_URL;

  const audioUrl = `${baseUrl}/${language}/${fileKey}.m4a`;
  const jsonUrl = `${baseUrl}/${language}/${fileKey}_aligned.json`;
  const audioPath = getLocalFilePath(snippet.id, language, '.m4a');
  const jsonPath = getLocalFilePath(snippet.id, language, '_aligned.json');

  // Download audio file
  onProgress?.(0);
  const audioOutput = new File(audioPath);
  await File.downloadFileAsync(audioUrl, audioOutput);
  onProgress?.(0.9);

  // Download aligned JSON
  const jsonOutput = new File(jsonPath);
  await File.downloadFileAsync(jsonUrl, jsonOutput);
  onProgress?.(1.0);

  const fileSize = audioOutput.size ?? 0;

  return {
    snippetId: snippet.id,
    language: language as 'en' | 'hi',
    filePath: audioPath,
    alignedJsonPath: jsonPath,
    fileSize,
    downloadedAt: new Date().toISOString(),
  };
}

export async function deleteReading(snippetId: number, language: string): Promise<void> {
  const audioPath = getLocalFilePath(snippetId, language, '.m4a');
  const jsonPath = getLocalFilePath(snippetId, language, '_aligned.json');
  const audioFile = new File(audioPath);
  if (audioFile.exists) audioFile.delete();
  const jsonFile = new File(jsonPath);
  if (jsonFile.exists) jsonFile.delete();
}

export async function deleteAllDownloads(language: string): Promise<void> {
  const dir = getDownloadDir(language);
  if (dir.exists) {
    dir.delete();
  }
}

export async function getStorageUsed(): Promise<number> {
  let total = 0;
  for (const lang of ['en', 'hi']) {
    const dir = getDownloadDir(lang);
    if (!dir.exists) continue;
    const entries = dir.list();
    for (const entry of entries) {
      if (entry instanceof File) {
        total += entry.size ?? 0;
      }
    }
  }
  return total;
}

export async function loadDownloadIndex(): Promise<Record<string, DownloadedReading>> {
  try {
    const data = await AsyncStorage.getItem(CONFIG.DOWNLOAD_INDEX_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveDownloadIndex(index: Record<string, DownloadedReading>): Promise<void> {
  try {
    await AsyncStorage.setItem(CONFIG.DOWNLOAD_INDEX_KEY, JSON.stringify(index));
  } catch {
    // Storage write not critical
  }
}
