import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { MilestoneCard } from '@/components/MilestoneCard';
import { CompletedReadingsList } from '@/components/CompletedReadingsList';
import { useProgress } from '@/hooks/useProgress';
import { useStreak } from '@/hooks/useStreak';
import { useSnippets } from '@/hooks/useSnippets';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

export default function ProgressScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { completedCount, totalSnippets, currentSnippet } = useProgress();
  const { current: currentStreak, longest: longestStreak } = useStreak();
  const { getSnippet } = useSnippets();
  const { state } = useApp();
  const { completedSnippets } = state.progress;

  // Get current chapter from snippet data
  const currentSnippetData = getSnippet(currentSnippet);
  const currentChapter = currentSnippetData?.chapter || 1;

  const hasEverCompleted = completedSnippets.length > 0;
  const isZeroStreak = currentStreak === 0;

  // Navigate to start reading
  const handleStartJourney = () => {
    router.push(`/reading/${currentSnippet}`);
  };

  // EMPTY STATE: User has never read anything
  if (!hasEverCompleted) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Begin Your 239-Day Journey
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Read the Bhagavad Gita in 10 minutes a day.{'\n'}
            Your progress will appear here.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleStartJourney}
          >
            <Text style={styles.startButtonText}>Start Day 1</Text>
          </Pressable>
        </View>

        {/* Show empty calendar */}
        <CalendarHeatmap />
      </ScrollView>
    );
  }

  // Get streak display text
  const getStreakDisplay = () => {
    if (isZeroStreak) {
      return hasEverCompleted ? 'Restart your streak' : 'Start your streak';
    }
    return `${currentStreak} day streak`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO STATS */}
      <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
        {/* Streak as hero */}
        <View style={styles.streakSection}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakText, { color: colors.streak }]}>
            {getStreakDisplay()}
          </Text>
        </View>

        {longestStreak > currentStreak && (
          <Text style={[styles.personalBest, { color: colors.textSecondary }]}>
            Personal best: {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </Text>
        )}

        {/* Journey progress bar */}
        <View style={styles.journeySection}>
          <View style={[styles.progressBarBg, { backgroundColor: colorScheme === 'dark' ? '#404040' : '#E8E8E8' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.accent,
                  width: `${Math.max((completedCount / totalSnippets) * 100, 1)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.journeyText, { color: colors.text }]}>
            Day {currentSnippet} of {totalSnippets} · Chapter {currentChapter}
          </Text>
        </View>
      </View>

      {/* CALENDAR */}
      <CalendarHeatmap />

      {/* MILESTONES */}
      <MilestoneCard />

      {/* COMPLETED READINGS */}
      <CompletedReadingsList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },

  // Hero Stats
  heroCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakText: {
    fontSize: 28,
    fontWeight: '700',
  },
  personalBest: {
    fontSize: 14,
    marginTop: 4,
  },
  journeySection: {
    width: '100%',
    marginTop: 20,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  journeyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },

  // Empty State
  emptyStateCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
