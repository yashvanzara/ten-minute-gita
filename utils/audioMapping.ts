import { Snippet } from '@/types';

/**
 * Parses snippet.verses ("1.01 - 1.03") into audio file key ("Ch01_Verses_01-03").
 */
export function getAudioFileKey(snippet: Snippet): string {
  const versesStr = snippet.verses.trim();
  // Parse "1.01 - 1.03" or "18.76 - 18.78"
  const match = versesStr.match(/^(\d+)\.(\d+)\s*-\s*\d+\.(\d+)$/);
  if (!match) {
    // Fallback: try single verse "2.47"
    const singleMatch = versesStr.match(/^(\d+)\.(\d+)$/);
    if (singleMatch) {
      const ch = singleMatch[1].padStart(2, '0');
      const v = singleMatch[2].padStart(2, '0');
      return `Ch${ch}_Verses_${v}-${v}`;
    }
    throw new Error(`Cannot parse verses string: "${versesStr}" for snippet ${snippet.id}`);
  }
  const chapter = match[1].padStart(2, '0');
  const startVerse = match[2].padStart(2, '0');
  const endVerse = match[3].padStart(2, '0');
  return `Ch${chapter}_Verses_${startVerse}-${endVerse}`;
}

/**
 * Returns the full filesystem path to the M4A/AAC audio file.
 * For local dev — swap this function body for CDN URLs later.
 */
export function getAudioFilePath(snippet: Snippet, language: 'en' | 'hi'): string {
  const key = getAudioFileKey(snippet);
  const dir = language === 'hi' ? 'Audio_Hindi_AAC' : 'Audio_English_AAC';
  return `/Users/anishmoonka/Desktop/gita_podcast/${dir}/${key}.m4a`;
}

/**
 * Returns the full filesystem path to the aligned JSON file.
 */
export function getAlignedDataPath(snippet: Snippet, language: 'en' | 'hi'): string {
  const key = getAudioFileKey(snippet);
  const dir = language === 'hi' ? 'Audio_Hindi' : 'Audio_English';
  return `/Users/anishmoonka/Desktop/gita_podcast/${dir}/${key}_aligned.json`;
}
