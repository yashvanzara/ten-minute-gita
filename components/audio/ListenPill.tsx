import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { getVoiceColors } from '@/constants/config';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { ListenPillState } from '@/types/audio';
import { formatTime } from '@/utils/sectionHelpers';

interface ListenPillProps {
  pillState: ListenPillState;
  duration: number;
  savedTime: number;
  onPress: () => void;
}

export function ListenPill({ pillState, duration, savedTime, onPress }: ListenPillProps) {
  const { t } = useLanguage();
  const vc = getVoiceColors(useAppColorScheme());

  const durationMin = Math.round(duration / 60);

  let label: string;
  let bgColor: string;
  let shadowColor: string;

  switch (pillState) {
    case 'completed':
      label = t('voice.listened');
      bgColor = vc.GREEN_COMPLETE;
      shadowColor = 'rgba(123, 196, 168, 0.4)';
      break;
    case 'resume':
      label = t('voice.resume', { time: formatTime(savedTime) });
      bgColor = vc.CORAL;
      shadowColor = 'rgba(232, 114, 92, 0.35)';
      break;
    case 'fresh':
    default:
      label = t('voice.listenDuration', { min: durationMin > 0 ? durationMin : 10 });
      bgColor = vc.CORAL;
      shadowColor = 'rgba(232, 114, 92, 0.35)';
      break;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: bgColor,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          shadowColor,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.pillText, { color: vc.WHITE }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
