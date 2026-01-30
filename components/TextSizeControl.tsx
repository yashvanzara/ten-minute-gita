import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

const SIZES = [
  { label: 'A-', value: 14 },
  { label: 'A', value: 18 },
  { label: 'A+', value: 22 },
];

export function TextSizeControl() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state, updateSettings } = useApp();
  const currentSize = state.progress.settings.fontSize;

  // Find closest size option
  const activeIndex = SIZES.reduce((best, s, i) => {
    return Math.abs(s.value - currentSize) < Math.abs(SIZES[best].value - currentSize) ? i : best;
  }, 0);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#404040' : '#F0F0F0' }]}>
      {SIZES.map((size, index) => (
        <Pressable
          key={size.label}
          style={[
            styles.button,
            activeIndex === index && { backgroundColor: colors.accent },
          ]}
          onPress={() => updateSettings({ fontSize: size.value })}
          hitSlop={4}
        >
          <Text style={[
            styles.buttonText,
            {
              fontSize: 12 + index * 3,
              color: activeIndex === index ? '#FFF' : colors.text,
              fontWeight: activeIndex === index ? '700' : '500',
            },
          ]}>
            {size.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  buttonText: {},
});
