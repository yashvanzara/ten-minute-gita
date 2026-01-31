import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export function useSwipeNavigation(onPrev: () => void, onNext: () => void) {
  const translateX = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const snapBack = () => {
    translateX.value = reducedMotion
      ? withTiming(0, { duration: 0 })
      : withSpring(0);
  };

  const onGestureEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
  };

  const onGestureEnd = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;

    if (translationX > SWIPE_THRESHOLD || velocityX > 500) {
      snapBack();
      runOnJS(onPrev)();
    } else if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
      snapBack();
      runOnJS(onNext)();
    } else {
      snapBack();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reducedMotion ? 0 : translateX.value * 0.3 }],
  }));

  return { onGestureEvent, onGestureEnd, animatedStyle };
}
