import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState } from 'react';
// Type-only imports — erased at compile time, no runtime module access
import type { AudioPlayer } from 'expo-audio';
import type { AudioStatus } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Snippet } from '@/types';
import { AlignedData, AudioUIState, PlayerState, SavedAudioPosition } from '@/types/audio';
import { audioReducer, initialAudioUIState } from '@/reducers/audioReducer';
import { audioSource, resolveAudioSource } from '@/utils/audioSource';
import { CONFIG } from '@/constants/config';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';

// Runtime import with fallback — expo-audio native module may not be available in Expo Go
let _useAudioPlayer: typeof import('expo-audio').useAudioPlayer | null = null;
let _useAudioPlayerStatus: typeof import('expo-audio').useAudioPlayerStatus | null = null;
let _setAudioModeAsync: typeof import('expo-audio').setAudioModeAsync | null = null;
let expoAudioAvailable = false;

try {
  const ea = require('expo-audio');
  _useAudioPlayer = ea.useAudioPlayer;
  _useAudioPlayerStatus = ea.useAudioPlayerStatus;
  _setAudioModeAsync = ea.setAudioModeAsync;
  expoAudioAvailable = true;
} catch {
  // expo-audio native module not available — voice mode will be disabled
}

interface AudioPlayerContextType {
  player: AudioPlayer | null;
  status: AudioStatus;
  uiState: AudioUIState;
  alignedData: AlignedData | null;
  isAudioAvailable: boolean;
  currentSnippetId: number | null;
  loadAndPlay: (snippet: Snippet, language: 'en' | 'hi') => Promise<void>;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  skipForward: () => void;
  skipBack: () => void;
  setSpeed: (rate: number) => void;
  expandPlayer: () => void;
  minimizePlayer: () => void;
  dismissPlayer: () => void;
  toggleSpeedPanel: () => void;
  loadSavedPosition: (snippetId: number) => Promise<SavedAudioPosition | null>;
}

const defaultStatus: AudioStatus = {
  id: 0,
  currentTime: 0,
  playbackState: '',
  timeControlStatus: '',
  reasonForWaitingToPlay: '',
  mute: false,
  duration: 0,
  playing: false,
  loop: false,
  didJustFinish: false,
  isBuffering: false,
  isLoaded: false,
  playbackRate: 1,
  shouldCorrectPitch: true,
};

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

// No-op provider when expo-audio isn't available
const noopAsync = async () => {};
const noop = () => {};
const noopLoadSavedPosition = async (): Promise<SavedAudioPosition | null> => null;

function AudioPlayerFallback({ children }: { children: React.ReactNode }) {
  const value: AudioPlayerContextType = {
    player: null,
    status: defaultStatus,
    uiState: initialAudioUIState,
    alignedData: null,
    isAudioAvailable: false,
    currentSnippetId: null,
    loadAndPlay: noopAsync as any,
    togglePlayPause: noop,
    seek: noop,
    skipForward: noop,
    skipBack: noop,
    setSpeed: noop,
    expandPlayer: noop,
    minimizePlayer: noop,
    dismissPlayer: noop,
    toggleSpeedPanel: noop,
    loadSavedPosition: noopLoadSavedPosition,
  };

  return (
    <AudioPlayerContext value={value}>
      {children}
    </AudioPlayerContext>
  );
}

// Active provider — only rendered when expo-audio is available
function AudioPlayerProviderActive({ children }: { children: React.ReactNode }) {
  const player = _useAudioPlayer!(null, { updateInterval: CONFIG.VOICE_MODE.UPDATE_INTERVAL_MS });
  const status = _useAudioPlayerStatus!(player);
  const [uiState, dispatch] = useReducer(audioReducer, initialAudioUIState);
  const [alignedData, setAlignedData] = useState<AlignedData | null>(null);
  const currentSnippetRef = useRef<Snippet | null>(null);
  const currentLanguageRef = useRef<'en' | 'hi'>('en');
  const currentUriRef = useRef<string | null>(null);
  const pendingActionRef = useRef<{ seekTo?: number; play: boolean } | null>(null);
  const pendingSpeedRef = useRef<number | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusPlayingRef = useRef(false);
  const statusCurrentTimeRef = useRef(0);
  const wantsToPlayRef = useRef(false);
  const { language } = useLanguage();

  // Native module guard: the JS module may load but native calls can still throw
  // FunctionCallException if the native shared object is missing (e.g. Expo Go).
  // On first failure, disable all audio to prevent repeated crashes.
  const nativeDisabledRef = useRef(false);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const disableNativeAudio = useCallback(() => {
    if (nativeDisabledRef.current) return;
    nativeDisabledRef.current = true;
    setAudioAvailable(false);
    wantsToPlayRef.current = false;
    pendingActionRef.current = null;
    pendingSpeedRef.current = null;
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    dispatch({ type: 'DISMISS' });
    logger.warn('AudioPlayer', 'Native audio module unavailable — voice mode disabled');
  }, []);

  // Keep refs in sync for use in callbacks that shouldn't re-fire on every tick.
  // Refs always hold the latest value — critical for savePosition in dismissPlayer.
  statusPlayingRef.current = status.playing;
  statusCurrentTimeRef.current = status.currentTime;
  const uiSnippetIdRef = useRef(uiState.snippetId);
  const uiHasListenedRef = useRef(uiState.hasListened);
  const uiSpeedRef = useRef(uiState.speed);
  uiSnippetIdRef.current = uiState.snippetId;
  uiHasListenedRef.current = uiState.hasListened;
  uiSpeedRef.current = uiState.speed;

  // In-memory position cache — eliminates async race between save (on dismiss) and load (on return)
  const positionCacheRef = useRef<Map<number, SavedAudioPosition>>(new Map());

  // ── AUTO-SAVE: continuously persist position while playing ──
  // Runs in the context (never unmounts), polls player.currentTime directly
  // from the native player every second. Writes to BOTH in-memory cache and
  // AsyncStorage. This is the PRIMARY save mechanism — dismissPlayer's save
  // is just a final "flush" before pause.
  useEffect(() => {
    if (nativeDisabledRef.current) return;
    if (uiState.playerState === 'off' || !status.playing) return;

    const interval = setInterval(() => {
      try {
        const time = player.currentTime;
        const sid = uiSnippetIdRef.current;
        if (sid == null || time <= 0) return;

        const saved: SavedAudioPosition = {
          snippetId: sid,
          time,
          hasListened: uiHasListenedRef.current,
          speed: uiSpeedRef.current,
        };
        positionCacheRef.current.set(sid, saved);
        const key = `${CONFIG.VOICE_MODE.POSITION_SAVE_KEY_PREFIX}${sid}`;
        AsyncStorage.setItem(key, JSON.stringify(saved)).catch(() => {});
        console.log('[AUDIO_DEBUG] autoSave: time=', time.toFixed(1), 'snippetId=', sid);
      } catch (e) {
        console.log('[AUDIO_DEBUG] autoSave: FAILED', e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, uiState.playerState, status.playing]);

  // Configure audio mode on mount
  useEffect(() => {
    _setAudioModeAsync!({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {
      logger.warn('AudioPlayer', 'Failed to set audio mode');
    });
  }, []);

  // Execute pending action when audio finishes loading.
  // Guard: skip if player was dismissed while audio was loading.
  useEffect(() => {
    if (nativeDisabledRef.current) return;

    // Clear load timeout — audio has loaded (or we'll handle it)
    if (status.isLoaded && loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    if (status.isLoaded && pendingActionRef.current) {
      // Don't start playback if the user already dismissed the player.
      // Keep the pending action so it can fire if playerState changes.
      if (uiState.playerState === 'off') return;

      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      console.log('[AUDIO_DEBUG] pendingAction executing:', JSON.stringify(action), 'playerState=', uiState.playerState, 'player.currentTime=', (() => { try { return player.currentTime; } catch { return 'N/A'; } })());

      (async () => {
        try {
          if (action.seekTo != null) {
            const target = Math.max(0, action.seekTo);
            let seekApplied = false;

            // expo-audio can report "loaded" before seek is actually honored.
            // Retry a few times and verify currentTime moved to target.
            for (let attempt = 1; attempt <= 6; attempt++) {
              try {
                await player.seekTo(target);
              } catch {
                // Transient seek failure; retry before escalating.
              }

              await new Promise((resolve) => setTimeout(resolve, 80));

              let current = 0;
              try {
                current = player.currentTime;
              } catch {
                current = 0;
              }

              const withinTolerance = target === 0
                ? current < 0.35
                : Math.abs(current - target) < 0.5;

              if (withinTolerance) {
                seekApplied = true;
                console.log('[AUDIO_DEBUG] pendingAction: seek applied on attempt', attempt, 'target=', target, 'current=', current);
                break;
              }

              if (attempt === 6) {
                console.log('[AUDIO_DEBUG] pendingAction: seek did not stick after retries. target=', target, 'current=', current);
              }
            }

            // If seek never sticks, still continue to play to avoid getting stuck.
            if (!seekApplied) {
              // no-op
            }
          }
          if (action.play) {
            player.play();
          }
        } catch {
          disableNativeAudio();
        }
      })();
    }

    // Apply deferred speed when audio finishes loading
    if (status.isLoaded && pendingSpeedRef.current != null) {
      const rate = pendingSpeedRef.current;
      pendingSpeedRef.current = null;
      try {
        player.setPlaybackRate(rate);
      } catch {
        disableNativeAudio();
      }
    }
  }, [status.isLoaded, player, uiState.playerState, disableNativeAudio]);

  // Retry mechanism: poll direct player properties and retry play()
  useEffect(() => {
    if (nativeDisabledRef.current) return;
    if (uiState.playerState === 'off') {
      wantsToPlayRef.current = false;
      return;
    }
    if (!wantsToPlayRef.current) return;

    let retries = 0;
    const maxRetries = 10;

    const interval = setInterval(() => {
      if (nativeDisabledRef.current || !wantsToPlayRef.current || retries >= maxRetries) {
        clearInterval(interval);
        wantsToPlayRef.current = false;
        return;
      }

      try {
        if (player.playing) {
          wantsToPlayRef.current = false;
          clearInterval(interval);
          return;
        }

        if (player.isLoaded && !player.playing) {
          player.play();
          retries++;
        }
      } catch {
        clearInterval(interval);
        disableNativeAudio();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player, uiState.playerState, disableNativeAudio]);

  // Handle audio completion.
  // Only act on the rising edge (false → true) of didJustFinish to avoid
  // stale-state re-fires: after completion, expo-audio stops sending status
  // ticks so didJustFinish stays true in React state. When playerState later
  // changes (e.g. Replay tap), this effect would re-fire on the stale true
  // and immediately dismiss the player. The ref prevents that.
  const prevDidJustFinishRef = useRef(false);
  useEffect(() => {
    const justFinished = status.didJustFinish && !prevDidJustFinishRef.current;
    prevDidJustFinishRef.current = status.didJustFinish;

    // Guard: only mark listened if audio actually played (duration > 0 and
    // position advanced). A failed load can trigger didJustFinish with zeros.
    if (justFinished && uiState.playerState !== 'off' && status.duration > 0) {
      console.log('[AUDIO_DEBUG] didJustFinish: marking listened, snippetId=', uiState.snippetId, 'playerState=', uiState.playerState, 'duration=', status.duration);
      wantsToPlayRef.current = false;
      dispatch({ type: 'MARK_LISTENED' });
      if (uiState.snippetId != null) {
        const saved: SavedAudioPosition = {
          snippetId: uiState.snippetId,
          time: 0,
          hasListened: true,
          speed: uiState.speed,
        };
        positionCacheRef.current.set(uiState.snippetId, saved);
        const key = `${CONFIG.VOICE_MODE.POSITION_SAVE_KEY_PREFIX}${uiState.snippetId}`;
        AsyncStorage.setItem(key, JSON.stringify(saved)).catch(() => {});
      }
    }
  }, [status.didJustFinish, status.duration, uiState.playerState, uiState.snippetId, uiState.speed]);

  // Switch audio when language changes mid-playback
  useEffect(() => {
    if (nativeDisabledRef.current) return;
    if (language === currentLanguageRef.current) return;
    if (!currentSnippetRef.current || uiState.playerState === 'off') {
      currentLanguageRef.current = language;
      return;
    }

    const snippet = currentSnippetRef.current;
    const wasPlaying = statusPlayingRef.current;
    const savedTime = statusCurrentTimeRef.current;

    currentLanguageRef.current = language;

    (async () => {
      try {
        const aligned = await audioSource.getAlignedData(snippet, language);
        setAlignedData(aligned);

        const { uri } = await resolveAudioSource(snippet, language);
        currentUriRef.current = uri;

        pendingActionRef.current = {
          seekTo: savedTime > 0 ? savedTime : undefined,
          play: wasPlaying,
        };
        if (wasPlaying) {
          wantsToPlayRef.current = true;
        }
        player.replace({ uri });

        try {
          player.setActiveForLockScreen(true, {
            title: snippet.title,
            artist: '10 Minute Gita',
          }, {
            showSeekForward: true,
            showSeekBackward: true,
          });
        } catch {
          // Lock screen controls not available in Expo Go
        }
      } catch {
        disableNativeAudio();
      }
    })();
  }, [language, player, uiState.playerState, disableNativeAudio]);

  // Final flush on dismiss/pause — reads player.currentTime directly.
  // If it can't get a positive time, skips the save entirely
  // (the auto-save above already persisted a recent position).
  const savePosition = useCallback(() => {
    const sid = uiSnippetIdRef.current;
    if (sid == null) return;

    // Read time directly from the native player — most accurate source.
    let time = 0;
    try {
      const directTime = player.currentTime;
      if (typeof directTime === 'number' && !isNaN(directTime)) {
        time = directTime;
      }
    } catch {
      // Native access failed
    }
    // Fallback to status ref
    if (time <= 0) {
      time = statusCurrentTimeRef.current;
    }
    // Never overwrite a good auto-saved position with 0.
    if (time <= 0) {
      console.log('[AUDIO_DEBUG] savePosition: skipping — time is 0, auto-save has good data');
      return;
    }

    const saved: SavedAudioPosition = {
      snippetId: sid,
      time,
      hasListened: uiHasListenedRef.current,
      speed: uiSpeedRef.current,
    };
    console.log('[AUDIO_DEBUG] savePosition:', JSON.stringify(saved));
    positionCacheRef.current.set(sid, saved);
    const key = `${CONFIG.VOICE_MODE.POSITION_SAVE_KEY_PREFIX}${sid}`;
    AsyncStorage.setItem(key, JSON.stringify(saved)).catch(() => {});
  }, [player]);

  const loadSavedPosition = useCallback(async (snippetId: number): Promise<SavedAudioPosition | null> => {
    // Check in-memory cache first — handles race where dismiss save hasn't flushed to AsyncStorage yet
    const cached = positionCacheRef.current.get(snippetId);
    if (cached) {
      console.log('[AUDIO_DEBUG] loadSavedPosition: snippetId=', snippetId, 'CACHE HIT', JSON.stringify(cached));
      return cached;
    }

    const key = `${CONFIG.VOICE_MODE.POSITION_SAVE_KEY_PREFIX}${snippetId}`;
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data) as SavedAudioPosition;
        console.log('[AUDIO_DEBUG] loadSavedPosition: snippetId=', snippetId, 'ASYNC_STORAGE', JSON.stringify(parsed));
        return parsed;
      }
    } catch {
      // Storage read not critical
    }
    console.log('[AUDIO_DEBUG] loadSavedPosition: snippetId=', snippetId, 'NOT FOUND');
    return null;
  }, []);

  const loadAndPlay = useCallback(async (snippet: Snippet, language: 'en' | 'hi') => {
    if (nativeDisabledRef.current) return;
    try {
      const aligned = await audioSource.getAlignedData(snippet, language);
      setAlignedData(aligned);
      currentSnippetRef.current = snippet;
      currentLanguageRef.current = language;

      const saved = await loadSavedPosition(snippet.id);

      const { uri } = await resolveAudioSource(snippet, language);
      const rawSavedTime = saved?.time;
      const normalizedSavedTime = typeof rawSavedTime === 'number' ? rawSavedTime : Number(rawSavedTime);
      const resumeTime = Number.isFinite(normalizedSavedTime) && normalizedSavedTime > 0 ? normalizedSavedTime : 0;
      console.log('[AUDIO_DEBUG] loadAndPlay: resumeTime=', resumeTime, 'saved=', JSON.stringify(saved), 'uri=', uri);

      // Always reload via player.replace() — seeking on a stale/paused player
      // is unreliable in expo-audio. A fresh load + pending action ensures the
      // seek executes on a newly-loaded player where it reliably takes effect.
      pendingActionRef.current = {
        seekTo: resumeTime,
        play: true,
      };
      currentUriRef.current = uri;
      wantsToPlayRef.current = true;

      // Clear any previous load timeout before starting a new one
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      player.replace({ uri });

      // Load timeout: if audio doesn't load within 10s, reset player state
      loadTimeoutRef.current = setTimeout(() => {
        loadTimeoutRef.current = null;
        if (pendingActionRef.current) {
          pendingActionRef.current = null;
          wantsToPlayRef.current = false;
          logger.warn('AudioPlayer', 'Audio load timed out after 10s');
          dispatch({ type: 'DISMISS_PLAYER' });
        }
      }, 10000);

      if (saved?.speed && saved.speed !== 1.0) {
        dispatch({ type: 'SET_SPEED', payload: saved.speed });
        // Defer speed application — will be applied when audio finishes loading
        pendingSpeedRef.current = saved.speed;
      }

      if (saved) {
        dispatch({
          type: 'RESTORE_POSITION',
          payload: {
            savedTime: saved.time,
            hasListened: saved.hasListened,
            speed: saved.speed,
          },
        });
      }

      dispatch({ type: 'LOAD_SNIPPET', payload: snippet.id });

      try {
        player.setActiveForLockScreen(true, {
          title: snippet.title,
          artist: '10 Minute Gita',
        }, {
          showSeekForward: true,
          showSeekBackward: true,
        });
      } catch {
        // Lock screen controls not available in Expo Go
      }
    } catch {
      disableNativeAudio();
    }
  }, [player, loadSavedPosition, disableNativeAudio]);

  const togglePlayPause = useCallback(() => {
    if (nativeDisabledRef.current) return;
    try {
      if (status.playing || player.playing) {
        wantsToPlayRef.current = false;
        player.pause();
        savePosition();
      } else {
        wantsToPlayRef.current = true;
        player.play();
      }
    } catch {
      disableNativeAudio();
    }
  }, [player, status.playing, savePosition, disableNativeAudio]);

  const seek = useCallback((time: number) => {
    if (nativeDisabledRef.current) return;
    try {
      const clampedTime = Math.max(0, Math.min(time, status.duration || 0));
      player.seekTo(clampedTime);
    } catch {
      disableNativeAudio();
    }
  }, [player, status.duration, disableNativeAudio]);

  const skipForward = useCallback(() => {
    seek(status.currentTime + CONFIG.VOICE_MODE.SKIP_SECONDS * uiState.speed);
  }, [seek, status.currentTime, uiState.speed]);

  const skipBack = useCallback(() => {
    seek(status.currentTime - CONFIG.VOICE_MODE.SKIP_SECONDS * uiState.speed);
  }, [seek, status.currentTime, uiState.speed]);

  const setSpeed = useCallback((rate: number) => {
    if (nativeDisabledRef.current) return;
    dispatch({ type: 'SET_SPEED', payload: rate });
    try {
      if (player.isLoaded) {
        player.setPlaybackRate(rate);
      } else {
        // Defer until audio is loaded
        pendingSpeedRef.current = rate;
      }
    } catch {
      disableNativeAudio();
    }
  }, [player, disableNativeAudio]);

  const expandPlayer = useCallback(() => {
    dispatch({ type: 'SET_PLAYER_STATE', payload: 'full' as PlayerState });
  }, []);

  const minimizePlayer = useCallback(() => {
    dispatch({ type: 'SET_PLAYER_STATE', payload: 'mini' as PlayerState });
  }, []);

  const dismissPlayer = useCallback(() => {
    wantsToPlayRef.current = false;
    pendingActionRef.current = null;
    pendingSpeedRef.current = null;
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    // Save position BEFORE pausing — player.currentTime is most reliable
    // while the player is still in an active (playing/paused) state.
    // After pause(), some native implementations reset currentTime to 0.
    console.log('[AUDIO_DEBUG] dismissPlayer: about to save. statusRef=', statusCurrentTimeRef.current, 'player.currentTime=', (() => { try { return player.currentTime; } catch { return 'N/A'; } })(), 'snippetId=', uiSnippetIdRef.current, 'hasListened=', uiHasListenedRef.current);
    savePosition();
    if (!nativeDisabledRef.current) {
      try {
        player.pause();
      } catch {
        nativeDisabledRef.current = true;
        setAudioAvailable(false);
      }
    }
    dispatch({ type: 'DISMISS_PLAYER' });
  }, [player, savePosition]);

  const toggleSpeedPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_SPEED_PANEL' });
  }, []);

  const value: AudioPlayerContextType = {
    player,
    status,
    uiState,
    alignedData,
    isAudioAvailable: audioAvailable,
    currentSnippetId: uiState.snippetId,
    loadAndPlay,
    togglePlayPause,
    seek,
    skipForward,
    skipBack,
    setSpeed,
    expandPlayer,
    minimizePlayer,
    dismissPlayer,
    toggleSpeedPanel,
    loadSavedPosition,
  };

  return (
    <AudioPlayerContext value={value}>
      {children}
    </AudioPlayerContext>
  );
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  if (!expoAudioAvailable) {
    return <AudioPlayerFallback>{children}</AudioPlayerFallback>;
  }
  return <AudioPlayerProviderActive>{children}</AudioPlayerProviderActive>;
}

export function useAudioPlayerContext(): AudioPlayerContextType {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
  }
  return context;
}
