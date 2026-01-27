import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Snippet } from '@/types';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useApp } from '@/contexts/AppContext';

interface SnippetContentProps {
  snippet: Snippet;
  isContentLocked?: boolean; // Fully lock commentary and reflection sections (FUTURE_DAY)
  isPreviewLimited?: boolean; // Show only first 3 paragraphs of commentary, lock reflection (NEXT_DAY)
  unlockTime?: string; // Time until content unlocks - only for NEXT_DAY (e.g., "5h 30m")
  lockMessage?: string; // Custom lock message for FUTURE_DAY (e.g., "Complete Day 2 first")
  onScrollProgress?: (progress: number, minutesLeft: number) => void; // Callback for scroll progress (0-100) and estimated minutes left
}

// Parse markdown-style formatting (handles *italic* text)
function FormattedText({
  text,
  style,
  color,
  italicColor,
}: {
  text: string;
  style: any;
  color: string;
  italicColor?: string;
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
        result.push(<Text key={key++} style={{ color }}>{before}</Text>);
      }
      result.push(
        <Text key={key++} style={{ fontStyle: 'italic', color: italicColor || color }}>
          {match[1]}
        </Text>
      );
      remaining = remaining.substring(match.index + match[0].length);
    } else {
      const final = remaining.replace(/§§BOLD§§/g, '**');
      result.push(<Text key={key++} style={{ color }}>{final}</Text>);
      break;
    }
  }

  return <Text style={style}>{result}</Text>;
}

// Single verse block with Sanskrit, transliteration, and English translation
function VerseBlock({
  index,
  sanskrit,
  transliteration,
  translation,
  fontSize,
  colors,
  isLast,
  showSanskrit,
  showTransliteration,
  showTranslation,
}: {
  index: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  fontSize: number;
  colors: any;
  isLast: boolean;
  showSanskrit: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
}) {
  return (
    <View style={[styles.verseBlock, !isLast && styles.verseBlockBorder, { borderBottomColor: colors.border }]}>
      {/* Sanskrit */}
      {showSanskrit && sanskrit && (
        <Text style={[
          styles.sanskritText,
          {
            color: colors.text,
            fontSize: fontSize + 3,
            lineHeight: (fontSize + 3) * 1.5,
          }
        ]}>
          {sanskrit}
        </Text>
      )}

      {/* Transliteration */}
      {showTransliteration && transliteration && (
        <Text style={[
          styles.translitText,
          {
            color: colors.textSecondary,
            fontSize: fontSize - 2,
            lineHeight: (fontSize - 2) * 1.4,
          }
        ]}>
          {transliteration}
        </Text>
      )}

      {/* English Translation */}
      {showTranslation && translation && (
        <View style={[styles.translationBox, { backgroundColor: colors.background }]}>
          <Text style={[
            styles.translationText,
            {
              color: colors.text,
              fontSize: fontSize,
              lineHeight: fontSize * 1.6,
            }
          ]}>
            {translation}
          </Text>
        </View>
      )}
    </View>
  );
}

// Render a paragraph with proper formatting
function Paragraph({
  text,
  fontSize,
  color,
  italicColor,
  accentColor,
}: {
  text: string;
  fontSize: number;
  color: string;
  italicColor?: string;
  accentColor?: string;
}) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const isQuote = trimmed.startsWith('"') || trimmed.startsWith('"');

  return (
    <FormattedText
      text={trimmed}
      color={color}
      italicColor={italicColor}
      style={[
        styles.paragraph,
        {
          fontSize,
          lineHeight: fontSize * 1.8,
          marginBottom: fontSize,
        },
        isQuote && [styles.quote, { borderLeftColor: accentColor || '#E07A5F' }],
      ]}
    />
  );
}

// Section divider
function Divider({ color }: { color: string }) {
  return (
    <View style={styles.dividerContainer}>
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
      <Text style={[styles.dividerSymbol, { color }]}>॥</Text>
      <View style={[styles.dividerLine, { backgroundColor: color }]} />
    </View>
  );
}

// Locked content overlay
function LockedContent({
  colors,
  colorScheme,
  message,
  unlockTime,
  isCompact = false
}: {
  colors: any;
  colorScheme: 'light' | 'dark';
  message?: string;
  unlockTime?: string;
  isCompact?: boolean;
}) {
  if (isCompact) {
    return (
      <View style={[styles.lockedCompact, { backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#F5F5F5' }]}>
        <Text style={styles.lockedCompactEmoji}>🔒</Text>
        <Text style={[styles.lockedCompactText, { color: colors.textSecondary }]}>
          {message}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.lockedContainer, { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FAFAFA' }]}>
      <View style={[styles.lockedCard, { backgroundColor: colors.card }]}>
        <Text style={styles.lockedEmoji}>🔒</Text>
        <Text style={[styles.lockedTitle, { color: colors.text }]}>
          Content Locked
        </Text>
        {message && (
          <Text style={[styles.lockedText, { color: colors.textSecondary }]}>
            {message}
          </Text>
        )}
        {unlockTime && (
          <Text style={[styles.lockedTimer, { color: colors.accent }]}>
            Unlocks in {unlockTime}
          </Text>
        )}
      </View>
    </View>
  );
}

const WORDS_PER_MINUTE = 220;

export function SnippetContent({ snippet, isContentLocked = false, isPreviewLimited = false, unlockTime, lockMessage, onScrollProgress }: SnippetContentProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { state } = useApp();
  const { fontSize, showSanskrit, showTransliteration, showTranslation } = state.progress.settings;

  // Calculate total word count for the snippet
  const totalWordCount = useMemo(() => {
    const allText = [
      snippet.sanskrit,
      snippet.transliteration,
      snippet.verseTranslations.join(' '),
      snippet.commentary || '',
      snippet.reflection,
    ].join(' ');
    return allText.split(/\s+/).filter(word => word.length > 0).length;
  }, [snippet]);

  // Track scroll progress and calculate time remaining
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (onScrollProgress) {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollableHeight = contentSize.height - layoutMeasurement.height;
      if (scrollableHeight > 0) {
        const progress = Math.min(100, Math.round((contentOffset.y / scrollableHeight) * 100));
        const wordsRemaining = Math.round(totalWordCount * (1 - progress / 100));
        const minutesLeft = Math.max(1, Math.ceil(wordsRemaining / WORDS_PER_MINUTE));
        onScrollProgress(progress, minutesLeft);
      } else {
        // Content fits on screen, no scrolling needed
        onScrollProgress(100, 0);
      }
    }
  };

  // Split Sanskrit and transliteration into individual verses
  const sanskritVerses = useMemo(() => {
    return snippet.sanskrit.split(/\n\n+/).filter(v => v.trim());
  }, [snippet.sanskrit]);

  const translitVerses = useMemo(() => {
    return snippet.transliteration.split(/\n\n+/).filter(v => v.trim());
  }, [snippet.transliteration]);

  // Parse commentary into paragraphs
  const commentaryParagraphs = useMemo(() => {
    if (!snippet.commentary) return [];
    return snippet.commentary
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 0);
  }, [snippet.commentary]);

  // Parse reflection into paragraphs
  const reflectionParagraphs = useMemo(() => {
    return snippet.reflection
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 0);
  }, [snippet.reflection]);

  // Extract display title
  const displayTitle = snippet.title.replace(/^Day \d+:\s*/, '');

  // Match verses with translations
  const verseCount = Math.max(sanskritVerses.length, snippet.verseTranslations.length);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.chapterLabel, { color: colors.accent }]}>
          Chapter {snippet.chapter}
        </Text>
        <Text style={[styles.versesLabel, { color: colors.textSecondary }]}>
          Verses {snippet.verses}
        </Text>
        <Text style={[
          styles.title,
          {
            color: colors.text,
            fontSize: fontSize + 6,
            lineHeight: (fontSize + 6) * 1.3,
          }
        ]}>
          {displayTitle}
        </Text>
      </View>

      {/* Verses Section - For FUTURE_DAY (isContentLocked), only show first verse preview */}
      {isContentLocked ? (
        <>
          {/* Minimal preview for locked future content */}
          <View style={[styles.versesContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.versesAccent, { backgroundColor: colors.accent }]} />
            <View style={styles.versesContent}>
              {/* Only show first Sanskrit line as preview */}
              <Text style={[
                styles.sanskritText,
                {
                  color: colors.text,
                  fontSize: fontSize + 3,
                  lineHeight: (fontSize + 3) * 1.5,
                  opacity: 0.7,
                }
              ]}>
                {sanskritVerses[0]?.split('\n')[0] || ''}...
              </Text>
            </View>
          </View>
          <Divider color={colors.border} />
          <LockedContent colors={colors} colorScheme={colorScheme} message={lockMessage || "Complete earlier days to unlock."} />
        </>
      ) : (
        <>
          {/* Full verses for unlocked/preview content */}
          <View style={[styles.versesContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.versesAccent, { backgroundColor: colors.accent }]} />
            <View style={styles.versesContent}>
              {Array.from({ length: verseCount }).map((_, index) => (
                <VerseBlock
                  key={index}
                  index={index}
                  sanskrit={sanskritVerses[index] || ''}
                  transliteration={translitVerses[index] || ''}
                  translation={snippet.verseTranslations[index] || ''}
                  fontSize={fontSize}
                  colors={colors}
                  isLast={index === verseCount - 1}
                  showSanskrit={showSanskrit}
                  showTransliteration={showTransliteration}
                  showTranslation={showTranslation}
                />
              ))}
            </View>
          </View>
        </>
      )}

      {/* Commentary Section - only for non-locked content */}
      {isPreviewLimited && !isContentLocked ? (
        <>
          {/* NEXT_DAY: Show 3 paragraphs preview + lock with timer */}
          {commentaryParagraphs.length > 0 && (
            <>
              <Divider color={colors.border} />

              <View style={styles.commentarySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEmoji}>📖</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Commentary
                  </Text>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>Preview</Text>
                  </View>
                </View>

                <View style={styles.commentaryContent}>
                  {commentaryParagraphs.slice(0, 3).map((para, index) => (
                    <Paragraph
                      key={index}
                      text={para}
                      fontSize={fontSize}
                      color={colors.text}
                      italicColor={colors.accent}
                      accentColor={colors.accent}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <Divider color={colors.border} />
          <LockedContent colors={colors} colorScheme={colorScheme} unlockTime={unlockTime} />
        </>
      ) : !isContentLocked ? (
        <>
          {commentaryParagraphs.length > 0 && (
            <>
              <Divider color={colors.border} />

              <View style={styles.commentarySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEmoji}>📖</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Commentary
                  </Text>
                </View>

                <View style={styles.commentaryContent}>
                  {commentaryParagraphs.map((para, index) => (
                    <Paragraph
                      key={index}
                      text={para}
                      fontSize={fontSize}
                      color={colors.text}
                      italicColor={colors.accent}
                      accentColor={colors.accent}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <Divider color={colors.border} />

          {/* Reflection Section */}
          <View style={[styles.reflectionSection, { backgroundColor: colors.card }]}>
            <View style={styles.reflectionHeader}>
              <Text style={styles.reflectionEmoji}>🪷</Text>
              <Text style={[styles.reflectionTitle, { color: colors.accent }]}>
                Reflection
              </Text>
            </View>

            {reflectionParagraphs.map((para, index) => (
              <Text
                key={index}
                style={[
                  styles.reflectionText,
                  {
                    color: colors.text,
                    fontSize: fontSize,
                    lineHeight: fontSize * 1.7,
                    marginBottom: index < reflectionParagraphs.length - 1 ? fontSize : 0,
                  }
                ]}
              >
                {para}
              </Text>
            ))}
          </View>

          {/* Attribution */}
          <Text style={[styles.attribution, { color: colors.textSecondary }]}>
            Inspired by the teachings of Swami Chinmayananda
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },

  // Header
  header: {
    marginBottom: 24,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  versesLabel: {
    fontSize: 13,
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
    fontFamily: 'Georgia',
  },

  // Verses Container
  versesContainer: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  versesAccent: {
    width: 4,
  },
  versesContent: {
    flex: 1,
    padding: 20,
  },

  // Individual Verse Block
  verseBlock: {
    paddingBottom: 20,
    marginBottom: 20,
  },
  verseBlockBorder: {
    borderBottomWidth: 1,
  },
  sanskritText: {
    fontFamily: 'System',
    marginBottom: 8,
  },
  translitText: {
    fontStyle: 'italic',
    marginBottom: 12,
  },
  translationBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  translationText: {
    fontFamily: 'Georgia',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerSymbol: {
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: '300',
  },

  // Commentary
  commentarySection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentaryContent: {
    paddingLeft: 4,
  },

  // Paragraphs
  paragraph: {
    fontFamily: 'Georgia',
  },
  quote: {
    fontStyle: 'italic',
    paddingLeft: 16,
    borderLeftWidth: 3,
  },

  // Reflection
  reflectionSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  reflectionEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reflectionText: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
  },

  // Attribution
  attribution: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },

  // Locked Content
  lockedContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  lockedCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  lockedEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  lockedText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  lockedTimer: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
  lockedCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  lockedCompactEmoji: {
    fontSize: 20,
  },
  lockedCompactText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  previewBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  previewBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
