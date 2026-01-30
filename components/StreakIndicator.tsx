import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useStreak } from '@/hooks/useStreak';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

interface StreakIndicatorProps {
  onStartStreak?: () => void;
}

export function StreakIndicator({ onStartStreak }: StreakIndicatorProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { current, isAtRisk, canUseFreeze, useFreeze, freezesAvailable } = useStreak();
  const { state } = useApp();
  const { completedSnippets } = state.progress;

  // Determine zero streak message
  const hasEverCompleted = completedSnippets.length > 0;
  const isZeroStreak = current === 0;

  const getStreakDisplay = () => {
    if (isZeroStreak) {
      return hasEverCompleted ? t('streak.restartToday') : t('streak.startToday');
    }
    return t('streak.dayStreak', { count: current });
  };

  // Make tappable when zero streak to encourage starting
  const handlePress = () => {
    if (isZeroStreak && onStartStreak) {
      onStartStreak();
    }
  };

  const content = (
    <>
      <Text style={styles.fireEmoji}>🔥</Text>
      <Text style={[styles.streakText, { color: colors.streak }]}>
        {getStreakDisplay()}
      </Text>

      {isAtRisk && !isZeroStreak && (
        <View style={[styles.riskBadge, { backgroundColor: colors.streak }]}>
          <Text style={styles.riskText}>{t('streak.atRisk')}</Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {isZeroStreak ? (
        <Pressable
          style={({ pressed }) => [
            styles.indicator,
            { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={handlePress}
          accessibilityLabel={getStreakDisplay()}
          accessibilityRole="button"
        >
          {content}
        </Pressable>
      ) : (
        <View style={[styles.indicator, { backgroundColor: colors.card }]}>
          {content}
        </View>
      )}

      {/* Freeze button - only show when at risk and can use freeze */}
      {isAtRisk && canUseFreeze && !isZeroStreak && (
        <Pressable
          style={[styles.freezeButton, { backgroundColor: colors.card }]}
          onPress={useFreeze}
        >
          <Text style={[styles.freezeText, { color: colors.accent }]}>
            {t('streak.useFreeze', { count: freezesAvailable })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
  },
  fireEmoji: {
    fontSize: 18,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  riskText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  freezeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  freezeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
