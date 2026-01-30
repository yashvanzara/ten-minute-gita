import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export interface NotificationContent {
  title: string;
  body: string;
}

export const generateNotificationContent = (
  currentSnippet: number,
  snippetTitle: string,
  streak: number,
  t?: (key: string, params?: Record<string, string | number>) => string
): NotificationContent => {
  // Positive, inviting messages - never use negative language
  if (t) {
    if (streak === 0) {
      return {
        title: t('notifications.beginJourney'),
        body: t('notifications.dayIntro', { day: 1, title: snippetTitle }),
      };
    } else {
      return {
        title: t('notifications.dayReady', { day: currentSnippet }),
        body: t('notifications.keepGoing', { title: snippetTitle, streak }),
      };
    }
  }

  if (streak === 0) {
    return {
      title: 'Begin your journey today',
      body: `Day 1: ${snippetTitle} · Just 10 minutes`,
    };
  } else if (streak >= 1 && streak <= 6) {
    return {
      title: `Day ${currentSnippet} is ready 🙏`,
      body: `${snippetTitle} · Keep your ${streak}-day journey going`,
    };
  } else {
    return {
      title: `Day ${currentSnippet} awaits 🙏`,
      body: `${streak} days strong · Today: ${snippetTitle}`,
    };
  }
};

export const scheduleDailyReminder = async (
  time: string,
  currentSnippet: number,
  snippetTitle: string,
  streak: number,
  t?: (key: string, params?: Record<string, string | number>) => string
): Promise<string | null> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // Cancel existing notifications
  await cancelAllNotifications();

  const [hours, minutes] = time.split(':').map(Number);

  const { title, body } = generateNotificationContent(currentSnippet, snippetTitle, streak, t);

  const trigger: Notifications.NotificationTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: hours,
    minute: minutes,
  };

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger,
  });

  return identifier;
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};
