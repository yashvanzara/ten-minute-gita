import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Settings } from '@/types';
import {
  loadProgress,
  saveProgress,
  resetProgress,
} from '@/utils/storage';
import { appReducer, initialState } from '@/reducers/appReducer';

interface AppContextType {
  state: typeof initialState;
  dispatch: React.Dispatch<Parameters<typeof appReducer>[1]>;
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
      dispatch({ type: 'SYNC_STREAK' });
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
    await resetProgress();
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
