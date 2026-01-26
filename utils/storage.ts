import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, Settings, TOTAL_SNIPPETS } from '@/types';

const STORAGE_KEY = '@gita_app_progress';

export const defaultSettings: Settings = {
  fontSize: 18,
  darkMode: 'system',
  notificationTime: '07:00',
  notificationsEnabled: false,
  showSanskrit: true,
  showTransliteration: true,
  showTranslation: true,
};

export const defaultProgress: UserProgress = {
  currentSnippet: 1,
  completedSnippets: [],
  streak: {
    current: 0,
    longest: 0,
    lastReadDate: null,
    freezesAvailable: 1,
    freezeUsedThisWeek: false,
  },
  settings: defaultSettings,
  readingHistory: {},
};

export const saveProgress = async (progress: UserProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const loadProgress = async (): Promise<UserProgress> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);

      // Migrate old boolean darkMode to new string type
      let migratedSettings = { ...parsed.settings };
      if (typeof migratedSettings.darkMode === 'boolean') {
        migratedSettings.darkMode = migratedSettings.darkMode ? 'dark' : 'system';
      }

      // Merge with defaults to handle any new fields
      return {
        ...defaultProgress,
        ...parsed,
        settings: { ...defaultSettings, ...migratedSettings },
        streak: { ...defaultProgress.streak, ...parsed.streak },
      };
    }
    return defaultProgress;
  } catch (error) {
    console.error('Error loading progress:', error);
    return defaultProgress;
  }
};

export const resetProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
};

export const getDateString = (date: Date = new Date()): string => {
  // Use local date format to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isToday = (dateString: string): boolean => {
  return dateString === getDateString();
};

export const isYesterday = (dateString: string): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === getDateString(yesterday);
};

export const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getDateString(d);
};

export const calculateProgress = (completedCount: number): {
  percentage: number;
  daysRemaining: number;
} => {
  const percentage = Math.round((completedCount / TOTAL_SNIPPETS) * 100);
  const daysRemaining = TOTAL_SNIPPETS - completedCount;
  return { percentage, daysRemaining };
};
