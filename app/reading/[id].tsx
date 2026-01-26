import React, { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SnippetContent } from '@/components/SnippetContent';
import { useSnippets } from '@/hooks/useSnippets';
import { useApp } from '@/contexts/AppContext';
import { useProgress } from '@/hooks/useProgress';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function ReadingScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  // Custom back button - goes back to previous screen (Home, Progress, etc.)
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
    });
  }, [navigation, router, colors.accent]);

  const { getSnippet } = useSnippets();
  const { markComplete, state } = useApp();
  const { completedSnippets, currentSnippet, readingHistory } = state.progress;
  const { recentlyCompletedMilestone, totalSnippets } = useProgress();

  const snippetId = parseInt(id || '1', 10);
  const snippet = useMemo(() => getSnippet(snippetId), [snippetId, getSnippet]);
  const isCompleted = completedSnippets.includes(snippetId);
  const isNextToRead = snippetId === currentSnippet;

  // Check if user has already read something today
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const hasReadToday = today in readingHistory;

  // === LOCK TYPE DETERMINATION ===
  // 1. REVIEW: Already completed - full access
  // 2. CURRENT: Today's reading (next to read, not yet completed) - full access, can mark complete
  // 3. NEXT_DAY: Tomorrow's content (time-locked until midnight) - preview with countdown
  // 4. FUTURE_DAY: Day 3+ content (progress-locked) - locked, no countdown

  const isReviewMode = isCompleted;
  const canMarkComplete = isNextToRead && !hasReadToday && !isCompleted;

  // NEXT_DAY: The very next snippet after completing today (time-locked)
  const isNextDay = hasReadToday && snippetId === currentSnippet && !isCompleted;

  // FUTURE_DAY: Any snippet beyond the next one (progress-locked, not time-locked)
  const isFutureDay = snippetId > currentSnippet && !isCompleted;

  // For badges
  const showPreviewBadge = isNextDay;
  const showLockedBadge = isFutureDay;

  // Content display logic
  const isContentLocked = isFutureDay; // Full lock, no content preview
  const isPreviewLimited = isNextDay; // Show 3 paragraphs preview

  // Timer for next chapter unlock (midnight)
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilMidnight(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const translateX = useSharedValue(0);
  const [showMilestone, setShowMilestone] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);

  // Only track progress for active reading (not completed, not locked)
  // Don't show progress for completed readings - it's meaningless
  const showReadingProgress = canMarkComplete;

  const handleScrollProgress = (progress: number, minutes: number) => {
    setReadingProgress(progress);
    setMinutesLeft(minutes);
  };

  const handleMarkComplete = () => {
    if (!canMarkComplete) return;

    markComplete(snippetId);

    // Check for milestone
    if (recentlyCompletedMilestone) {
      setShowMilestone(true);
      setTimeout(() => {
        setShowMilestone(false);
        // Go back to home after milestone celebration
        router.replace('/');
      }, 2000);
    } else {
      // Go back to home to show completed state
      setTimeout(() => {
        router.replace('/');
      }, 500);
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

  const onGestureEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
  };

  const onGestureEnd = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;

    if (translationX > SWIPE_THRESHOLD || velocityX > 500) {
      // Swipe right - go to previous
      translateX.value = withSpring(0);
      runOnJS(navigateToPrev)();
    } else if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
      // Swipe left - go to next
      translateX.value = withSpring(0);
      runOnJS(navigateToNext)();
    } else {
      translateX.value = withSpring(0);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }],
  }));

  if (!snippet) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Snippet not found
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

        {/* Snippet indicator - different layouts based on state */}
        <View style={styles.snippetIndicator}>
          <Text style={[styles.snippetNumber, { color: colors.textSecondary }]}>
            Day {snippetId} of {totalSnippets}
          </Text>

          {/* COMPLETED: Just show badge, no progress */}
          {isReviewMode && (
            <View style={[styles.modeBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.modeBadgeText}>Completed ✓</Text>
            </View>
          )}

          {/* ACTIVE READING: Show progress bar and percentage */}
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

          {/* PREVIEW (tomorrow's content) */}
          {showPreviewBadge && (
            <View style={[styles.modeBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.modeBadgeText}>Preview</Text>
            </View>
          )}

          {/* LOCKED (future content) */}
          {showLockedBadge && (
            <View style={[styles.modeBadge, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.modeBadgeText}>🔒 Locked</Text>
            </View>
          )}
        </View>

        {/* Timer banner - ONLY for NEXT_DAY (tomorrow's content, time-locked) */}
        {isNextDay && (
          <View style={[styles.timerBanner, { backgroundColor: colorScheme === 'dark' ? '#2D2D2D' : '#FFF8E1' }]}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              ⏰ Next chapter unlocks in {timeUntilMidnight}
            </Text>
          </View>
        )}

        {/* Content */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onEnded={onGestureEnd}
          activeOffsetX={[-20, 20]}
        >
          <Animated.View style={[styles.contentWrapper, animatedStyle]}>
            {/* key forces remount on navigation, resetting scroll position */}
            <SnippetContent
              key={snippetId}
              snippet={snippet}
              isContentLocked={isContentLocked}
              isPreviewLimited={isPreviewLimited}
              unlockTime={isNextDay ? timeUntilMidnight : undefined}
              lockMessage={isFutureDay ? `Complete Day ${currentSnippet} first` : undefined}
              onScrollProgress={showReadingProgress ? handleScrollProgress : undefined}
            />
          </Animated.View>
        </PanGestureHandler>

        {/* Bottom actions */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card }]}>
          <View style={styles.navigation}>
            <Pressable
              style={[
                styles.navButton,
                snippetId <= 1 && styles.navButtonDisabled,
              ]}
              onPress={navigateToPrev}
              disabled={snippetId <= 1}
            >
              <Text
                style={[
                  styles.navButtonText,
                  { color: snippetId > 1 ? colors.accent : colors.textSecondary },
                ]}
              >
                Previous
              </Text>
            </Pressable>

            {/* Show different button based on mode */}
            {isReviewMode ? (
              <View style={[styles.completedIndicator, { backgroundColor: colorScheme === 'dark' ? '#1B3D1B' : '#E8F5E9' }]}>
                <Text style={styles.completedIndicatorText}>
                  ✓ Already Read
                </Text>
              </View>
            ) : isNextDay ? (
              <View style={[styles.previewIndicator, { backgroundColor: colors.card, borderColor: colors.accent }]}>
                <Text style={[styles.previewIndicatorText, { color: colors.accent }]}>
                  Come Back Tomorrow
                </Text>
              </View>
            ) : isFutureDay ? (
              <Pressable
                style={({ pressed }) => [
                  styles.goToButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => router.replace(`/reading/${currentSnippet}`)}
              >
                <Text style={styles.goToButtonText}>Go to Day {currentSnippet}</Text>
              </Pressable>
            ) : canMarkComplete ? (
              <Pressable
                style={({ pressed }) => [
                  styles.completeButton,
                  {
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={handleMarkComplete}
              >
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </Pressable>
            ) : (
              <View style={[styles.previewIndicator, { backgroundColor: colors.card, borderColor: colors.textSecondary }]}>
                <Text style={[styles.previewIndicatorText, { color: colors.textSecondary }]}>
                  Not Available
                </Text>
              </View>
            )}

            <Pressable
              style={[
                styles.navButton,
                snippetId >= totalSnippets && styles.navButtonDisabled,
              ]}
              onPress={navigateToNext}
              disabled={snippetId >= totalSnippets}
            >
              <Text
                style={[
                  styles.navButtonText,
                  { color: snippetId < totalSnippets ? colors.accent : colors.textSecondary },
                ]}
              >
                Next
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Milestone celebration overlay */}
        {showMilestone && (
          <View style={styles.milestoneOverlay}>
            <View style={[styles.milestoneCard, { backgroundColor: colors.card }]}>
              <Text style={styles.milestoneEmoji}>🎉</Text>
              <Text style={[styles.milestoneTitle, { color: colors.text }]}>
                Milestone Achieved!
              </Text>
              <Text style={[styles.milestoneText, { color: colors.textSecondary }]}>
                You've completed {recentlyCompletedMilestone} days!
              </Text>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    height: 4,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  snippetIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  snippetNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readingProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readingProgressBg: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  readingProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  readingProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  timerBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentWrapper: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  goToButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  goToButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  previewIndicator: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
  },
  previewIndicatorText: {
    fontWeight: '600',
    fontSize: 14,
  },
  completedIndicator: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  completedIndicatorText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
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
  milestoneCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  milestoneEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  milestoneTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  milestoneText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
