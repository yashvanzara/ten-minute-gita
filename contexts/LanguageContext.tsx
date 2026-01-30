import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';
import { Language, getTranslation } from '@/constants/translations';
import { CONFIG } from '@/constants/config';

const STORAGE_KEY = CONFIG.LANGUAGE_KEY;

/** Returns a font size bumped ~12% for Hindi (Devanagari needs more space) */
export function hiFontSize(base: number, language: Language): number {
  return language === 'hi' ? Math.round(base * 1.12) : base;
}

/** Returns line height suitable for language (Hindi vowel marks need more vertical space) */
export function hiLineHeight(fontSize: number, language: Language): number {
  return Math.round(fontSize * (language === 'hi' ? 1.6 : 1.4));
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
  fadeAnim: Animated.Value;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  tArray: () => [],
  fadeAnim: new Animated.Value(1),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'hi') {
        setLanguageState(stored);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setLanguageState(lang);
      AsyncStorage.setItem(STORAGE_KEY, lang);
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const result = getTranslation(language, key, params);
    return Array.isArray(result) ? result.join(', ') : result;
  }, [language]);

  const tArray = useCallback((key: string): string[] => {
    const result = getTranslation(language, key);
    return Array.isArray(result) ? result : [result];
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tArray, fadeAnim }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
