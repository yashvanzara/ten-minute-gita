import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { getVoiceColors } from '@/constants/config';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { ScrubBar } from './ScrubBar';
import { CoreControls } from './CoreControls';
import { SpeedControl } from './SpeedControl';
import { SpeedToggle } from './SpeedToggle';

interface FullPlayerProps {
  isPlaying: boolean;
  hasListened?: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  isSpeedExpanded: boolean;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleSpeedPanel: () => void;
  onMinimize: () => void;
}

export function FullPlayer({
  isPlaying,
  hasListened,
  currentTime,
  duration,
  speed,
  isSpeedExpanded,
  onTogglePlayPause,
  onSeek,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
  onToggleSpeedPanel,
  onMinimize,
}: FullPlayerProps) {
  const vc = getVoiceColors(useAppColorScheme());

  return (
    <View style={[styles.container, { backgroundColor: vc.CREAM }]}>
      {/* Scrub Bar */}
      <ScrubBar currentTime={currentTime} duration={duration} speed={speed} onSeek={onSeek} />

      {/* Speed Slider (collapsible) */}
      <SpeedControl speed={speed} onSpeedChange={onSpeedChange} visible={isSpeedExpanded} />

      {/* Core Controls */}
      <CoreControls
        isPlaying={isPlaying}
        hasListened={hasListened}
        onTogglePlayPause={onTogglePlayPause}
        onSkipBack={onSkipBack}
        onSkipForward={onSkipForward}
      />

      {/* Speed Toggle */}
      <SpeedToggle speed={speed} isExpanded={isSpeedExpanded} onToggle={onToggleSpeedPanel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    paddingTop: 2,
  },
});
