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
```

No test suite exists yet.

## Architecture

### Routing (Expo Router)

- `app/_layout.tsx` — Root layout, nests providers: `LanguageProvider > FTUEProvider > AppProvider > RootLayoutNav`
- `app/(tabs)/` — Tab navigator: Home (`index.tsx`), Progress (`progress.tsx`), Settings (`settings.tsx`)
- `app/reading/[id].tsx` — Reading screen for day 1–239, supports swipe navigation

### State & Data

- **AppContext** (`contexts/AppContext.tsx`) — Thin wrapper around `useReducer` with `reducers/appReducer.ts`. Manages progress, streak, settings, loading state. Dispatches: `SET_PROGRESS`, `MARK_COMPLETE`, `UPDATE_SETTINGS`, `USE_STREAK_FREEZE`, `RESET_PROGRESS`, `SIMULATE_PROGRESS`, `SYNC_STREAK`.
- **LanguageContext** — Provides `language` (en/hi) and `t(key, params?)` function. Persists to AsyncStorage.
- **FTUEContext** — First-time user experience flow state. Persists to AsyncStorage.
- **AsyncStorage keys:** `@gita_app_progress`, `@ftue_state`, `@language` (defined in `constants/config.ts`)
- **Content data:** `data/gita_snippets.json` (EN), `data/gita_snippets_hindi.json` (HI) — 239 snippets with Sanskrit verses, transliteration, translation, commentary, reflection.

### Key Files by Size

| File | Lines | Notes |
|------|-------|-------|
| `components/SnippetContent.tsx` | 696 | Largest file — renders verse content |
| `app/reading/[id].tsx` | 316 | Reading screen with swipe nav |
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
- `expo-store-review` must be **dynamically imported** (`await import(...)`) with try/catch — it crashes in Expo Go if imported at top level
- Theme colors defined in `constants/Colors.ts` with `light` and `dark` variants

## Known Tech Debt

- `components/SnippetContent.tsx` (696 lines) — candidate for splitting
- `hooks/useFirstTimeUser.ts` duplicates logic in `contexts/FTUEContext.tsx`
- `components/CompletedReadingsList.tsx:51` — `TODO: Open full list modal`
- No test suite
