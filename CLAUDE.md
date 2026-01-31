# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**10 Minute Gita** — A React Native / Expo app that guides users through the Bhagavad Gita in 239 daily readings (~10 minutes each). Supports English and Hindi. Uses Expo Router (file-based routing), AsyncStorage for persistence, and `useReducer` for state management.

## Commands

```bash
npx expo start          # Start dev server (Expo Go)
npx tsc --noEmit        # Type-check (run after every change)
npx expo run:ios        # Native iOS build
npx expo run:android    # Native Android build
npm test                # Run Jest tests
npx jest --watch        # Watch mode
```

## Architecture

### Routing (Expo Router)

- `app/_layout.tsx` — Root layout, nests providers: `LanguageProvider > FTUEProvider > AppProvider > RootLayoutNav`
- `app/(tabs)/` — Tab navigator: Home (`index.tsx`), Progress (`progress.tsx`), Settings (`settings.tsx`)
- `app/reading/[id].tsx` — Reading screen for day 1–239, supports swipe navigation
- `app/completed-readings.tsx` — Full-screen search page for all completed readings (search across title, verses, commentary, reflection, Sanskrit, transliteration)

### State & Data

- **AppContext** (`contexts/AppContext.tsx`) — Thin wrapper around `useReducer` with `reducers/appReducer.ts`. Manages progress, streak, settings, loading state. Dispatches: `SET_PROGRESS`, `MARK_COMPLETE`, `UPDATE_SETTINGS`, `USE_STREAK_FREEZE`, `RESET_PROGRESS`, `SIMULATE_PROGRESS`, `SYNC_STREAK`.
- **LanguageContext** — Provides `language` (en/hi) and `t(key, params?)` function. Persists to AsyncStorage.
- **FTUEContext** — First-time user experience flow state. Persists to AsyncStorage.
- **AsyncStorage keys:** `@gita_app_progress`, `@ftue_state`, `@language` (defined in `constants/config.ts`)
- **Content data:** `data/gita_snippets.json` (EN), `data/gita_snippets_hindi.json` (HI) — 239 snippets with Sanskrit verses, transliteration, translation, commentary, reflection. Hindi verse translations were extracted from commentary fields; titles have "Day N:" / "दिन N:" prefixes stripped.
- **Search highlight:** `utils/searchHighlight.ts` — Module-level global store with monotonic counter. `setSearchHighlight()` before navigation, `getSearchHighlight()` on mount in reading screen. Module-level `_lastConsumedHighlightId` in `reading/[id].tsx` ensures each highlight is consumed exactly once across component mounts.

### Key Files by Size

| File | Lines | Notes |
|------|-------|-------|
| `components/SnippetContent.tsx` | ~274 | Renders verse content, search highlighting, auto-scroll (sub-components in `components/snippet/`) |
| `app/reading/[id].tsx` | ~330 | Reading screen with swipe nav, search highlight consumption |
| `app/completed-readings.tsx` | ~400 | Search page with debounced full-text search, context previews |
| `components/TodayCard.tsx` | 263 | Home screen CTA card |
| `components/NotificationPrompt.tsx` | 259 | FTUE notification prompt |
| `app/(tabs)/index.tsx` | 241 | Home screen |
| `components/CalendarHeatmap.tsx` | 239 | Reading history calendar |

### Translations

Split into `constants/translations/en.ts` and `constants/translations/hi.ts`. Keys use dot notation (`settings.fontSize`). Interpolation uses `{{param}}` syntax. The `t()` function from LanguageContext always returns `string` (not `string | string[]`).

## Business Logic

### Streak System
- Tracked as `current` and `longest` in progress state
- `isYesterday()` in `utils/storage.ts` includes a **4-hour grace period** (midnight–4 AM counts as "yesterday")
- `SYNC_STREAK` dispatched on app startup — resets streak to 0 if lastReadDate is stale
- Streak freezes: users get freezes to preserve streak on missed days

### Content Locking
- `REVIEW` — already completed, always accessible
- `CURRENT` — today's reading
- `NEXT_DAY` — time-locked (unlocks at midnight)
- `FUTURE_DAY` — progress-locked (must complete earlier days)

### FTUE Flow
`welcome → first reading → notification prompt → complete`

## Conventions

- **Config constants** go in `constants/config.ts` (no magic numbers in components)
- **Logging** uses `utils/logger.ts` which guards behind `__DEV__` — never use bare `console.error/warn/log`
- **Settings screen** is composed of 5 sub-components in `components/settings/`
- **Reading screen** uses extracted hooks: `useMidnightTimer`, `useSwipeNavigation`
- **Header back button** pattern: use `useLayoutEffect` + `navigation.setOptions` with `headerBackVisible: false` and custom `headerLeft` using `Ionicons chevron-back` (not inline Stack.Screen options)
- `expo-store-review` must be **dynamically imported** (`await import(...)`) with try/catch — it crashes in Expo Go if imported at top level
- Theme colors defined in `constants/Colors.ts` with `light` and `dark` variants

## Deployment

```bash
npx eas-cli build --platform ios --profile production --non-interactive --no-wait
npx eas-cli submit --platform ios --latest   # after build finishes
```

## Error Handling & Monitoring

- Custom `AppErrorBoundary` wraps the app in `_layout.tsx`
- Sentry crash reporting configured via `utils/sentry.ts` (requires `EXPO_PUBLIC_SENTRY_DSN` env var)
- `trackScreenView()` and `trackEvent()` in `utils/sentry.ts` log breadcrumbs for screen views (Home, Progress, Reading) and user actions (reading_complete)
- `useReducedMotion` hook respects user accessibility preferences for animations

## Testing

- Jest with `jest-expo` preset, 53 tests across 7 suites
- **Unit tests:** appReducer, storage utils, searchHighlight store
- **Component tests:** NavigationControls (button states, callbacks, disabled states), HighlightText (highlighting, case-insensitive), Paragraph (empty, trim, highlight)
- **Integration test:** Full reading → complete → streak flow (multi-day journey, streak break, freeze, reset)
- AsyncStorage mocked in `__tests__/setup.ts`
- CI: GitHub Actions runs `tsc --noEmit` and `jest --ci --coverage` on push/PR to main

## Known Tech Debt

- `app/completed-readings.tsx` (~400 lines) could benefit from extraction
