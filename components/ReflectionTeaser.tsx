import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage, hiFontSize, hiLineHeight } from '@/contexts/LanguageContext';

interface ReflectionTeaserProps {
  reflection: string;
  isCompleted?: boolean;
}

export function ReflectionTeaser({ reflection, isCompleted = false }: ReflectionTeaserProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t, language } = useLanguage();

  // Show full first paragraph without truncation
  const firstParagraph = reflection.split('\n\n')[0].trim();

  // Change label based on completion status
  const label = isCompleted ? t('reflection.reflectOnToday') : t('reflection.todaysReflection');

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={styles.lotus}>🪷</Text>
        <Text style={[styles.label, { color: colors.accent }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.text, { color: colors.text, fontSize: hiFontSize(15, language), lineHeight: hiLineHeight(hiFontSize(15, language), language) }]}>
        {firstParagraph}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  lotus: {
    fontSize: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Georgia',
    fontStyle: 'italic',
  },
});
