import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ftue_state';

interface FTUEState {
  hasSeenWelcome: boolean;
  hasCompletedFirstReading: boolean;
  hasSetupNotifications: boolean;
}

const DEFAULT_STATE: FTUEState = {
  hasSeenWelcome: false,
  hasCompletedFirstReading: false,
  hasSetupNotifications: false,
};

export function useFirstTimeUser() {
  const [state, setState] = useState<FTUEState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const update = useCallback((partial: Partial<FTUEState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const dismissWelcome = useCallback(() => {
    update({ hasSeenWelcome: true });
  }, [update]);

  const markFirstReadingComplete = useCallback(() => {
    update({ hasCompletedFirstReading: true });
  }, [update]);

  const markNotificationsHandled = useCallback(() => {
    update({ hasSetupNotifications: true });
  }, [update]);

  const resetFTUE = useCallback(() => {
    setState(DEFAULT_STATE);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
  }, []);

  return {
    ...state,
    loaded,
    dismissWelcome,
    markFirstReadingComplete,
    markNotificationsHandled,
    resetFTUE,
  };
}
