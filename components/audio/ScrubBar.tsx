import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { getVoiceColors } from '@/constants/config';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { formatTime } from '@/utils/sectionHelpers';

interface ScrubBarProps {
  currentTime: number;
  duration: number;
  speed: number;
  onSeek: (time: number) => void;
}

export function ScrubBar({ currentTime, duration, speed, onSeek }: ScrubBarProps) {
  const vc = getVoiceColors(useAppColorScheme());
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const trackWidth = useRef(0);
  const trackX = useRef(0);

  const progress = duration > 0 ? (isDragging ? dragPosition : currentTime) / duration : 0;
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const getTimeFromPosition = useCallback((pageX: number) => {
    const relativeX = pageX - trackX.current;
    const ratio = Math.max(0, Math.min(1, relativeX / trackWidth.current));
    return ratio * duration;
  }, [duration]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const time = getTimeFromPosition(evt.nativeEvent.pageX);
        setDragPosition(time);
      },
      onPanResponderMove: (evt) => {
        const time = getTimeFromPosition(evt.nativeEvent.pageX);
        setDragPosition(time);
      },
      onPanResponderRelease: (evt) => {
        const time = getTimeFromPosition(evt.nativeEvent.pageX);
        onSeek(time);
        setIsDragging(false);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    event.target.measure((_x: number, _y: number, _width: number, _height: number, pageX: number) => {
      trackX.current = pageX;
      trackWidth.current = _width;
    });
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={styles.trackContainer}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: vc.TRACK_BG }]}>
          <View style={[styles.trackFill, { width: `${clampedProgress * 100}%`, backgroundColor: vc.CORAL }]} />
        </View>
        <View
          style={[
            styles.thumb,
            { left: `${clampedProgress * 100}%`, marginLeft: -11, backgroundColor: vc.CORAL },
          ]}
        />
      </View>
      <View style={styles.timestamps}>
        <Text style={[styles.timestamp, { color: vc.TEXT_GREY }]}>{formatTime((isDragging ? dragPosition : currentTime) / speed)}</Text>
        <Text style={[styles.timestamp, { color: vc.TEXT_GREY }]}>{formatTime(duration / speed)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  trackContainer: {
    height: 52,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    shadowColor: 'rgba(232, 114, 92, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    top: 15,
  },
  timestamps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
});
