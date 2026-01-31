import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Snippet } from '@/types';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { HighlightText } from '@/components/snippet/HighlightText';
import { VerseBlock } from '@/components/snippet/VerseBlock';
import { Paragraph } from '@/components/snippet/Paragraph';
import { Divider } from '@/components/snippet/Divider';
import { LockedContent } from '@/components/snippet/LockedContent';

interface SnippetContentProps {
  snippet: Snippet;
  isContentLocked?: boolean;
  isPreviewLimited?: boolean;
  unlockTime?: string;
  lockMessage?: string;
  onScrollProgress?: (progress: number, minutesLeft: number) => void;
  highlightQuery?: string;
  highlightSection?: string;
}

const WORDS_PER_MINUTE = 220;

export function SnippetContent({ snippet, isContentLocked = false, isPreviewLimited = false, unlockTime, lockMessage, onScrollProgress, highlightQuery, highlightSection }: SnippetContentProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t, language } = useLanguage();
  const { state } = useApp();
  const { fontSize, showSanskrit, showTransliteration, showTranslation } = state.progress.settings;

  const scrollRef = useRef<ScrollView>(null);
  const [isHighlightActive, setIsHighlightActive] = useState(!!highlightQuery);
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => {
    if (!highlightQuery) {
      setIsHighlightActive(false);
      return;
    }
    setIsHighlightActive(true);
    pendingScroll.current = highlightSection && highlightSection !== 'Title' ? highlightSection : null;
    const fadeTimer = setTimeout(() => setIsHighlightActive(false), 3500);
    return () => clearTimeout(fadeTimer);
  }, [highlightQuery, highlightSection]);

  const onSectionLayout = useCallback((section: string, y: number) => {
    if (pendingScroll.current === section && scrollRef.current) {
      pendingScroll.current = null;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
      }, 300);
    }
  }, []);

  const totalWordCount = useMemo(() => {
    const allText = [
      snippet.sanskrit, snippet.transliteration,
      snippet.verseTranslations.join(' '),
      snippet.commentary || '', snippet.reflection,
    ].join(' ');
    return allText.split(/\s+/).filter(word => word.length > 0).length;
  }, [snippet]);

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
        onScrollProgress(100, 0);
      }
    }
  };

  const sanskritVerses = useMemo(() => snippet.sanskrit.split(/\n\n+/).filter(v => v.trim()), [snippet.sanskrit]);
  const translitVerses = useMemo(() => snippet.transliteration.split(/\n\n+/).filter(v => v.trim()), [snippet.transliteration]);

  const commentaryParagraphs = useMemo(() => {
    if (!snippet.commentary) return [];
    return snippet.commentary.split(/\n\n+/).map(p => p.replace(/\n/g, ' ').trim()).filter(p => p.length > 0);
  }, [snippet.commentary]);

  const reflectionParagraphs = useMemo(() => {
    return snippet.reflection.split(/\n\n+/).map(p => p.replace(/\n/g, ' ').trim()).filter(p => p.length > 0);
  }, [snippet.reflection]);

  const displayTitle = snippet.title.replace(/^Day \d+:\s*/, '');
  const verseCount = Math.max(sanskritVerses.length, snippet.verseTranslations.length);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.chapterLabel, { color: colors.accent }]}>
          {t('common.chapter')} {snippet.chapter}
        </Text>
        <Text style={[styles.versesLabel, { color: colors.textSecondary }]}>
          {t('common.verses')} {snippet.verses}
        </Text>
        <HighlightText
          text={displayTitle}
          query={isHighlightActive ? highlightQuery : undefined}
          color={colors.text}
          style={[styles.title, { fontSize: fontSize + 6, lineHeight: (fontSize + 6) * 1.3 }]}
        />
      </View>

      {/* Verses */}
      {isContentLocked ? (
        <>
          <View style={[styles.versesContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.versesAccent, { backgroundColor: colors.accent }]} />
            <View style={styles.versesContent}>
              <Text selectable style={[styles.sanskritPreview, { color: colors.text, fontSize: fontSize + 3, lineHeight: (fontSize + 3) * 1.5 }]}>
                {sanskritVerses[0]?.split('\n')[0] || ''}...
              </Text>
            </View>
          </View>
          <Divider color={colors.border} />
          <LockedContent colors={colors} colorScheme={colorScheme} message={lockMessage || t('snippet.completeEarlier')} />
        </>
      ) : (
        <>
          <View
            style={[styles.versesContainer, { backgroundColor: colors.card }]}
            onLayout={(e) => onSectionLayout('Verse', e.nativeEvent.layout.y)}
          >
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
                  highlightQuery={isHighlightActive ? highlightQuery : undefined}
                />
              ))}
            </View>
          </View>
        </>
      )}

      {/* Commentary + Reflection */}
      {isPreviewLimited && !isContentLocked ? (
        <>
          {commentaryParagraphs.length > 0 && (
            <>
              <Divider color={colors.border} />
              <View style={styles.commentarySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEmoji}>📖</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('snippet.commentary')}</Text>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>{t('snippet.preview')}</Text>
                  </View>
                </View>
                <View style={styles.commentaryContent}>
                  {commentaryParagraphs.slice(0, 3).map((para, index) => (
                    <Paragraph key={index} text={para} fontSize={fontSize} color={colors.text} italicColor={colors.accent} accentColor={colors.accent} />
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
              <View style={styles.commentarySection} onLayout={(e) => onSectionLayout('Commentary', e.nativeEvent.layout.y)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionEmoji}>📖</Text>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('snippet.commentary')}</Text>
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
                      highlightQuery={isHighlightActive ? highlightQuery : undefined}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <Divider color={colors.border} />

          <View
            style={[styles.reflectionSection, { backgroundColor: colors.card }]}
            onLayout={(e) => onSectionLayout('Reflection', e.nativeEvent.layout.y)}
          >
            <View style={styles.reflectionHeader}>
              <Text style={styles.reflectionEmoji}>🪷</Text>
              <Text style={[styles.reflectionTitle, { color: colors.accent }]}>{t('snippet.reflection')}</Text>
            </View>
            {reflectionParagraphs.map((para, index) => (
              <HighlightText
                key={index}
                text={para}
                query={isHighlightActive ? highlightQuery : undefined}
                color={colors.text}
                style={[
                  styles.reflectionText,
                  { fontSize, lineHeight: fontSize * 1.7 * (language === 'hi' ? 1.1 : 1), marginBottom: index < reflectionParagraphs.length - 1 ? fontSize : 0 },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.attribution, { color: colors.textSecondary }]}>
            {t('snippet.inspiredBy')}
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 24 },
  chapterLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  versesLabel: { fontSize: 13, marginBottom: 10 },
  title: { fontWeight: '700', fontFamily: 'Georgia' },
  versesContainer: { borderRadius: 16, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  versesAccent: { width: 4 },
  versesContent: { flex: 1, padding: 20 },
  sanskritPreview: { fontFamily: 'System', opacity: 0.7 },
  commentarySection: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionEmoji: { fontSize: 20, marginRight: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  commentaryContent: { paddingLeft: 4 },
  reflectionSection: { borderRadius: 16, padding: 20, marginBottom: 24 },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  reflectionEmoji: { fontSize: 22, marginRight: 10 },
  reflectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  reflectionText: { fontFamily: 'Georgia', fontStyle: 'italic' },
  attribution: { fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginBottom: 20 },
  previewBadge: { backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  previewBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});
