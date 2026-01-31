import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useStreak } from '@/hooks/useStreak';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

export function StreakCard() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { current, longest, isAtRisk, readToday, canUseFreeze, useFreeze, motivationalMessage, freezesAvailable } = useStreak();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('streakCard.dailyStreak')}</Text>
        {isAtRisk && !readToday && (
          <View style={[styles.badge, { backgroundColor: colors.streak }]}>
            <Text style={styles.badgeText}>{t('streak.atRisk')}</Text>
          </View>
        )}
      </View>

      <View style={styles.streakRow} accessible={true} accessibilityLabel={t('streak.dayStreak', { count: current })}>
        <Text style={[styles.fireEmoji]} importantForAccessibility="no">🔥</Text>
        <Text style={[styles.streakNumber, { color: colors.streak }]}>{current}</Text>
        <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
          {t('streak.dayStreak', { count: current })}
        </Text>
      </View>

      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {motivationalMessage}
      </Text>

      {longest > current && (
        <Text style={[styles.longestStreak, { color: colors.textSecondary }]}>
          {t('streakCard.longestStreak', { count: longest })}
        </Text>
      )}

      {/* Show freezes available if user has any */}
      {freezesAvailable > 0 && !canUseFreeze && (
        <Text style={[styles.freezeInfo, { color: colors.textSecondary }]}>
          {t('streakCard.freezesAvailable', { count: freezesAvailable })}
        </Text>
      )}

      {canUseFreeze && (
        <Pressable
          style={[styles.freezeButton, { backgroundColor: colors.accent }]}
          onPress={useFreeze}
          accessibilityRole="button"
          accessibilityLabel={t('streakCard.useStreakFreeze', { count: freezesAvailable })}
        >
          <Text style={styles.freezeButtonText}>{t('streakCard.useStreakFreeze', { count: freezesAvailable })}</Text>
        </Pressable>
      )}

      {readToday && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>{t('streakCard.readToday')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  fireEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 18,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    marginTop: 4,
  },
  longestStreak: {
    fontSize: 12,
    marginTop: 8,
  },
  freezeButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  freezeButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  checkmark: {
    marginTop: 12,
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  freezeInfo: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
