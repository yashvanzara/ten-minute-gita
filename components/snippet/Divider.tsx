import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Divider({ color }: { color: string }) {
  return (
    <View style={styles.dividerContainer}>
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
      <Text style={[styles.dividerSymbol, { color }]}>॥</Text>
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, paddingHorizontal: 30 },
  dividerLine: { flex: 1, height: 1 },
  dividerSymbol: { marginHorizontal: 16, fontSize: 18, fontWeight: '300' },
});
