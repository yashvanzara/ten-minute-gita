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
  // Share card
  SHARE_CARD: {
    SIZE: 1080,
    WATERMARK_OPACITY: 0.5,
    MAX_TEXT_LINES: 8,
    TEXT_SCALE_MIN: 0.7,
    TEXT_SCALE_MAX: 1.2,
    TEXT_SCALE_STEP: 0.1,
    PADDING: 80,
    GRADIENTS: [
      {
        name: 'Saffron Sunrise',
        colors: ['#E07A5F', '#C45B3E'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 1, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Sacred Dusk',
        colors: ['#2C3E6B', '#7B5EA7'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 1, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Lotus Dawn',
        colors: ['#D4A0A0', '#F5E6CA'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 0.5, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Forest Wisdom',
        colors: ['#2D6A4F', '#95D5B2'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 1, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Midnight Gold',
        colors: ['#1B1B2F', '#C6963C'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 0.5, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Ocean Depth',
        colors: ['#0D324D', '#7F5A83'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 1, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Clay Earth',
        colors: ['#8B5E3C', '#D4A574'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 1, y: 1 } as { x: number; y: number },
      },
      {
        name: 'Peacock',
        colors: ['#004E64', '#25A18E'] as [string, string],
        start: { x: 0, y: 0 } as { x: number; y: number },
        end: { x: 1, y: 1 } as { x: number; y: number },
      },
    ],
  },
} as const;

export type Config = typeof CONFIG;
