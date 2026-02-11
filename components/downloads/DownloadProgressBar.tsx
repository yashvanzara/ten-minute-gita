import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DownloadProgressBarProps {
  progress: number; // 0-1
  color: string;
  trackColor: string;
}

export function DownloadProgressBar({ progress, color, trackColor }: DownloadProgressBarProps) {
  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { backgroundColor: color, width: `${Math.round(progress * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
