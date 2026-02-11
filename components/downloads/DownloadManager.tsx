import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, Pressable, StyleSheet, Alert, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDownloadManager } from '@/hooks/useDownloadManager';

const STORAGE_KEY_AUTO_DOWNLOAD = '@offline_auto_download';
const STORAGE_KEY_AUTO_REMOVE = '@offline_auto_remove';

const EN_SIZE = '~6.2 GB';
const HI_SIZE = '~4.6 GB';

function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

export function DownloadManager() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { totalStorageUsed, deleteAll } = useDownloadManager();

  const [autoDownload, setAutoDownload] = useState(true);
  const [autoRemove, setAutoRemove] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_AUTO_DOWNLOAD).then((v) => {
      if (v !== null) setAutoDownload(v === 'true');
    }).catch(() => {});
    AsyncStorage.getItem(STORAGE_KEY_AUTO_REMOVE).then((v) => {
      if (v !== null) setAutoRemove(v === 'true');
    }).catch(() => {});
  }, []);

  const handleAutoDownloadToggle = (value: boolean) => {
    setAutoDownload(value);
    AsyncStorage.setItem(STORAGE_KEY_AUTO_DOWNLOAD, String(value)).catch(() => {});
  };

  const handleAutoRemoveToggle = (value: boolean) => {
    setAutoRemove(value);
    AsyncStorage.setItem(STORAGE_KEY_AUTO_REMOVE, String(value)).catch(() => {});
  };

  const toggleAdvanced = () => {
    const toValue = advancedOpen ? 0 : 1;
    setAdvancedOpen(!advancedOpen);
    Animated.timing(chevronAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const handleDownloadAll = (lang: 'en' | 'hi') => {
    const size = lang === 'en' ? EN_SIZE : HI_SIZE;
    Alert.alert(
      t('settings.offline.confirmTitle'),
      t('settings.offline.confirmMessage', { size }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.offline.confirmAction'),
          onPress: () => {
            Alert.alert(
              t('settings.offline.comingSoonTitle'),
              t('settings.offline.comingSoonMessage'),
            );
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('settings.offline.clearAllTitle'),
      t('settings.offline.clearAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.offline.clearAll'),
          style: 'destructive',
          onPress: async () => {
            await deleteAll('en');
            await deleteAll('hi');
          },
        },
      ],
    );
  };

  return (
    <>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        {t('settings.offline.title')}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Auto-download toggle */}
        <View style={styles.row}>
          <View style={styles.labelGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t('settings.offline.autoDownload')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('settings.offline.autoDownloadSub')}
            </Text>
          </View>
          <Switch
            value={autoDownload}
            onValueChange={handleAutoDownloadToggle}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFF' : colors.card}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Auto-remove toggle */}
        <View style={styles.row}>
          <View style={styles.labelGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t('settings.offline.autoRemove')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('settings.offline.autoRemoveSub')}
            </Text>
          </View>
          <Switch
            value={autoRemove}
            onValueChange={handleAutoRemoveToggle}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFF' : colors.card}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Advanced accordion header */}
        <Pressable
          style={({ pressed }) => [styles.advancedRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={toggleAdvanced}
        >
          <Text style={[styles.label, { color: colors.text }]}>
            {t('settings.offline.advanced')}
          </Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Animated.View>
        </Pressable>

        {/* Advanced content */}
        {advancedOpen && (
          <View style={styles.advancedContent}>
            <Pressable
              style={({ pressed }) => [
                styles.downloadButton,
                { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleDownloadAll('en')}
            >
              <Ionicons name="cloud-download-outline" size={18} color={colors.accent} />
              <Text style={[styles.downloadButtonText, { color: colors.accent }]}>
                {t('settings.offline.downloadAllEn', { size: EN_SIZE })}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.downloadButton,
                { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleDownloadAll('hi')}
            >
              <Ionicons name="cloud-download-outline" size={18} color={colors.accent} />
              <Text style={[styles.downloadButtonText, { color: colors.accent }]}>
                {t('settings.offline.downloadAllHi', { size: HI_SIZE })}
              </Text>
            </Pressable>

            {totalStorageUsed > 0 && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.clearButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleClearAll}
                >
                  <Text style={styles.clearButtonText}>{t('settings.offline.clearAllButton')}</Text>
                </Pressable>

                <Text style={[styles.storageCaption, { color: colors.textSecondary }]}>
                  {t('settings.offline.using', { size: formatStorageSize(totalStorageUsed) })}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 8,
  },
  labelGroup: {
    flex: 1,
    marginRight: 12,
  },
  label: { fontSize: 16 },
  subtitle: { fontSize: 13, marginTop: 1 },
  divider: { height: 1, marginVertical: 8 },
  advancedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 8,
  },
  advancedContent: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  storageCaption: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
