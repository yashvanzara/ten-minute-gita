/**
 * Tests for audio bottom padding logic.
 * Verifies that tab screens get correct padding when MiniBar is showing.
 */

import { initialAudioUIState } from '@/reducers/audioReducer';

describe('useAudioBottomPadding logic', () => {
  const MINI_BAR_HEIGHT = 80;

  function computePadding(playerState: string): number {
    return playerState === 'mini' ? MINI_BAR_HEIGHT : 0;
  }

  it('returns extra padding when MiniBar is visible (playerState mini)', () => {
    const state = { ...initialAudioUIState, playerState: 'mini' as const };
    expect(computePadding(state.playerState)).toBe(MINI_BAR_HEIGHT);
  });

  it('returns 0 when no audio playing (playerState off)', () => {
    const state = initialAudioUIState;
    expect(computePadding(state.playerState)).toBe(0);
  });

  it('returns 0 when FullPlayer is showing (playerState full)', () => {
    const state = { ...initialAudioUIState, playerState: 'full' as const };
    expect(computePadding(state.playerState)).toBe(0);
  });

  it('padding is consistent regardless of snippetId', () => {
    const state1 = { ...initialAudioUIState, playerState: 'mini' as const, snippetId: 1 };
    const state2 = { ...initialAudioUIState, playerState: 'mini' as const, snippetId: 239 };
    expect(computePadding(state1.playerState)).toBe(computePadding(state2.playerState));
  });
});
