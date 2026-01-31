import React from 'react';
import { Text } from 'react-native';
import { HighlightText } from './HighlightText';

export function FormattedText({
  text,
  style,
  color,
  italicColor,
  highlightQuery,
}: {
  text: string;
  style: any;
  color: string;
  italicColor?: string;
  highlightQuery?: string;
}) {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Replace ** temporarily to avoid matching them
  remaining = remaining.replace(/\*\*/g, '§§BOLD§§');

  while (remaining.length > 0) {
    const match = remaining.match(/\*([^*]+)\*/);
    if (match && match.index !== undefined) {
      if (match.index > 0) {
        const before = remaining.substring(0, match.index).replace(/§§BOLD§§/g, '**');
        result.push(<HighlightText key={key++} text={before} query={highlightQuery} color={color} />);
      }
      result.push(
        <HighlightText key={key++} text={match[1]} query={highlightQuery} color={italicColor || color} style={{ fontStyle: 'italic' }} />
      );
      remaining = remaining.substring(match.index + match[0].length);
    } else {
      const final = remaining.replace(/§§BOLD§§/g, '**');
      result.push(<HighlightText key={key++} text={final} query={highlightQuery} color={color} />);
      break;
    }
  }

  return <Text style={style}>{result}</Text>;
}
