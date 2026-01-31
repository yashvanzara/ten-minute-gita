import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

interface LockedContentProps {
  colors: any;
  colorScheme: 'light' | 'dark';
  message?: string;
  unlockTime?: string;
  isCompact?: boolean;
}

export function LockedContent({ colors, colorScheme, message, unlockTime, isCompact = false }: LockedContentProps) {
  const { t } = useLanguage();

  if (isCompact) {
    return (
      <View style={[styles.lockedCompact, { backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#F5F5F5' }]}>
        <Text style={styles.lockedCompactEmoji}>🔒</Text>
        <Text style={[styles.lockedCompactText, { color: colors.textSecondary }]}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.lockedContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FAFAFA' }]}>
      <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
        <Text style={styles.lockedEmoji}>🔒</Text>
        <Text style={[styles.lockedTitle, { color: colors.text }]}>{t('snippet.contentLocked')}</Text>
        {message && <Text style={[styles.lockedText, { color: colors.textSecondary }]}>{message}</Text>}
        {unlockTime && (
          <Text style={[styles.lockedTimer, { color: colors.accent }]}>
            {t('snippet.unlocksIn', { time: unlockTime })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockedContainer: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  lockedCard: { padding: 32, borderRadius: 20, alignItems: 'center', width: '100%' },
  lockedEmoji: { fontSize: 48, marginBottom: 16 },
  lockedTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  lockedText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  lockedTimer: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  lockedCompact: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 16, gap: 12 },
  lockedCompactEmoji: { fontSize: 20 },
  lockedCompactText: { fontSize: 13, flex: 1, lineHeight: 20 },
});
