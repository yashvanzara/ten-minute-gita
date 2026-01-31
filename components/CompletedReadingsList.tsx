import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useSnippets } from '@/hooks/useSnippets';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_DISPLAY = 7;

export function CompletedReadingsList() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const router = useRouter();
  const { state } = useApp();
  const { getSnippet } = useSnippets();
  const { completedSnippets } = state.progress;

  // Get completed readings sorted by most recent (highest ID = most recent)
  const completedReadings = useMemo(() => {
    return [...completedSnippets]
      .sort((a, b) => b - a)
      .slice(0, MAX_DISPLAY)
      .map(id => {
        const snippet = getSnippet(id);
        return {
          id,
          title: snippet?.title.replace(/^Day \d+:\s*/, '') || `Day ${id}`,
          chapter: snippet?.chapter || 1,
        };
      });
  }, [completedSnippets, getSnippet]);

  const hasMore = completedSnippets.length > MAX_DISPLAY;

  if (completedSnippets.length === 0) {
    return null;
  }

  const handleReadingPress = (id: number) => {
    router.push(`/reading/${id}?mode=review`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('completedList.completedReadings')}</Text>
        {hasMore && (
          <Pressable onPress={() => router.push('/completed-readings')}>
            <Text style={[styles.viewAll, { color: colors.accent }]}>
              {t('completedList.viewAll', { count: completedSnippets.length })}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.list}>
        {completedReadings.map((reading, index) => (
          <Pressable
            key={reading.id}
            style={({ pressed }) => [
              styles.listItem,
              index < completedReadings.length - 1 && [
                styles.listItemBorder,
                { borderBottomColor: colors.border },
              ],
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => handleReadingPress(reading.id)}
          >
            <View style={styles.listItemContent}>
              <Text style={[styles.dayLabel, { color: colors.accent }]}>
                {t('common.dayNum', { day: reading.id })}
              </Text>
              <Text
                style={[styles.titleText, { color: colors.text }]}
                numberOfLines={1}
              >
                {reading.title}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
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
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemContent: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 15,
  },
  chevron: {
    fontSize: 20,
    marginLeft: 8,
  },
});
