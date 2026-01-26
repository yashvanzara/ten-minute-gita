import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  AppState,
  AppAction,
  UserProgress,
  Settings,
  TOTAL_SNIPPETS,
} from '@/types';
import {
  loadProgress,
  saveProgress,
  defaultProgress,
  getDateString,
  isToday,
  isYesterday,
  getWeekStart,
} from '@/utils/storage';

const initialState: AppState = {
  progress: defaultProgress,
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload, isLoading: false };

    case 'MARK_COMPLETE': {
      const snippetId = action.payload;
      const today = getDateString();
      const { progress } = state;

      // Check if already completed
      if (progress.completedSnippets.includes(snippetId)) {
        return state;
      }

      // Update streak
      let newStreak = { ...progress.streak };
      const lastRead = progress.streak.lastReadDate;

      if (!lastRead || isYesterday(lastRead)) {
        // Continue or start streak
        newStreak.current += 1;
        newStreak.longest = Math.max(newStreak.longest, newStreak.current);
      } else if (!isToday(lastRead)) {
        // Streak broken (more than 1 day gap)
        newStreak.current = 1;
      }
      // If already read today, don't change streak

      newStreak.lastReadDate = today;

      // Reset freeze if new week
      const currentWeekStart = getWeekStart();
      const lastWeekStart = lastRead ? getWeekStart(new Date(lastRead)) : null;
      if (lastWeekStart && currentWeekStart !== lastWeekStart) {
        newStreak.freezesAvailable = 1;
        newStreak.freezeUsedThisWeek = false;
      }

      // Calculate next snippet
      const newCompleted = [...progress.completedSnippets, snippetId];
      const nextSnippet = Math.min(snippetId + 1, TOTAL_SNIPPETS);

      const newProgress: UserProgress = {
        ...progress,
        currentSnippet: nextSnippet,
        completedSnippets: newCompleted,
        streak: newStreak,
        readingHistory: {
          ...progress.readingHistory,
          [today]: snippetId,
        },
      };

      return { ...state, progress: newProgress };
    }

    case 'UPDATE_SETTINGS': {
      const newSettings: Settings = {
        ...state.progress.settings,
        ...action.payload,
      };
      return {
        ...state,
        progress: { ...state.progress, settings: newSettings },
      };
    }

    case 'USE_STREAK_FREEZE': {
      const { streak } = state.progress;
      if (streak.freezesAvailable > 0 && !streak.freezeUsedThisWeek) {
        const today = getDateString();
        const newStreak = {
          ...streak,
          lastReadDate: today,
          freezesAvailable: streak.freezesAvailable - 1,
          freezeUsedThisWeek: true,
        };
        return {
          ...state,
          progress: { ...state.progress, streak: newStreak },
        };
      }
      return state;
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'RESET_PROGRESS':
      return { ...state, progress: defaultProgress };

    case 'SIMULATE_PROGRESS': {
      const targetDay = action.payload;
      const completedSnippets: number[] = [];
      const readingHistory: { [date: string]: number } = {};

      // Generate fake reading history for the past N days
      for (let i = 1; i <= targetDay; i++) {
        completedSnippets.push(i);
        // Create date strings going back from today
        const date = new Date();
        date.setDate(date.getDate() - (targetDay - i));
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        readingHistory[dateStr] = i;
      }

      const newProgress: UserProgress = {
        ...state.progress,
        currentSnippet: targetDay + 1,
        completedSnippets,
        streak: {
          current: targetDay,
          longest: targetDay,
          lastReadDate: getDateString(),
          freezesAvailable: 1,
          freezeUsedThisWeek: false,
        },
        readingHistory,
      };

      return { ...state, progress: newProgress };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  markComplete: (snippetId: number) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  useStreakFreeze: () => void;
  resetAllProgress: () => void;
  simulateProgress: (day: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load progress on mount
  useEffect(() => {
    const load = async () => {
      const progress = await loadProgress();
      dispatch({ type: 'SET_PROGRESS', payload: progress });
    };
    load();
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    if (!state.isLoading) {
      saveProgress(state.progress);
    }
  }, [state.progress, state.isLoading]);

  const markComplete = (snippetId: number) => {
    dispatch({ type: 'MARK_COMPLETE', payload: snippetId });
  };

  const updateSettings = (settings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const useStreakFreeze = () => {
    dispatch({ type: 'USE_STREAK_FREEZE' });
  };

  const resetAllProgress = async () => {
    dispatch({ type: 'RESET_PROGRESS' });
  };

  const simulateProgress = (day: number) => {
    dispatch({ type: 'SIMULATE_PROGRESS', payload: day });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        markComplete,
        updateSettings,
        useStreakFreeze,
        resetAllProgress,
        simulateProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
