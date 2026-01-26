import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Snippet } from '@/types';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

interface TodayCardProps {
  snippet: Snippet;
  isCompleted: boolean;
  nextSnippet?: Snippet;
}

export function TodayCard({ snippet, isCompleted, nextSnippet }: TodayCardProps) {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const handleBeginReading = () => {
    router.push(`/reading/${snippet.id}`);
  };

  const handleReview = () => {
    router.push(`/reading/${snippet.id}?mode=review`);
  };

  const handlePreviewNext = () => {
    if (nextSnippet) {
      router.push(`/reading/${nextSnippet.id}?mode=preview`);
    }
  };

  // Extract display title (remove "Day X: " prefix)
  const displayTitle = snippet.title.replace(/^Day \d+:\s*/, '');
  const nextDisplayTitle = nextSnippet?.title.replace(/^Day \d+:\s*/, '');

  // Get first line of Sanskrit as preview
  const sanskritPreview = snippet.sanskrit.split('\n')[0];
  const truncatedSanskrit = sanskritPreview.length > 60
    ? sanskritPreview.substring(0, 60) + '...'
    : sanskritPreview;

  // COMPLETED STATE
  if (isCompleted) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Celebration Header */}
        <View style={styles.celebrationHeader}>
          <Text style={styles.celebrationEmoji}>✓</Text>
          <View style={styles.celebrationText}>
            <Text style={[styles.celebrationTitle, { color: colors.text }]}>
              You've read today!
            </Text>
            <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
              Beautiful. Come back tomorrow.
            </Text>
          </View>
        </View>

        {/* Up Next Section */}
        {nextSnippet && (
          <View style={[styles.upNextSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.upNextLabel, { color: colors.accent }]}>
              UP NEXT
            </Text>
            <Text style={[styles.upNextChapter, { color: colors.textSecondary }]}>
              Chapter {nextSnippet.chapter} · Verses {nextSnippet.verses}
            </Text>
            <Text style={[styles.upNextTitle, { color: colors.text }]}>
              {nextDisplayTitle}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.previewButton,
                { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handlePreviewNext}
            >
              <Text style={styles.previewButtonText}>Preview Tomorrow</Text>
              <Text style={styles.previewButtonSubtext}>~10 minutes</Text>
            </Pressable>
          </View>
        )}

        {/* Review Link */}
        <Pressable style={styles.reviewLink} onPress={handleReview}>
          <Text style={[styles.reviewLinkText, { color: colors.textSecondary }]}>
            Review Day {snippet.id} →
          </Text>
        </Pressable>
      </View>
    );
  }

  // NOT COMPLETED STATE
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Chapter and verse info */}
      <Text style={[styles.chapterLabel, { color: colors.accent }]}>
        CHAPTER {snippet.chapter} · Verses {snippet.verses}
      </Text>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {displayTitle}
      </Text>

      {/* Sanskrit preview - improved contrast */}
      <Text style={[styles.sanskritPreview, { color: colors.text, opacity: 0.7 }]}>
        {truncatedSanskrit}
      </Text>

      {/* CTA Button */}
      <Pressable
        style={({ pressed }) => [
          styles.ctaButton,
          { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={handleBeginReading}
      >
        <Text style={styles.ctaText}>Begin Today's Reading</Text>
        <Text style={styles.ctaSubtext}>~10 minutes</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  // NOT COMPLETED styles
  chapterLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 12,
    fontFamily: 'Georgia',
  },
  sanskritPreview: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
  },
  ctaSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },

  // COMPLETED styles
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  celebrationEmoji: {
    fontSize: 28,
    width: 56,
    height: 56,
    lineHeight: 56,
    textAlign: 'center',
    backgroundColor: '#4CAF50',
    color: '#FFF',
    borderRadius: 28,
    overflow: 'hidden',
  },
  celebrationText: {
    flex: 1,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  celebrationSubtitle: {
    fontSize: 15,
  },

  upNextSection: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 16,
  },
  upNextLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  upNextChapter: {
    fontSize: 12,
    marginBottom: 6,
  },
  upNextTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
    marginBottom: 20,
    lineHeight: 28,
  },
  previewButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 17,
  },
  previewButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 3,
  },

  reviewLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewLinkText: {
    fontSize: 14,
  },
});
