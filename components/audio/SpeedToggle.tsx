import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { getVoiceColors } from '@/constants/config';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

interface SpeedToggleProps {
  speed: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SpeedToggle({ speed, isExpanded, onToggle }: SpeedToggleProps) {
  const vc = getVoiceColors(useAppColorScheme());
  const speedLabel = speed.toFixed(1) + 'x';
  const isNormal = Math.abs(speed - 1.0) < 0.05;
  const isSlow = speed < 0.85;
  const isFast = speed > 1.15;

  let displayText = speedLabel;
  if (isSlow) displayText = `🐢 ${speedLabel}`;
  if (isFast) displayText = `🐇 ${speedLabel}`;

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: vc.CHIP_BG },
        isExpanded && { backgroundColor: vc.CORAL_LIGHT, borderColor: vc.CORAL },
      ]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={`Speed ${speedLabel}`}
    >
      <Text
        style={[
          styles.text,
          { color: vc.TEXT_GREY },
          !isNormal && { color: vc.CORAL },
        ]}
      >
        {displayText}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
