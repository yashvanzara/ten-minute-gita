import { en } from './en';
import { hi } from './hi';

export type Language = 'en' | 'hi';
export type TranslationKey = keyof typeof en;

const translations = { en, hi } as const;

export function getTranslation(language: Language, key: string, params?: Record<string, string | number>): string | string[] {
  const dict = translations[language] as unknown as Record<string, string | string[]>;
  let value = dict[key];
  if (value === undefined) {
    // Fallback to English
    value = (translations.en as unknown as Record<string, string | string[]>)[key];
  }
  if (value === undefined) return key;
  if (Array.isArray(value)) return value;
  if (params) {
    let result = value as string;
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    }
    return result;
  }
  return value;
}

export default translations;
