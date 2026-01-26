import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { TOTAL_SNIPPETS, MILESTONES } from '@/types';
import { useSnippets } from './useSnippets';

export function useProgress() {
  const { state } = useApp();
  const { progress } = state;
  const { snippets } = useSnippets();

  // Use actual snippets count if available, otherwise fall back to constant
  const totalSnippets = snippets.length > 0 ? snippets.length : TOTAL_SNIPPETS;

  const stats = useMemo(() => {
    const completedCount = progress.completedSnippets.length;
    const percentage = Math.round((completedCount / totalSnippets) * 100);
    const daysRemaining = totalSnippets - completedCount;

    return {
      currentSnippet: progress.currentSnippet,
      completedCount,
      totalSnippets,
      percentage,
      daysRemaining,
      isComplete: completedCount >= totalSnippets,
    };
  }, [progress.completedSnippets, progress.currentSnippet, totalSnippets]);

  const milestones = useMemo(() => {
    const completedCount = progress.completedSnippets.length;

    // All milestones are based on total days completed (not streak)
    // This way, breaking a streak doesn't reset milestone progress
    return MILESTONES.map((milestone) => {
      const achieved = completedCount >= milestone;

      const milestoneIndex = MILESTONES.indexOf(milestone);
      const previousMilestone = milestoneIndex > 0 ? MILESTONES[milestoneIndex - 1] : 0;
      const isCurrent = !achieved && completedCount >= previousMilestone;

      return { days: milestone, achieved, isCurrent };
    });
  }, [progress.completedSnippets]);

  const recentlyCompletedMilestone = useMemo(() => {
    const completedCount = progress.completedSnippets.length;

    // Check if we just hit a milestone (all based on total completed)
    for (const milestone of MILESTONES) {
      if (completedCount === milestone) return milestone;
    }
    return undefined;
  }, [progress.completedSnippets]);

  return {
    ...stats,
    milestones,
    recentlyCompletedMilestone,
    readingHistory: progress.readingHistory,
  };
}
