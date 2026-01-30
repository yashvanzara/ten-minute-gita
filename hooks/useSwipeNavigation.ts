import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export function useSwipeNavigation(onPrev: () => void, onNext: () => void) {
  const translateX = useSharedValue(0);

  const onGestureEvent = (event: any) => {
    translateX.value = event.nativeEvent.translationX;
  };

  const onGestureEnd = (event: any) => {
    const { translationX, velocityX } = event.nativeEvent;

    if (translationX > SWIPE_THRESHOLD || velocityX > 500) {
      translateX.value = withSpring(0);
      runOnJS(onPrev)();
    } else if (translationX < -SWIPE_THRESHOLD || velocityX < -500) {
      translateX.value = withSpring(0);
      runOnJS(onNext)();
    } else {
      translateX.value = withSpring(0);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }],
  }));

  return { onGestureEvent, onGestureEnd, animatedStyle };
}
