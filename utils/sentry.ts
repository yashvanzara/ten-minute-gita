import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    enabled: !__DEV__,
  });
}

/** Log a screen view breadcrumb */
export function trackScreenView(screen: string, params?: Record<string, string | number>) {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Viewed ${screen}`,
    data: params,
    level: 'info',
  });
}

/** Log a user action breadcrumb */
export function trackEvent(event: string, data?: Record<string, string | number>) {
  Sentry.addBreadcrumb({
    category: 'user',
    message: event,
    data,
    level: 'info',
  });
}

export { Sentry };
