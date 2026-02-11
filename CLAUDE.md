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

- `app/_layout.tsx` — Root layout, nests providers: `LanguageProvider > FTUEProvider > AppProvider > AudioPlayerProvider > RootLayoutNav`
- `app/(tabs)/` — Tab navigator: Home (`index.tsx`), Progress (`progress.tsx`), Settings (`settings.tsx`)
- `app/reading/[id].tsx` — Reading screen for day 1–239, supports swipe navigation. **Next/Previous uses `router.setParams()` (not `router.replace()`)** to avoid screen remount — see Notable Fixes below.
- `app/completed-readings.tsx` — Full-screen search page for all completed readings (search across title, verses, commentary, reflection, Sanskrit, transliteration)

### State & Data

- **AppContext** (`contexts/AppContext.tsx`) — Thin wrapper around `useReducer` with `reducers/appReducer.ts`. Manages progress, streak, settings, loading state. Dispatches: `SET_PROGRESS`, `MARK_COMPLETE`, `UPDATE_SETTINGS`, `USE_STREAK_FREEZE`, `RESET_PROGRESS`, `SIMULATE_PROGRESS`, `SYNC_STREAK`.
- **LanguageContext** — Provides `language` (en/hi) and `t(key, params?)` function. Persists to AsyncStorage.
- **FTUEContext** — First-time user experience flow state. Persists to AsyncStorage.
- **AsyncStorage keys:** `@gita_app_progress`, `@ftue_state`, `@language` (defined in `constants/config.ts`)
- **Content data:** `data/gita_snippets.json` (EN), `data/gita_snippets_hindi.json` (HI) — 239 snippets with Sanskrit verses, transliteration, translation, commentary, reflection. Hindi verse translations were extracted from commentary fields; titles have "Day N:" / "दिन N:" prefixes stripped. Content changes tracked in `content_changes_manifest.json` (280 changes: 230 EN commentary boilerplate removals, 20 HI commentary/reflection fixes, 30 formatting-only).
- **Search highlight:** `utils/searchHighlight.ts` — Module-level global store with monotonic counter. `setSearchHighlight()` before navigation, `getSearchHighlight()` on mount in reading screen. Module-level `_lastConsumedHighlightId` in `reading/[id].tsx` ensures each highlight is consumed exactly once across component mounts.

### Share Card Feature

- `components/share/ShareCard.tsx` — Renders 1080x1080 shareable image with gradient background, verse/reflection text, Sanskrit, and watermark
- `components/share/ShareCardModal.tsx` — Bottom sheet modal for customizing and sharing cards (gradient picker, text size)
- `utils/shareCard.ts` — `captureAndShare()` uses `react-native-view-shot` to capture card as image and share via `expo-sharing`
- Config in `constants/config.ts` under `SHARE_CARD`: gradients, text scale (min: 1.0, max: 1.3, step: 0.15, default: 1.15), padding, size
- Available from both Home screen (today's reflection) and Reading screen (current verse/reflection)

### Key Files by Size

| File | Lines | Notes |
|------|-------|-------|
| `app/reading/[id].tsx` | ~700 | Reading screen with swipe nav, audio integration, voice mode, search highlights, date reactivity |
| `components/SnippetContent.tsx` | ~470 | Renders verse content, audio highlighting, search highlighting, auto-scroll (sub-components in `components/snippet/`) |
| `app/completed-readings.tsx` | ~400 | Search page with debounced full-text search, context previews |
| `components/TodayCard.tsx` | 263 | Home screen CTA card |
| `components/NotificationPrompt.tsx` | 259 | FTUE notification prompt |
| `app/(tabs)/index.tsx` | 241 | Home screen with share card integration |
| `components/CalendarHeatmap.tsx` | 239 | Reading history calendar |
| `components/share/ShareCardModal.tsx` | ~230 | Share card customization modal |

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
- **Date reactivity pattern** — For UI that depends on current date (e.g., "Preview Tomorrow"), use `useState` + `useFocusEffect` + `AppState` listener + 60-second interval to keep date fresh across focus, app resume, and midnight crossings
- **Header back button** pattern: use `useLayoutEffect` + `navigation.setOptions` with `headerBackVisible: false` and custom `headerLeft` using `Ionicons chevron-back` (not inline Stack.Screen options)
- `expo-store-review` must be **dynamically imported** (`await import(...)`) with try/catch — it crashes in Expo Go if imported at top level
- Theme colors defined in `constants/Colors.ts` with `light` and `dark` variants
- **Voice mode colors** use `getVoiceColors(colorScheme)` from `constants/config.ts` — returns `VOICE_COLORS` (light) or `VOICE_COLORS_DARK` (dark). All audio components call `useAppColorScheme()` internally to get the right palette.

## Deployment

```bash
# iOS
npx eas-cli build --platform ios --profile production --non-interactive
npx eas-cli submit --platform ios --latest   # after build finishes

# Android
npx eas-cli build --platform android --profile production --non-interactive
# Upload .aab to Google Play Console manually
```

## Error Handling & Monitoring

- Custom `AppErrorBoundary` wraps the app in `_layout.tsx`
- Sentry crash reporting configured via `utils/sentry.ts` (requires `EXPO_PUBLIC_SENTRY_DSN` env var)
- `trackScreenView()` and `trackEvent()` in `utils/sentry.ts` log breadcrumbs for screen views (Home, Progress, Reading) and user actions (reading_complete)
- `useReducedMotion` hook respects user accessibility preferences for animations

## Testing

- Jest with `jest-expo` preset, 451 tests across 25 suites
- **Unit tests:** appReducer, storage utils, searchHighlight store, sectionHelpers, sentenceSplitter, audioMapping, audioReducer
- **Component tests:** NavigationControls (button states, callbacks, disabled states), HighlightText (highlighting, case-insensitive), Paragraph (empty, trim, highlight)
- **Integration tests:** Full reading → complete → streak flow (multi-day journey, streak break, freeze, reset)
- **Voice mode tests** (`__tests__/audio/`):
  - `voiceMode.unit.test.ts` — 105 tests: sectionHelpers boundaries, formatTime edge cases, audioReducer state machine, sentenceSplitter, audioMapping, highlight logic, position persistence, speed-adjusted time calculations
  - `voiceMode.integration.test.ts` — 46 tests across 13 deep tests: full play lifecycle, speed changes, seeking, snippet switching, language switch, audio completion, minimize/expand, position persistence round-trip, auto-scroll triggers, error recovery, replay after completion, pill state sync, navigation smoothness (setParams, pill reset, no key remount)
- AsyncStorage mocked in `__tests__/setup.ts`
- CI: GitHub Actions runs `tsc --noEmit` and `jest --ci --coverage` on push/PR to main

## Voice Mode (Audio Playback)

Karaoke-style word-by-word audio highlighting during playback. Uses `expo-audio` with native module fallback for Expo Go.

### Architecture

- **AudioPlayerContext** (`contexts/AudioPlayerContext.tsx`) — Wraps expo-audio. Provides player, status, UI state, and all playback actions. Uses `nativeDisabledRef` + `disableNativeAudio()` kill switch: every native player call is wrapped in try/catch — on first failure, all audio is permanently disabled for the session (prevents Expo Go crashes).
- **Fallback provider** (`AudioPlayerFallback`) — Rendered when `expo-audio` native module isn't available. All methods are no-ops, `isAudioAvailable: false`.
- **Audio reducer** (`reducers/audioReducer.ts`) — Manages UI state: `playerState` ('off'|'mini'|'full'), `snippetId`, `speed`, `hasListened`, `isSpeedExpanded`.
- **useAudioPosition** hook — Polls `player.currentTime` at 50ms intervals, finds active section/word. Uses `statusRef` (not `status` in deps) to avoid interval teardown on every status tick.
- **useAudioHighlight** hook — Maps audio position to highlight state: `WordHighlight`, `SentenceHighlight`, `GapHighlight`, `NoHighlight`. Note: `GapHighlight` has no `sectionIndex` — must type-narrow before accessing.
- **useAutoScroll** hook — Auto-scrolls to active paragraph during playback. Uses `measure()` on per-paragraph refs.
- **useAudioPositionPersistence** hook — Saves position to AsyncStorage every 10s while playing.

### Audio Components (`components/audio/`)

| Component | Purpose |
|-----------|---------|
| `ListenPill` | Compact floating pill (Listen/Resume/Listened·Replay). Already has FAB-like styling with shadow. |
| `MiniBar` | Collapsed player bar with chips, play/pause, progress, timestamp |
| `FullPlayer` | Expanded player with ScrubBar, CoreControls, SpeedControl, SectionChips |
| `ScrubBar` | Draggable progress bar with speed-adjusted timestamps |
| `AudioVerseBlock` | Sanskrit verse with word-by-word highlight (active word gets coral background) |
| `AudioParagraph` | Commentary/reflection paragraph with sentence-level highlight |
| `BackToNarrationPill` | "Now" pill to scroll back to active section |

### Alignment Pipeline

All scripts live in `~/Desktop/gita_podcast/`.

- **`align_timestamps.py`** — Aligns Sanskrit source text against Whisper/Sarvam transcription. Cross-script fallback: when <10% of words match (Devanagari vs Latin), distributes words evenly across the section's time window.
- **`audit_alignment.py`** — Scans all 478 aligned JSONs for compressed verse sections (<0.2s).
- **`verify_audio_text_sync.py`** — Full sync verification for all 478 files. Checks: section count matches verse structure, section sequence (verse/verseTranslation pairs + commentary + reflection), verse word counts match source sanskrit, no zero-duration sections, commentary chars/sec sanity, completeness (all 239×2 M4A+JSON present).

#### Audio Generation & Splicing

- **`generate_gita_audio.py`** — Original TTS pipeline. Builds narration in interleaved order: `verse_0 → translation_0 → verse_1 → translation_1 → ... → commentary → reflection`. Uses Sarvam TTS API (`bulbul:v3-beta`, speaker `aditya`, pace 1.0). Chunks text at 2400 chars max on sentence boundaries. 500ms pause between chunks, 1200ms between sections.
- **`splice_verses.py`** — Replaces only Sanskrit verse audio segments in existing files. Generates new TTS per verse, detects section boundaries via silence detection (`ffmpeg silencedetect`), splices in new audio keeping translation/commentary/reflection untouched. Creates `_presplice.mp3` and `_aligned_presplice.json` backups.
- **`splice_sections.py`** — Replaces commentary/reflection audio for snippets with changed text (tracked in `content_changes_manifest.json`). Supports `--workers N` for parallel processing (4 workers = ~4x speedup). Creates `_precontent.mp3` and `_aligned_precontent.json` backups. Supports `--skip-done` to resume interrupted runs.
- **`shift_alignments.py`** — Rebuilds `_aligned.json` after any splice operation. Zero API calls — uses silence detection + arithmetic. Handles both verse splice (`_presplice` backups) and content splice (`_precontent` backups). Verse/translation sections: copies timestamps or even-distributes. Commentary/reflection: even-distributes words across detected boundaries.
- **`fix_verse_words.py`** — Post-processes aligned JSONs to replace Whisper-derived verse words with source text words. Even-distributes source words across each verse's existing time window. Ensures aligned JSON verse word counts match `gita_snippets*.json` sanskrit field.

#### Aligned JSON Format

```json
{
  "audio_file": "Ch01_Verses_01-03.m4a",
  "snippet_key": "Ch01_Verses_01-03",
  "language": "en",
  "duration_seconds": 942.5,
  "sections": [
    {"type": "verse", "verse_index": 0, "text": "...", "words": [{"word": "...", "start": 0.1, "end": 0.9, "matched": true}]},
    {"type": "verseTranslation", "verse_index": 0, ...},
    {"type": "commentary", ...},
    {"type": "reflection", ...}
  ]
}
```

Section sequence is always: `(verse, verseTranslation) × num_verses`, then `commentary`, then `reflection`. Total sections = `num_verses * 2 + 2`.

#### Backup Naming Convention

| Backup suffix | Created by | Purpose |
|---------------|------------|---------|
| `_presplice.mp3/.json` | `splice_verses.py` | Before verse audio replacement |
| `_precontent.mp3/.json` | `splice_sections.py` | Before commentary/reflection replacement |

#### Sarvam TTS API

- Endpoint: `https://api.sarvam.ai/text-to-speech`
- Keys in `~/Desktop/gita_podcast/.env`: `SARVAM_API_KEY` (primary), `SARVAM_API_KEY_BACKUP` (auto-switch on 429/403)
- Params: model `bulbul:v3-beta`, speaker `aditya`, pace 1.0, temp 0.5, 24kHz, MP3
- Max chunk: 2400 chars. Retry: up to 8 attempts with exponential backoff
- Rate: ~15-20s per TTS call (network + processing)

### Key Behaviors

- **Auto-play:** Only on the initial snippet opened from home screen. Uses a ref (`autoPlayTriggered`) that's set once and never reset — navigating with Previous/Next skips auto-play.
- **No auto-complete:** Marking done is always manual (user taps "Mark Complete").
- **Speed-adjusted display:** All displayed times are divided by `speed` (elapsed, remaining, total). Skip forward/back seeks `SKIP_SECONDS * speed` raw audio seconds so the user always experiences 15 real-world seconds.
- **Pill placement:** ListenPill floats absolutely, positioned `bottom: navBarH + 8` (measured via `onLayout` on NavigationControls wrapper). Content has `paddingBottom: 80` to clear it.
- **Language switch:** Swapping language mid-playback reloads audio at the same position.
- **Position persistence:** Saved to AsyncStorage on pause, dismiss, completion, and periodically while playing.
- **`didJustFinish` is transient** — True for one status tick only. If you need to act on completion, latch it into state first (don't depend on it in effect deps or the cleanup will cancel your timer).

## Known Tech Debt

- `app/completed-readings.tsx` (~400 lines) could benefit from extraction; debounce timer not cleaned on unmount
- `LanguageContext.tsx` — `AsyncStorage.getItem` (line 40) has no `.catch()`; `AsyncStorage.setItem` (line 55) has no try/catch
- `FTUEContext.tsx` — `AsyncStorage.getItem` (line 35) has no `.catch()` on promise; `update()` and `resetFTUE` call `AsyncStorage.setItem` without try/catch
- `notifications.ts` — `time.split(':').map(Number)` (line 83) has no validation; could produce NaN hours/minutes
- `hooks/useStreak.ts` — `currentDate` in interval effect deps (line 33) causes unnecessary interval recreation on date change
- `hooks/useReducedMotion.ts` — `isReduceMotionEnabled().then(setReduced)` could resolve after unmount

## Notable Fixes (v1.0.3)

- **Navigation flash eliminated:** `router.replace()` unmounts/remounts the reading screen even with `animation: 'none'`. Switched to `router.setParams()` which changes URL params in-place — zero remount, zero flash. Architecture test enforces this.
- **Pill blink on navigation:** Conditional unmount (`{show && <Pill/>}`) caused visible blink when `isPillReady` toggled false→true. Split into `showListenPillArea` (keeps component mounted) and `isPillVisible` (controls opacity). Uses `opacity: 0` + `pointerEvents: 'none'` instead of unmounting.
- **Dark mode for audio UI:** All 12 audio components used hardcoded `CONFIG.VOICE_COLORS` (light only). Added `VOICE_COLORS_DARK` palette + `getVoiceColors(colorScheme)` helper. Every audio component now calls `useAppColorScheme()` internally.
- **MP3 → M4A migration:** All 478 audio files converted from MP3 to M4A (AAC) for smaller size and better iOS compatibility. `audioMapping.ts` updated, aligned JSONs updated. App loads `.m4a` files.
- **Replay seeks to end:** `seekTo(0)` was racing with `didJustFinish` causing playback at track end. Fixed with debounced seek after status settles.
- **Replay doesn't show player:** After completion, tapping "Listened · Replay" didn't expand player. Fixed pill→replay flow to dispatch PLAY action.

## Notable Fixes (v1.0.2)

- **Rate App** — Apple's `requestReview()` silently fails after ~3 uses/year; now opens App Store directly with `action=write-review` URL
- **Date reactivity** — "Preview Tomorrow" was stale after midnight; fixed with reactive date state
- **Day 3/Day 4 duplicate content** — Rewrote Day 4 commentary (EN + HI) with unique content about "Aparyaptam" ambiguity

## Notable Fixes (Voice Mode)

- **Verse highlighting:** Cross-script fallback in `align_timestamps.py` — even distribution when Devanagari↔Latin matching fails
- **Auto-scroll:** Per-verse refs (`verse_0`, `verse_1`, etc.) instead of single `'verses'` container ref
- **Blank home screen:** Safety `setTimeout(() => fadeAnim.setValue(1), 500)` in `LanguageContext.setLanguage` prevents animation stuck at opacity 0
- **Expo Go crash:** All `expo-audio` native calls wrapped in try/catch with `disableNativeAudio()` kill switch
- **Time display consistency:** All timestamps divided by `speed`; skip buttons seek `SKIP_SECONDS * speed`

## Notable Fixes (Voice Mode Audit)

- **Audio plays after dismiss:** `pendingActionRef` now cleared in `dismissPlayer()`, plus `playerState === 'off'` guard in pending action effect
- **useAudioPosition interval thrashing:** Removed `status` from polling effect deps (was tearing down/recreating setInterval 10x/sec); uses `statusRef` for dev logging instead
- **No load timeout:** Added 10-second timeout on `player.replace()` — dispatches DISMISS if audio never loads
- **Speed not applied on load:** Replaced fragile `setTimeout` with `pendingSpeedRef` applied when `status.isLoaded` fires
- **setSpeed fails when unloaded:** Now defers to `pendingSpeedRef` if `!player.isLoaded`
- **formatTime crashes:** Hardened to handle NaN, negative, and Infinity inputs (clamps to 0)
- **disableNativeAudio cleanup:** Kill switch now clears `pendingActionRef`, `pendingSpeedRef`, and `loadTimeoutRef`

## Notable Fixes (Audio Pipeline — Content & Verse Splice)

- **Commentary boilerplate removed (EN):** 230 EN snippets had repetitive podcast intro content stripped from commentary. Audio regenerated via `splice_sections.py` with parallel TTS (4 workers). Net duration change: -1697s (~28 min shorter total).
- **Hindi content fixes:** 20 HI snippets fixed — 8 duplicate commentaries replaced, 12 placeholder/truncated reflections expanded with proper content. Audio regenerated.
- **Verse audio splice:** All 478 files (239 EN + 239 HI) had Sanskrit verse audio segments regenerated with complete shlokas via `splice_verses.py`.
- **Ch09_Verses_13-15 compressed verse:** Third verse had 4 words in 0.017s (borderline cross-script alignment failure). Fixed with targeted TTS regeneration + manual boundary detection.
- **Verse word count normalization:** 1384 aligned JSON verse sections across 478 files had Whisper-derived word counts that didn't match source Sanskrit. Post-processed via `fix_verse_words.py` to even-distribute source text words instead.
- **Reflection boundary detection:** 7 files had 0-duration reflection sections after content splice — `shift_alignments.py` used old (invalid) timestamps to find the commentary/reflection boundary. Fixed using text character ratio to estimate correct boundary position.
- **Alignment shift (zero API calls):** Instead of expensive STT re-generation (~10+ hours), `shift_alignments.py` uses silence detection + arithmetic to rebuild aligned JSONs in ~3 minutes for all 478 files.
- **Final verification:** `verify_audio_text_sync.py` confirms all 478 files pass: correct section counts, sequence, verse word counts matching source, no zero-duration sections, commentary rate sanity, full completeness.
