import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { isToday, isYesterday, getDateString } from '@/utils/storage';

export function useStreak() {
  const { state, useStreakFreeze } = useApp();
  const { streak } = state.progress;

  const streakStatus = useMemo(() => {
    const { lastReadDate, current, longest, freezesAvailable, freezeUsedThisWeek } = streak;

    // Determine if streak is at risk
    let isAtRisk = false;
    let isBroken = false;
    let readToday = false;

    if (lastReadDate) {
      readToday = isToday(lastReadDate);
      const wasYesterday = isYesterday(lastReadDate);

      if (!readToday && !wasYesterday && current > 0) {
        // More than a day has passed - streak is broken
        isBroken = true;
      } else if (!readToday && wasYesterday) {
        // Haven't read today but read yesterday - at risk
        isAtRisk = true;
      }
    }

    return {
      current: isBroken ? 0 : current,
      longest,
      isAtRisk,
      isBroken,
      readToday,
      lastReadDate,
      canUseFreeze: freezesAvailable > 0 && !freezeUsedThisWeek && isAtRisk,
      freezesAvailable,
    };
  }, [streak]);

  const getMotivationalMessage = () => {
    const { current, isAtRisk, readToday } = streakStatus;

    if (readToday) {
      if (current >= 100) return "Incredible dedication! You're a true seeker.";
      if (current >= 30) return "Amazing! A month of wisdom.";
      if (current >= 7) return "One week strong! Keep going.";
      return "Great job today!";
    }

    if (isAtRisk) {
      return `Don't break your ${current}-day streak!`;
    }

    if (current === 0) {
      return "Start your journey today.";
    }

    return "Continue your path to wisdom.";
  };

  return {
    ...streakStatus,
    useFreeze: useStreakFreeze,
    motivationalMessage: getMotivationalMessage(),
  };
}
