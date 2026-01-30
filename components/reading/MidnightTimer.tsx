import { useState, useEffect } from 'react';
import { AppState as RNAppState } from 'react-native';
import { CONFIG } from '@/constants/config';

export function useMidnightTimer() {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilMidnight(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, CONFIG.TIMER_UPDATE_INTERVAL_MS);

    const subscription = RNAppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') updateTimer();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return timeUntilMidnight;
}
