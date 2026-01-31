import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '@/hooks/useProgress';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

export function ProgressCard() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { state } = useApp();
  const { currentSnippet, completedCount, totalSnippets, percentage, daysRemaining, isComplete } = useProgress();

  const handleContinue = () => {
    router.push(`/reading/${currentSnippet}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('progressCard.yourProgress')}</Text>
        <Text style={[styles.percentage, { color: colors.accent }]}>{percentage}%</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.accent, width: `${percentage}%` },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('progressCard.completed')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{totalSnippets}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('progressCard.total')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{daysRemaining}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('progressCard.remaining')}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel={isComplete ? t('progressCard.readAgain') : completedCount === 0 ? t('progressCard.startReading') : t('progressCard.continueReading')}
      >
        <Text style={styles.continueButtonText}>
          {isComplete ? t('progressCard.readAgain') : completedCount === 0 ? t('progressCard.startReading') : t('progressCard.continueReading')}
        </Text>
        <Text style={styles.continueButtonSubtext}>
          {isComplete ? t('common.dayNum', { day: 1 }) : t('common.dayNum', { day: currentSnippet })}
        </Text>
      </Pressable>
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
  percentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  continueButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },
  continueButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
});
