import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG, getVoiceColors } from '@/constants/config';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

const { VOICE_MODE } = CONFIG;

export function FirstTimeTooltip() {
  const { t } = useLanguage();
  const vc = getVoiceColors(useAppColorScheme());
  const [visible, setVisible] = useState(false);
  const opacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    AsyncStorage.getItem(VOICE_MODE.FIRST_TOOLTIP_KEY).then((value) => {
      if (!value) {
        setVisible(true);
        AsyncStorage.setItem(VOICE_MODE.FIRST_TOOLTIP_KEY, 'true').catch(() => {});
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        timer = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setVisible(false));
        }, VOICE_MODE.TOOLTIP_DURATION_MS);
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: vc.TEXT_DARK }]}>
      <Text style={[styles.text, { color: vc.WHITE }]}>
        {t('voice.tooltip')} {'\u2193'}
      </Text>
      <View style={[styles.arrow, { borderTopColor: vc.TEXT_DARK }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  arrow: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
