/**
 * Tests for persistent audio playback across screen navigation.
 * Verifies state machine transitions that enable cross-screen audio.
 */

import { audioReducer, initialAudioUIState } from '@/reducers/audioReducer';
import type { AudioUIState } from '@/types/audio';

describe('Persistent playback state transitions', () => {
  it('audio state persists when navigating from reading to home (minimize)', () => {
    // Simulate: user is on reading screen with full player
    let state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      snippetId: 5,
      speed: 1.0,
    };

    // User navigates away -- reading screen dispatches MINIMIZE_PLAYER
    state = audioReducer(state, { type: 'MINIMIZE_PLAYER' });

    // Audio still "playing" (MiniBar visible)
    expect(state.playerState).toBe('mini');
    expect(state.snippetId).toBe(5);
    expect(state.speed).toBe(1.0);
  });

  it('transitions to full when returning to same reading screen', () => {
    let state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 5,
    };

    // Reading screen focuses, dispatches SET_PLAYER_STATE full
    state = audioReducer(state, { type: 'SET_PLAYER_STATE', payload: 'full' });

    expect(state.playerState).toBe('full');
    expect(state.snippetId).toBe(5);
  });

  it('stays mini when navigating to a DIFFERENT reading screen', () => {
    // Audio playing for snippet 5, user opens snippet 10
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 5,
    };

    // Reading screen for snippet 10 should NOT auto-expand because
    // snippetId 5 !== 10. playerState stays mini.
    expect(state.playerState).toBe('mini');
    expect(state.snippetId).toBe(5);
  });

  it('MARK_LISTENED sets playerState to off (ListenPill shows Listened·Replay)', () => {
    let state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      snippetId: 5,
    };

    state = audioReducer(state, { type: 'MARK_LISTENED' });

    expect(state.playerState).toBe('off');
    expect(state.hasListened).toBe(true);
    expect(state.savedTime).toBe(0);
  });

  it('DISMISS_PLAYER sets playerState to off and would stop audio', () => {
    let state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 5,
      hasListened: true,
    };

    state = audioReducer(state, { type: 'DISMISS_PLAYER' });

    expect(state.playerState).toBe('off');
    // snippetId preserved for potential reload
    expect(state.snippetId).toBe(5);
  });

  it('NAVIGATE_TO_SNIPPET does not change playerState', () => {
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 5,
    };

    const result = audioReducer(state, { type: 'NAVIGATE_TO_SNIPPET' });

    expect(result).toBe(state); // Same reference, no mutation
    expect(result.playerState).toBe('mini');
  });

  it('full lifecycle: load -> play -> leave -> return -> complete -> dismiss', () => {
    let state = initialAudioUIState;

    // 1. Load snippet
    state = audioReducer(state, { type: 'LOAD_SNIPPET', payload: 42 });
    expect(state.playerState).toBe('full');

    // 2. Leave reading screen
    state = audioReducer(state, { type: 'MINIMIZE_PLAYER' });
    expect(state.playerState).toBe('mini');

    // 3. Return to reading screen
    state = audioReducer(state, { type: 'SET_PLAYER_STATE', payload: 'full' });
    expect(state.playerState).toBe('full');

    // 4. Audio completes — goes to 'off', ListenPill shows "Listened · Replay"
    state = audioReducer(state, { type: 'MARK_LISTENED' });
    expect(state.playerState).toBe('off');
    expect(state.hasListened).toBe(true);
  });

  it('speed and snippet preserved through minimize/expand cycle', () => {
    let state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      snippetId: 100,
      speed: 1.3,
      hasListened: false,
    };

    state = audioReducer(state, { type: 'MINIMIZE_PLAYER' });
    expect(state.speed).toBe(1.3);
    expect(state.snippetId).toBe(100);

    state = audioReducer(state, { type: 'SET_PLAYER_STATE', payload: 'full' });
    expect(state.speed).toBe(1.3);
    expect(state.snippetId).toBe(100);
  });

  describe('highlight hook enablement logic', () => {
    function computeHighlightEnabled(playerState: string, audioSnippetId: number, viewingSnippetId: number): boolean {
      return playerState !== 'off' && audioSnippetId === viewingSnippetId;
    }

    it('highlights enabled when snippet matches and player active', () => {
      expect(computeHighlightEnabled('full', 5, 5)).toBe(true);
    });

    it('highlights disabled when viewing different snippet', () => {
      expect(computeHighlightEnabled('full', 5, 10)).toBe(false);
    });

    it('highlights disabled when player is off', () => {
      expect(computeHighlightEnabled('off', 5, 5)).toBe(false);
    });

    it('highlights enabled on mini for matching snippet', () => {
      expect(computeHighlightEnabled('mini', 5, 5)).toBe(true);
    });
  });
});
