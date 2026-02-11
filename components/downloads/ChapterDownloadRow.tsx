import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChapterDownloadInfo } from '@/types/downloads';
import { DownloadProgressBar } from './DownloadProgressBar';

interface ChapterDownloadRowProps {
  chapter: ChapterDownloadInfo;
  isDownloading: boolean;
  downloadProgress: number;
  colors: {
    text: string;
    textSecondary: string;
    accent: string;
    card: string;
    border: string;
  };
  onDownload: () => void;
  onDelete: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '--';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(0)} MB`;
}

export function ChapterDownloadRow({
  chapter,
  isDownloading,
  downloadProgress,
  colors,
  onDownload,
  onDelete,
}: ChapterDownloadRowProps) {
  const isFullyDownloaded = chapter.downloadedReadings === chapter.totalReadings;
  const hasPartial = chapter.downloadedReadings > 0 && !isFullyDownloaded;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]}>
          Ch. {chapter.chapterNumber} - {chapter.chapterTitle}
        </Text>
        <Text style={[styles.detail, { color: colors.textSecondary }]}>
          {chapter.downloadedReadings}/{chapter.totalReadings}
          {chapter.downloadedSize > 0 ? `  ${formatSize(chapter.downloadedSize)}` : ''}
        </Text>
        {isDownloading && (
          <DownloadProgressBar
            progress={downloadProgress}
            color={colors.accent}
            trackColor={colors.border}
          />
        )}
      </View>

      <View style={styles.actions}>
        {isFullyDownloaded ? (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </Pressable>
        ) : isDownloading ? (
          <Ionicons name="hourglass-outline" size={20} color={colors.textSecondary} />
        ) : (
          <Pressable onPress={onDownload} hitSlop={8}>
            <Ionicons
              name={hasPartial ? 'cloud-download-outline' : 'download-outline'}
              size={22}
              color={colors.accent}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  detail: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    marginLeft: 12,
  },
});
