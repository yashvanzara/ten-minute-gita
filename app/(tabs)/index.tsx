import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { TodayCard } from '@/components/TodayCard';
import { StreakIndicator } from '@/components/StreakIndicator';
import { ReflectionTeaser } from '@/components/ReflectionTeaser';
import { useApp } from '@/contexts/AppContext';
import { useSnippets } from '@/hooks/useSnippets';
import { useStreak } from '@/hooks/useStreak';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

export default function HomeScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { state } = useApp();
  const { getSnippet, getNextSnippet } = useSnippets();
  const { readToday } = useStreak();

  const currentSnippetId = state.progress.currentSnippet;

  const completedSnippets = state.progress.completedSnippets;

  const handleStartStreak = () => {
    // Navigate directly to today's reading
    router.push(`/reading/${currentSnippetId}`);
  };

  // Get the last completed snippet ID
  const lastCompletedId = completedSnippets.length > 0
    ? Math.max(...completedSnippets)
    : 0;

  // When completed today: show last completed for review, current as "tomorrow"
  // When not completed: show current snippet to read
  const lastCompletedSnippet = getSnippet(lastCompletedId);
  const currentSnippet = getSnippet(currentSnippetId);

  // For the TodayCard:
  // - If readToday: snippet = lastCompleted (for review), nextSnippet = current (tomorrow's)
  // - If not readToday: snippet = current (today's), nextSnippet = next one
  const displaySnippet = readToday ? lastCompletedSnippet : currentSnippet;
  const upNextSnippet = readToday ? currentSnippet : getNextSnippet(currentSnippetId);

  if (state.isLoading || !displaySnippet) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  // Journey text logic
  const journeyText = readToday
    ? `Day ${lastCompletedId} complete ✓`
    : `Day ${currentSnippetId} of your journey`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting + Journey Progress */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.text }]}>
          {getGreeting()}
        </Text>
        <Text style={[
          styles.journeyText,
          { color: readToday ? colors.accent : colors.textSecondary }
        ]}>
          {journeyText}
        </Text>
      </View>

      {/* Today's Content Preview - MAIN FOCUS */}
      <TodayCard
        snippet={displaySnippet}
        isCompleted={readToday}
        nextSnippet={upNextSnippet}
      />

      {/* Streak Indicator - Compact */}
      <StreakIndicator onStartStreak={handleStartStreak} />

      {/* Today's Reflection Teaser */}
      <ReflectionTeaser
        reflection={displaySnippet.reflection}
        isCompleted={readToday}
      />
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  greeting: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
  },
  journeyText: {
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },
});
