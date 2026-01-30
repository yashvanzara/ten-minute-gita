import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { scheduleDailyReminder } from '@/utils/notifications';
import { useApp } from '@/contexts/AppContext';
import { useSnippets } from '@/hooks/useSnippets';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

interface NotificationPromptProps {
  visible: boolean;
  onDismiss: () => void;
}

const HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function NotificationPrompt({ visible, onDismiss }: NotificationPromptProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { state, updateSettings } = useApp();
  const { getSnippet } = useSnippets();

  const [selectedHour, setSelectedHour] = useState(7);
  const [isAM, setIsAM] = useState(true);

  const get24Hour = (): number => {
    if (isAM) return selectedHour === 12 ? 0 : selectedHour;
    return selectedHour === 12 ? 12 : selectedHour + 12;
  };

  const displayTime = `${selectedHour}:00 ${isAM ? 'AM' : 'PM'}`;

  const handleSetReminder = async () => {
    const h24 = get24Hour();
    const timeStr = `${h24.toString().padStart(2, '0')}:00`;

    const snippet = getSnippet(state.progress.currentSnippet);
    const title = snippet?.title.replace(/^Day \d+:\s*/, '') || '';

    const result = await scheduleDailyReminder(
      timeStr,
      state.progress.currentSnippet,
      title,
      state.progress.streak.current
    );

    if (result) {
      updateSettings({
        notificationsEnabled: true,
        notificationTime: timeStr,
      });
    }

    onDismiss();
  };

  const warmBg = colorScheme === 'dark' ? '#2A2420' : '#FFF8F0';
  const chipBg = colorScheme === 'dark' ? '#3A3028' : '#FFF0E0';
  const chipActiveBg = colors.accent;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: warmBg, shadowColor: '#000' }]}>
          <Text style={styles.emoji}>🌅</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('ftue.reminderTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('ftue.reminderSubtitle')}
          </Text>

          {/* Selected time display */}
          <View style={[styles.timeDisplay, { backgroundColor: chipBg }]}>
            <Text style={[styles.timeDisplayText, { color: colors.text }]}>
              {displayTime}
            </Text>
          </View>

          {/* Hour selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourRow}
          >
            {HOUR_OPTIONS.map((hour) => {
              const active = hour === selectedHour;
              return (
                <Pressable
                  key={hour}
                  style={[
                    styles.hourChip,
                    { backgroundColor: active ? chipActiveBg : chipBg },
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text
                    style={[
                      styles.hourChipText,
                      { color: active ? '#FFF' : colors.text },
                    ]}
                  >
                    {hour}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* AM / PM toggle */}
          <View style={[styles.ampmRow, { backgroundColor: chipBg }]}>
            <Pressable
              style={[styles.ampmButton, isAM && { backgroundColor: chipActiveBg }]}
              onPress={() => setIsAM(true)}
            >
              <Text style={[styles.ampmText, { color: isAM ? '#FFF' : colors.text }]}>
                AM
              </Text>
            </Pressable>
            <Pressable
              style={[styles.ampmButton, !isAM && { backgroundColor: chipActiveBg }]}
              onPress={() => setIsAM(false)}
            >
              <Text style={[styles.ampmText, { color: !isAM ? '#FFF' : colors.text }]}>
                PM
              </Text>
            </Pressable>
          </View>

          {/* Set Reminder button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleSetReminder}
          >
            <Text style={styles.primaryText}>{t('ftue.setReminder')}</Text>
          </Pressable>

          {/* Maybe Later */}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.6 : 1 }]}
            onPress={onDismiss}
          >
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
              {t('ftue.maybeLater')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  timeDisplay: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  timeDisplayText: {
    fontSize: 28,
    fontWeight: '700',
  },
  hourRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  hourChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ampmRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  ampmButton: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ampmText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
