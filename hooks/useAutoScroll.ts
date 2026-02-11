import { useState, useRef, useCallback, useEffect } from 'react';
import type { ScrollView } from 'react-native';

const SCROLL_RESUME_DELAY_MS = 8000;
const SCROLL_AWAY_THRESHOLD = 250; // px — only show pill when scrolled this far from narration

// Where on screen (from top) the active paragraph should land after auto-scroll
const DESIRED_SCREEN_Y = 200;

interface UseAutoScrollOptions {
  scrollRef: React.MutableRefObject<ScrollView | null>;
  isAudioActive: boolean;
}

export function useAutoScroll({
  scrollRef,
  isAudioActive,
}: UseAutoScrollOptions) {
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isScrolledAway, setIsScrolledAway] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollYRef = useRef(0);
  const lastTargetScrollY = useRef(0);
  const lastMeasuredPageY = useRef(0);

  // User started dragging — pause auto-scroll
  const onUserScrollBegin = useCallback(() => {
    setIsUserScrolling(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setIsUserScrolling(false);
      setIsScrolledAway(false);
    }, SCROLL_RESUME_DELAY_MS);
  }, []);

  // Track scroll position for pill direction calculation
  const onScrollPosition = useCallback((y: number) => {
    scrollYRef.current = y;
    if (!isUserScrolling) return;
    const distance = Math.abs(y - lastTargetScrollY.current);
    const far = distance > SCROLL_AWAY_THRESHOLD;
    setIsScrolledAway(prev => prev !== far ? far : prev);
  }, [isUserScrolling]);

  // Called by SnippetContent when the active paragraph's screen pageY is measured
  const onActiveParagraphPageY = useCallback((pageY: number) => {
    lastMeasuredPageY.current = pageY;
    const targetScrollY = scrollYRef.current + (pageY - DESIRED_SCREEN_Y);
    const clampedTarget = Math.max(0, targetScrollY);
    lastTargetScrollY.current = clampedTarget;

    if (!isUserScrolling && isAudioActive) {
      scrollRef.current?.scrollTo({ y: clampedTarget, animated: true });
    }
  }, [isUserScrolling, isAudioActive, scrollRef]);

  // Scroll back to narration position (for "Now" pill)
  const scrollBackToNarration = useCallback(() => {
    setIsUserScrolling(false);
    setIsScrolledAway(false);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    // Re-measure: compute target from last known pageY
    // Since we can't re-measure here directly, use the last target
    scrollRef.current?.scrollTo({ y: lastTargetScrollY.current, animated: true });
  }, [scrollRef]);

  // Reset when audio stops
  useEffect(() => {
    if (!isAudioActive) {
      setIsUserScrolling(false);
      setIsScrolledAway(false);
      lastTargetScrollY.current = 0;
    }
  }, [isAudioActive]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  // Direction: is narration above or below current scroll?
  const narrationDirection: 'up' | 'down' = scrollYRef.current > lastTargetScrollY.current ? 'up' : 'down';

  return {
    showBackToNarration: isAudioActive && isUserScrolling && isScrolledAway,
    narrationDirection,
    onUserScrollBegin,
    onScrollPosition,
    onActiveParagraphPageY,
    scrollBackToNarration,
  };
}
