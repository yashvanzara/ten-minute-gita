export const CONFIG = {
  // Streak logic
  GRACE_PERIOD_HOURS: 4,

  // Gesture thresholds
  SWIPE_ACTIVE_OFFSET_X: 30,
  SWIPE_FAIL_OFFSET_Y: 10,

  // Timer
  TIMER_UPDATE_INTERVAL_MS: 60000,

  // Storage keys
  STORAGE_KEY: '@gita_app_progress',
  FTUE_KEY: '@ftue_state',
  LANGUAGE_KEY: '@language',
} as const;

export type Config = typeof CONFIG;
