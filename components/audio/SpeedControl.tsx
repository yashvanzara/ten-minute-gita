import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { CONFIG, getVoiceColors } from '@/constants/config';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

const { VOICE_MODE } = CONFIG;

interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  visible: boolean;
}

export function SpeedControl({ speed, onSpeedChange, visible }: SpeedControlProps) {
  const { t } = useLanguage();
  const vc = getVoiceColors(useAppColorScheme());

  if (!visible) return null;

  const turtleOpacity = speed <= 0.7 ? 1 : 0.3;
  const rabbitOpacity = speed >= 1.3 ? 1 : 0.3;

  // Snap to nearest 0.1
  const handleValueChange = (value: number) => {
    const snapped = Math.round(value * 10) / 10;
    onSpeedChange(snapped);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sliderRow}>
        <Text style={[styles.icon, { opacity: turtleOpacity }]}>🐢</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={VOICE_MODE.SPEED_MIN}
            maximumValue={VOICE_MODE.SPEED_MAX}
            step={VOICE_MODE.SPEED_STEP}
            value={speed}
            onValueChange={handleValueChange}
            minimumTrackTintColor={vc.CORAL}
            maximumTrackTintColor={vc.TRACK_BG}
            thumbTintColor={vc.CORAL}
          />
        </View>
        <Text style={[styles.icon, { opacity: rabbitOpacity }]}>🐇</Text>
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: vc.LABEL_GREY }]}>{t('voice.slow')}</Text>
        <Text style={[styles.label, { color: vc.LABEL_GREY }]}>{t('voice.normal')}</Text>
        <Text style={[styles.label, { color: vc.LABEL_GREY }]}>{t('voice.fast')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 22,
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    marginTop: -4,
  },
  label: {
    fontSize: 10,
  },
});
