import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

interface LanguageToggleProps {
  variant?: 'compact' | 'expanded';
}

export function LanguageToggle({ variant = 'compact' }: LanguageToggleProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { language, setLanguage } = useLanguage();

  if (variant === 'expanded') {
    return (
      <View style={styles.expandedContainer}>
        <View style={[styles.expandedPill, { backgroundColor: colors.background }]}>
          <Pressable
            style={[
              styles.expandedOption,
              language === 'en' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[
              styles.expandedText,
              { color: language === 'en' ? '#FFF' : colors.text },
            ]}>
              English
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.expandedOption,
              language === 'hi' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setLanguage('hi')}
          >
            <Text style={[
              styles.expandedText,
              { color: language === 'hi' ? '#FFF' : colors.text },
            ]}>
              हिन्दी
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.pill, { backgroundColor: colorScheme === 'dark' ? '#404040' : '#F0F0F0' }]}
      onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
      hitSlop={8}
    >
      <Text style={[
        styles.pillText,
        language === 'en' && styles.pillTextActive,
        { color: language === 'en' ? colors.accent : colors.textSecondary },
      ]}>
        EN
      </Text>
      <Text style={[styles.pillDivider, { color: colors.textSecondary }]}>|</Text>
      <Text style={[
        styles.pillText,
        language === 'hi' && styles.pillTextActive,
        { color: language === 'hi' ? colors.accent : colors.textSecondary },
      ]}>
        हिं
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    fontWeight: '700',
  },
  pillDivider: {
    fontSize: 13,
    fontWeight: '300',
  },
  expandedContainer: {
    alignItems: 'center',
  },
  expandedPill: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    width: '100%',
  },
  expandedOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  expandedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
