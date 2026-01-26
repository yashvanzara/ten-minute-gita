import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Switch,
  Pressable,
  Alert,
  Platform,
  TextInput,
  Share,
  Linking,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '@/contexts/AppContext';
import { useSnippets } from '@/hooks/useSnippets';
import {
  scheduleDailyReminder,
  cancelAllNotifications,
  generateNotificationContent,
} from '@/utils/notifications';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

// __DEV__ is automatically false in production builds
declare const __DEV__: boolean;

export default function SettingsScreen() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state, updateSettings, resetAllProgress, simulateProgress } = useApp();
  const { settings } = state.progress;
  const { getSnippet } = useSnippets();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [simulateDay, setSimulateDay] = useState('');

  // Parse notification time for picker
  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Format time for display (12-hour with AM/PM)
  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get current snippet for notification preview
  const currentSnippet = getSnippet(state.progress.currentSnippet);
  const snippetTitle = currentSnippet?.title.replace(/^Day \d+:\s*/, '') || 'The Beginning';

  // Generate notification preview content
  const notificationPreview = generateNotificationContent(
    state.progress.currentSnippet,
    snippetTitle,
    state.progress.streak.current
  );

  // === HANDLERS ===

  const handleFontSizeChange = (value: number) => {
    updateSettings({ fontSize: Math.round(value) });
  };

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    updateSettings({ darkMode: theme });
  };

  const handleContentToggle = (
    key: 'showSanskrit' | 'showTransliteration' | 'showTranslation',
    newValue: boolean
  ) => {
    // Count how many are currently ON
    const currentlyOn = [
      settings.showSanskrit,
      settings.showTransliteration,
      settings.showTranslation,
    ].filter(Boolean).length;

    // If trying to turn OFF and only 1 is ON, prevent it
    if (!newValue && currentlyOn === 1) {
      Alert.alert(
        'Cannot Disable',
        'At least one content type must be shown.'
      );
      return;
    }

    updateSettings({ [key]: newValue });
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    if (enabled) {
      const scheduled = await scheduleDailyReminder(
        settings.notificationTime,
        state.progress.currentSnippet,
        snippetTitle,
        state.progress.streak.current
      );
      if (scheduled) {
        updateSettings({ notificationsEnabled: true });
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.'
        );
      }
    } else {
      await cancelAllNotifications();
      updateSettings({ notificationsEnabled: false });
    }
  };

  const handleTimeChange = async (_event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;
      updateSettings({ notificationTime: newTime });

      // Reschedule notification with new time
      if (settings.notificationsEnabled) {
        await scheduleDailyReminder(
          newTime,
          state.progress.currentSnippet,
          snippetTitle,
          state.progress.streak.current
        );
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm on Day ${state.progress.currentSnippet} of reading the Bhagavad Gita in just 10 minutes a day. Join me on this 239-day journey! 🙏`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSendFeedback = async () => {
    const email = 'hello@tenminutegita.com';
    const subject = encodeURIComponent('10 Minute Gita Feedback');
    const mailtoUrl = `mailto:${email}?subject=${subject}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        // Fallback: show the email address to copy
        Alert.alert(
          'Send Feedback',
          `Email us at:\n${email}`,
          [
            { text: 'Copy Email', onPress: () => {
              // Note: Would need expo-clipboard for actual copy
              Alert.alert('Email', email);
            }},
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Send Feedback', `Email us at: ${email}`);
    }
  };

  const handleResetProgress = () => {
    const streakDays = state.progress.streak.current;
    const completedCount = state.progress.completedSnippets.length;

    Alert.alert(
      'Reset your journey?',
      `This will erase your ${streakDays}-day streak and ${completedCount} completed readings. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: resetAllProgress,
        },
      ]
    );
  };

  const handleSimulateProgress = () => {
    const day = parseInt(simulateDay, 10);
    if (isNaN(day) || day < 1 || day > 239) {
      Alert.alert('Invalid Day', 'Please enter a number between 1 and 239');
      return;
    }
    Alert.alert(
      'Simulate Progress',
      `This will set your progress to Day ${day} with ${day} completed readings and a ${day}-day streak. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Simulate',
          onPress: () => {
            simulateProgress(day);
            setSimulateDay('');
            Alert.alert('Done', `Progress set to Day ${day}`);
          },
        },
      ]
    );
  };

  // === RENDER ===

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* SECTION 1: READING PREFERENCES */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Reading Preferences
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Font Size */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Font Size</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>
            {settings.fontSize}px
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={14}
          maximumValue={24}
          step={1}
          value={settings.fontSize}
          onValueChange={handleFontSizeChange}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />

        {/* Real Preview - respects display toggles */}
        <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
          {settings.showSanskrit && (
            <Text
              style={[
                styles.previewSanskrit,
                { color: colors.text, fontSize: settings.fontSize + 2 },
              ]}
            >
              धृतराष्ट्र उवाच |
            </Text>
          )}
          {settings.showTransliteration && (
            <Text
              style={[
                styles.previewTranslit,
                { color: colors.textSecondary, fontSize: settings.fontSize - 2 },
              ]}
            >
              dhṛtarāṣṭra uvāca
            </Text>
          )}
          {settings.showTranslation && (
            <Text
              style={[
                styles.previewTranslation,
                { color: colors.text, fontSize: settings.fontSize },
              ]}
            >
              Dhritarashtra said:
            </Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Content Display Toggles */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Show Sanskrit</Text>
          <Switch
            value={settings.showSanskrit}
            onValueChange={(v) => handleContentToggle('showSanskrit', v)}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFF' : colors.card}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Show Transliteration</Text>
          <Switch
            value={settings.showTransliteration}
            onValueChange={(v) => handleContentToggle('showTransliteration', v)}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFF' : colors.card}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Show Translation</Text>
          <Switch
            value={settings.showTranslation}
            onValueChange={(v) => handleContentToggle('showTranslation', v)}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFF' : colors.card}
          />
        </View>
      </View>

      {/* SECTION 2: APPEARANCE */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Appearance
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>
            Theme
          </Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>
            {colorScheme}
          </Text>
        </View>
        <View style={[styles.segmentedControl, { backgroundColor: colors.background }]}>
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <Pressable
              key={theme}
              style={[
                styles.segmentButton,
                settings.darkMode === theme && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => handleThemeChange(theme)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: settings.darkMode === theme ? '#FFF' : colors.text },
                ]}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* SECTION 3: DAILY REMINDER */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Daily Reminder
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Remind me to read</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleNotificationsChange}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFF' : colors.card}
          />
        </View>

        {settings.notificationsEnabled && (
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>Time</Text>
              <Pressable onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.timeButton, { color: colors.accent }]}>
                  {formatTime(settings.notificationTime)}
                </Text>
              </Pressable>
            </View>

            {showTimePicker && (
              <DateTimePicker
                value={parseTime(settings.notificationTime)}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* Notification Preview */}
            <View
              style={[
                styles.notificationPreview,
                { backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.previewHeader, { color: colors.textSecondary }]}>
                🔔 Preview
              </Text>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {notificationPreview.title}
              </Text>
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                {notificationPreview.body}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* SECTION 4: SPREAD THE WISDOM */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Spread the Wisdom
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => {
            // TODO: Implement app store review
            Alert.alert('Coming Soon', 'App store rating will be available after release.');
          }}
        >
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={[styles.actionLabel, { color: colors.text }]}>
            Rate 10 Minute Gita
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <Pressable
          style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleShare}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={[styles.actionLabel, { color: colors.text }]}>
            Share with Friends
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </Pressable>

        <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

        <Pressable
          style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleSendFeedback}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionLabel, { color: colors.text }]}>
            Send Feedback
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
      </View>

      {/* SECTION 5: YOUR DATA */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        Your Data
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleResetProgress}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={[styles.actionLabel, { color: '#DC3545' }]}>
            Reset All Progress
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
      </View>

      {/* SECTION 6: DEV TOOLS (Development Only) */}
      {__DEV__ && (
        <>
          <Text style={[styles.sectionHeader, { color: '#FF9800' }]}>
            Dev Tools
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: '#FF9800' },
            ]}
          >
            <Text style={[styles.devNote, { color: colors.textSecondary }]}>
              Only visible in development
            </Text>

            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>
                Current: Day {state.progress.currentSnippet} | Streak:{' '}
                {state.progress.streak.current}
              </Text>
            </View>

            <View style={styles.simulateRow}>
              <TextInput
                style={[
                  styles.simulateInput,
                  {
                    color: colors.text,
                    backgroundColor: colorScheme === 'dark' ? '#404040' : '#F5F5F5',
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Day (1-239)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={simulateDay}
                onChangeText={setSimulateDay}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.simulateButton,
                  { backgroundColor: '#FF9800', opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleSimulateProgress}
              >
                <Text style={styles.simulateButtonText}>Simulate</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* SECTION 7: FOOTER */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Made with 🙏 for seekers of wisdom
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 60,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  previewContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  previewSanskrit: {
    fontWeight: '500',
  },
  previewTranslit: {
    fontStyle: 'italic',
  },
  previewTranslation: {
    fontFamily: 'Georgia',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationPreview: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  previewHeader: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 8,
  },
  actionIcon: {
    fontSize: 20,
    width: 32,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  rowDivider: {
    height: 1,
    marginLeft: 32,
  },
  devNote: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  simulateRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  simulateInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  simulateButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulateButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
});
