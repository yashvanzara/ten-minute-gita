import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { CONFIG } from '@/constants/config';

const { VOICE_COLORS, VOICE_MODE } = CONFIG;

export function BreathingDots() {
  const dots = useRef(
    Array.from({ length: VOICE_MODE.BREATHING_DOT_COUNT }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 0.8,
            duration: 600,
            delay: i * 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.container}>
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity,
              transform: [
                {
                  scale: opacity.interpolate({
                    inputRange: [0.3, 0.8],
                    outputRange: [1, 1.3],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: VOICE_COLORS.CORAL,
    marginHorizontal: 3,
  },
});
