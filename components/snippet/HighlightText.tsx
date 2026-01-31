import React from 'react';
import { Text } from 'react-native';

export function HighlightText({ text, query, color, style }: { text: string; query?: string; color: string; style?: any }) {
  if (!query || !query.trim()) return <Text style={[{ color }, style]}>{text}</Text>;

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  let lastIdx = 0;
  let idx = lower.indexOf(qLower);
  let key = 0;

  while (idx !== -1) {
    if (idx > lastIdx) {
      parts.push(<Text key={key++} style={{ color }}>{text.slice(lastIdx, idx)}</Text>);
    }
    parts.push(
      <Text key={key++} style={{ color, fontWeight: '700', backgroundColor: 'rgba(224, 122, 95, 0.25)' }}>
        {text.slice(idx, idx + query.length)}
      </Text>
    );
    lastIdx = idx + query.length;
    idx = lower.indexOf(qLower, lastIdx);
  }
  if (lastIdx < text.length) {
    parts.push(<Text key={key++} style={{ color }}>{text.slice(lastIdx)}</Text>);
  }
  return <Text style={style}>{parts}</Text>;
}
