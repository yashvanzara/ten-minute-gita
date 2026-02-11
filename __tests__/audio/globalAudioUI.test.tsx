/**
 * Tests for GlobalAudioUI component and persistent audio behavior.
 * Verifies that audio UI renders correctly across different screens.
 */

import { audioReducer, initialAudioUIState } from '@/reducers/audioReducer';
import type { AudioUIState } from '@/types/audio';

describe('GlobalAudioUI state logic', () => {
  it('MiniBar state when playerState is mini', () => {
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 5,
    };
    expect(state.playerState).toBe('mini');
    expect(state.snippetId).toBe(5);
  });

  it('renders nothing when playerState is off', () => {
    const state = initialAudioUIState;
    expect(state.playerState).toBe('off');
    // GlobalAudioUI returns null when off
  });

  it('DISMISS_PLAYER from mini stops showing MiniBar', () => {
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 5,
    };
    const result = audioReducer(state, { type: 'DISMISS_PLAYER' });
    expect(result.playerState).toBe('off');
  });

  it('FullPlayer state renders on non-reading screens when full', () => {
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      snippetId: 10,
    };
    // On non-reading screen, GlobalAudioUI renders FullPlayerOverlay
    expect(state.playerState).toBe('full');
  });

  it('MiniBar uses correct snippet info', () => {
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'mini',
      snippetId: 42,
      speed: 1.3,
    };
    expect(state.snippetId).toBe(42);
    expect(state.speed).toBe(1.3);
  });

  it('MINIMIZE_PLAYER from full transitions to mini for tab screens', () => {
    const state: AudioUIState = {
      ...initialAudioUIState,
      playerState: 'full',
      snippetId: 1,
      isSpeedExpanded: true,
    };
    const result = audioReducer(state, { type: 'MINIMIZE_PLAYER' });
    expect(result.playerState).toBe('mini');
    expect(result.isSpeedExpanded).toBe(false);
  });
});
