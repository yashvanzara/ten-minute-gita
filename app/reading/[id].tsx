import React, { useMemo, useState, useLayoutEffect, useEffect } from 'react';
import { MILESTONES } from '@/types';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SnippetContent } from '@/components/SnippetContent';
import { ReadingMenu } from '@/components/ReadingMenu';
import { NavigationControls } from '@/components/reading/NavigationControls';
import { useMidnightTimer } from '@/components/reading/MidnightTimer';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useSnippets } from '@/hooks/useSnippets';
import { useApp } from '@/contexts/AppContext';
import { getDateString } from '@/utils/storage';
import { useProgress } from '@/hooks/useProgress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFirstTimeUser } from '@/contexts/FTUEContext';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { CONFIG } from '@/constants/config';
import { getSearchHighlight } from '@/utils/searchHighlight';
import { trackScreenView } from '@/utils/sentry';

let _lastConsumedHighlightId = 0;

export default function ReadingScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { hasCompletedFirstReading, markFirstReadingComplete } = useFirstTimeUser();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 16 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 17 }}>Back</Text>
        </Pressable>
      ),
      headerRight: () => <ReadingMenu />,
    });
  }, [navigation, router, colors.accent]);

  const { getSnippet } = useSnippets();
  const { markComplete, state } = useApp();
  const { completedSnippets, currentSnippet, readingHistory } = state.progress;
  const { totalSnippets } = useProgress();

  const snippetId = parseInt(id || '1', 10);
  const snippet = useMemo(() => getSnippet(snippetId), [snippetId, getSnippet]);

  useEffect(() => {
    trackScreenView('Reading', { day: snippetId });
  }, [snippetId]);

  // Read search highlight — module-level counter ensures each setSearchHighlight
  // is consumed exactly once, regardless of component mount/unmount/remount.
  const [searchHighlight, setSearchHighlightState] = useState<{ query: string; section: string } | null>(() => {
    const h = getSearchHighlight();
    if (h && h.id !== _lastConsumedHighlightId) {
      _lastConsumedHighlightId = h.id;
      return { query: h.query, section: h.section };
    }
    return null;
  });
  const isCompleted = completedSnippets.includes(snippetId);
  const isNextToRead = snippetId === currentSnippet;

  const today = getDateString();
  const hasReadToday = today in readingHistory;

  const isReviewMode = isCompleted;
  const canMarkComplete = isNextToRead && !hasReadToday && !isCompleted;
  const isNextDay = hasReadToday && snippetId === currentSnippet && !isCompleted;
  const isFutureDay = snippetId > currentSnippet && !isCompleted;
  const showPreviewBadge = isNextDay;
  const showLockedBadge = isFutureDay;
  const isContentLocked = isFutureDay;
  const isPreviewLimited = isNextDay;

  const timeUntilMidnight = useMidnightTimer();

  const [showMilestone, setShowMilestone] = useState(false);
  const [achievedMilestone, setAchievedMilestone] = useState<number | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);

  const showReadingProgress = canMarkComplete;

  const handleScrollProgress = (progress: number, minutes: number) => {
    setReadingProgress(progress);
    setMinutesLeft(minutes);
  };

  const navigateHome = () => {
    router.replace('/');
  };

  const handleMarkComplete = () => {
    if (!canMarkComplete) return;

    const newCompletedCount = completedSnippets.length + 1;
    const milestone = MILESTONES.find(m => m === newCompletedCount);

    markComplete(snippetId);

    if (!hasCompletedFirstReading && newCompletedCount === 1) {
      markFirstReadingComplete();
    }

    // Prompt for App Store rating at Day 3 or Day 7
    if (newCompletedCount === 3 || newCompletedCount === 7) {
      import('expo-store-review').then(async (StoreReview) => {
        try {
          if (await StoreReview.isAvailableAsync()) {
            await StoreReview.requestReview();
          }
        } catch { /* store review not critical */ }
      });
    }

    if (milestone) {
      setAchievedMilestone(milestone);
      setShowMilestone(true);
      setTimeout(() => {
        setShowMilestone(false);
        setAchievedMilestone(null);
        navigateHome();
      }, 3000);
    } else {
      setTimeout(navigateHome, 500);
    }
  };

  const navigateToPrev = () => {
    if (snippetId > 1) {
      router.replace(`/reading/${snippetId - 1}`);
    }
  };

  const navigateToNext = () => {
    if (snippetId < totalSnippets) {
      router.replace(`/reading/${snippetId + 1}`);
    }
  };

  const { onGestureEvent, onGestureEnd, animatedStyle } = useSwipeNavigation(navigateToPrev, navigateToNext);

  if (!snippet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {t('reading.snippetNotFound')}
        </Text>
      </View>
    );
  }

  const progressPercent = Math.round((snippetId / totalSnippets) * 100);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Progress bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.accent, width: `${progressPercent}%` },
            ]}
          />
        </View>

        {/* Snippet indicator */}
        <View style={styles.snippetIndicator}>
          <Text style={[styles.snippetNumber, { color: colors.textSecondary }]}>
            {t('reading.dayOfTotal', { day: snippetId, total: totalSnippets })}
          </Text>

          {isReviewMode && (
            <View style={[styles.modeBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.modeBadgeText}>{t('reading.completed')}</Text>
            </View>
          )}

          {canMarkComplete && (
            <View style={styles.readingProgressContainer}>
              <View style={[styles.readingProgressBg, { backgroundColor: colorScheme === 'dark' ? '#404040' : '#E8E8E8' }]}>
                <View
                  style={[
                    styles.readingProgressFill,
                    { backgroundColor: colors.accent, width: `${readingProgress}%` },
                  ]}
                />
              </View>
              <Text style={[styles.readingProgressText, { color: colors.textSecondary }]}>
                {readingProgress}%{minutesLeft > 0 ? ` (${minutesLeft} min left)` : ''}
              </Text>
            </View>
          )}

          {showPreviewBadge && (
            <View style={[styles.modeBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.modeBadgeText}>{t('snippet.preview')}</Text>
            </View>
          )}

          {showLockedBadge && (
            <View style={[styles.modeBadge, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.modeBadgeText}>🔒 Locked</Text>
            </View>
          )}
        </View>

        {isNextDay && (
          <View style={[styles.timerBanner, { backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#FFF8E1' }]}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {t('reading.nextChapterUnlocks', { time: timeUntilMidnight })}
            </Text>
          </View>
        )}

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onEnded={onGestureEnd}
          activeOffsetX={[-CONFIG.SWIPE_ACTIVE_OFFSET_X, CONFIG.SWIPE_ACTIVE_OFFSET_X]}
          failOffsetY={[-CONFIG.SWIPE_FAIL_OFFSET_Y, CONFIG.SWIPE_FAIL_OFFSET_Y]}
        >
          <Animated.View style={[styles.contentWrapper, animatedStyle]}>
            <SnippetContent
              key={snippetId}
              snippet={snippet}
              isContentLocked={isContentLocked}
              isPreviewLimited={isPreviewLimited}
              unlockTime={isNextDay ? timeUntilMidnight : undefined}
              lockMessage={isFutureDay ? t('reading.completeDayFirst', { day: currentSnippet }) : undefined}
              onScrollProgress={showReadingProgress ? handleScrollProgress : undefined}
              highlightQuery={searchHighlight?.query}
              highlightSection={searchHighlight?.section}
            />
          </Animated.View>
        </PanGestureHandler>

        <NavigationControls
          snippetId={snippetId}
          totalSnippets={totalSnippets}
          currentSnippet={currentSnippet}
          isReviewMode={isReviewMode}
          isNextDay={isNextDay}
          isFutureDay={isFutureDay}
          canMarkComplete={canMarkComplete}
          colorScheme={colorScheme}
          colors={colors}
          t={t}
          onPrev={navigateToPrev}
          onNext={navigateToNext}
          onMarkComplete={handleMarkComplete}
          onGoToDay={(day) => router.replace(`/reading/${day}`)}
        />

        {showMilestone && achievedMilestone && (
          <View style={styles.milestoneOverlay}>
            <View style={[styles.milestoneCard, { backgroundColor: colors.card }]}>
              <Text style={styles.milestoneEmoji}>🎉</Text>
              <Text style={[styles.milestoneTitle, { color: colors.text }]}>
                {achievedMilestone === 1 && t('milestone.firstStep')}
                {achievedMilestone === 3 && t('milestone.threeDays')}
                {achievedMilestone === 7 && t('milestone.oneWeek')}
                {achievedMilestone === 30 && t('milestone.oneMonth')}
                {achievedMilestone === 100 && t('milestone.hundredDays')}
                {achievedMilestone === 239 && t('milestone.journeyComplete')}
              </Text>
              <Text style={[styles.milestoneText, { color: colors.textSecondary }]}>
                {achievedMilestone === 1 && t('milestone.journeyBegins')}
                {achievedMilestone === 3 && t('milestone.builtMomentum')}
                {achievedMilestone === 7 && t('milestone.weekOfWisdom')}
                {achievedMilestone === 30 && t('milestone.monthDedication')}
                {achievedMilestone === 100 && t('milestone.hundredGrowth')}
                {achievedMilestone === 239 && t('milestone.completedGita')}
              </Text>
              <Text style={[styles.milestoneContinue, { color: colors.accent }]}>
                {achievedMilestone === 239 ? t('milestone.hariOm') : t('milestone.keepGoing')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { height: 4, width: '100%' },
  progressBar: { height: '100%' },
  snippetIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  snippetNumber: { fontSize: 14, fontWeight: '500' },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  readingProgressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readingProgressBg: { width: 80, height: 6, borderRadius: 3, overflow: 'hidden' },
  readingProgressFill: { height: '100%', borderRadius: 3 },
  readingProgressText: { fontSize: 12, fontWeight: '500' },
  timerBanner: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  timerText: { fontSize: 13, fontWeight: '500' },
  modeBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  contentWrapper: { flex: 1 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 100 },
  milestoneOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCard: { padding: 32, borderRadius: 20, alignItems: 'center', marginHorizontal: 32 },
  milestoneEmoji: { fontSize: 64, marginBottom: 16 },
  milestoneTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  milestoneText: { fontSize: 16, textAlign: 'center' },
  milestoneContinue: { fontSize: 18, fontWeight: '600', marginTop: 16 },
});
