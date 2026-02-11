import { audioReducer, initialAudioUIState } from '@/reducers/audioReducer';
import type { AudioUIState } from '@/types/audio';

describe('audioReducer', () => {
  describe('initial state', () => {
    it('has playerState "off"', () => {
      expect(initialAudioUIState.playerState).toBe('off');
    });

    it('has speed 1.0', () => {
      expect(initialAudioUIState.speed).toBe(1.0);
    });

    it('has hasListened false', () => {
      expect(initialAudioUIState.hasListened).toBe(false);
    });

    it('has savedTime 0', () => {
      expect(initialAudioUIState.savedTime).toBe(0);
    });

    it('has snippetId null', () => {
      expect(initialAudioUIState.snippetId).toBeNull();
    });

    it('has isSpeedExpanded false', () => {
      expect(initialAudioUIState.isSpeedExpanded).toBe(false);
    });
  });

  // Note: isPlaying is NOT in the reducer — it comes from expo-audio's
  // useAudioPlayerStatus(player).playing. The reducer only tracks UI state
  // (player panel state, speed, snippet tracking, etc.)

  describe('SET_PLAYER_STATE', () => {
    it('transitions to "full"', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'SET_PLAYER_STATE',
        payload: 'full',
      });
      expect(state.playerState).toBe('full');
    });

    it('transitions to "mini"', () => {
      const state = audioReducer(
        { ...initialAudioUIState, playerState: 'full' },
        { type: 'SET_PLAYER_STATE', payload: 'mini' },
      );
      expect(state.playerState).toBe('mini');
    });

    it('transitions to "off"', () => {
      const state = audioReducer(
        { ...initialAudioUIState, playerState: 'full' },
        { type: 'SET_PLAYER_STATE', payload: 'off' },
      );
      expect(state.playerState).toBe('off');
    });

    it('preserves other state fields', () => {
      const prev: AudioUIState = {
        ...initialAudioUIState,
        speed: 1.3,
        hasListened: true,
        snippetId: 42,
      };
      const state = audioReducer(prev, {
        type: 'SET_PLAYER_STATE',
        payload: 'mini',
      });
      expect(state.speed).toBe(1.3);
      expect(state.hasListened).toBe(true);
      expect(state.snippetId).toBe(42);
    });
  });

  describe('LOAD_SNIPPET', () => {
    it('sets playerState to "full"', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'LOAD_SNIPPET',
        payload: 5,
      });
      expect(state.playerState).toBe('full');
    });

    it('sets snippetId', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'LOAD_SNIPPET',
        payload: 42,
      });
      expect(state.snippetId).toBe(42);
    });

    it('closes speed panel', () => {
      const prev = { ...initialAudioUIState, isSpeedExpanded: true };
      const state = audioReducer(prev, {
        type: 'LOAD_SNIPPET',
        payload: 1,
      });
      expect(state.isSpeedExpanded).toBe(false);
    });
  });

  describe('MARK_LISTENED', () => {
    it('sets hasListened to true', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'MARK_LISTENED',
      });
      expect(state.hasListened).toBe(true);
    });

    it('resets savedTime to 0', () => {
      const prev = { ...initialAudioUIState, savedTime: 120 };
      const state = audioReducer(prev, { type: 'MARK_LISTENED' });
      expect(state.savedTime).toBe(0);
    });

    it('transitions playerState to "off" (ListenPill shows Listened·Replay)', () => {
      const prev = { ...initialAudioUIState, playerState: 'full' as const };
      const state = audioReducer(prev, { type: 'MARK_LISTENED' });
      expect(state.playerState).toBe('off');
    });
  });

  describe('SET_SPEED', () => {
    it('sets the speed value', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'SET_SPEED',
        payload: 1.3,
      });
      expect(state.speed).toBe(1.3);
    });

    it('accepts 0.5 (min boundary)', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'SET_SPEED',
        payload: 0.5,
      });
      expect(state.speed).toBe(0.5);
    });

    it('accepts 1.5 (max boundary)', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'SET_SPEED',
        payload: 1.5,
      });
      expect(state.speed).toBe(1.5);
    });

    // Note: clamping is enforced by the UI slider (min/max props),
    // not by the reducer. The reducer stores whatever is dispatched.
  });

  describe('TOGGLE_SPEED_PANEL', () => {
    it('toggles isSpeedExpanded from false to true', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'TOGGLE_SPEED_PANEL',
      });
      expect(state.isSpeedExpanded).toBe(true);
    });

    it('toggles isSpeedExpanded from true to false', () => {
      const prev = { ...initialAudioUIState, isSpeedExpanded: true };
      const state = audioReducer(prev, { type: 'TOGGLE_SPEED_PANEL' });
      expect(state.isSpeedExpanded).toBe(false);
    });
  });

  describe('RESTORE_POSITION', () => {
    it('restores savedTime, hasListened, and speed', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'RESTORE_POSITION',
        payload: { savedTime: 150, hasListened: true, speed: 0.8 },
      });
      expect(state.savedTime).toBe(150);
      expect(state.hasListened).toBe(true);
      expect(state.speed).toBe(0.8);
    });

    it('does not change playerState', () => {
      const prev = { ...initialAudioUIState, playerState: 'full' as const };
      const state = audioReducer(prev, {
        type: 'RESTORE_POSITION',
        payload: { savedTime: 50, hasListened: false, speed: 1.0 },
      });
      expect(state.playerState).toBe('full');
    });
  });

  describe('DISMISS', () => {
    it('sets playerState to "off"', () => {
      const prev = { ...initialAudioUIState, playerState: 'full' as const };
      const state = audioReducer(prev, { type: 'DISMISS' });
      expect(state.playerState).toBe('off');
    });

    it('closes speed panel', () => {
      const prev = {
        ...initialAudioUIState,
        playerState: 'full' as const,
        isSpeedExpanded: true,
      };
      const state = audioReducer(prev, { type: 'DISMISS' });
      expect(state.isSpeedExpanded).toBe(false);
    });

    it('preserves snippetId and hasListened', () => {
      const prev = {
        ...initialAudioUIState,
        playerState: 'full' as const,
        snippetId: 10,
        hasListened: true,
      };
      const state = audioReducer(prev, { type: 'DISMISS' });
      expect(state.snippetId).toBe(10);
      expect(state.hasListened).toBe(true);
    });
  });

  describe('DISMISS_PLAYER', () => {
    it('sets playerState to "off"', () => {
      const prev = { ...initialAudioUIState, playerState: 'full' as const };
      const state = audioReducer(prev, { type: 'DISMISS_PLAYER' });
      expect(state.playerState).toBe('off');
    });

    it('closes speed panel', () => {
      const prev = {
        ...initialAudioUIState,
        playerState: 'full' as const,
        isSpeedExpanded: true,
      };
      const state = audioReducer(prev, { type: 'DISMISS_PLAYER' });
      expect(state.isSpeedExpanded).toBe(false);
    });

    it('preserves snippetId and hasListened', () => {
      const prev = {
        ...initialAudioUIState,
        playerState: 'full' as const,
        snippetId: 10,
        hasListened: true,
      };
      const state = audioReducer(prev, { type: 'DISMISS_PLAYER' });
      expect(state.snippetId).toBe(10);
      expect(state.hasListened).toBe(true);
    });
  });

  describe('MINIMIZE_PLAYER', () => {
    it('sets playerState to "mini"', () => {
      const prev = { ...initialAudioUIState, playerState: 'full' as const };
      const state = audioReducer(prev, { type: 'MINIMIZE_PLAYER' });
      expect(state.playerState).toBe('mini');
    });

    it('closes speed panel', () => {
      const prev = {
        ...initialAudioUIState,
        playerState: 'full' as const,
        isSpeedExpanded: true,
      };
      const state = audioReducer(prev, { type: 'MINIMIZE_PLAYER' });
      expect(state.isSpeedExpanded).toBe(false);
    });

    it('preserves snippetId and speed', () => {
      const prev = {
        ...initialAudioUIState,
        playerState: 'full' as const,
        snippetId: 42,
        speed: 1.3,
      };
      const state = audioReducer(prev, { type: 'MINIMIZE_PLAYER' });
      expect(state.snippetId).toBe(42);
      expect(state.speed).toBe(1.3);
    });
  });

  describe('NAVIGATE_TO_SNIPPET', () => {
    it('does not change playerState', () => {
      const prev = { ...initialAudioUIState, playerState: 'mini' as const };
      const state = audioReducer(prev, { type: 'NAVIGATE_TO_SNIPPET' });
      expect(state.playerState).toBe('mini');
    });

    it('returns same state reference (no mutation)', () => {
      const prev = { ...initialAudioUIState, playerState: 'mini' as const };
      const state = audioReducer(prev, { type: 'NAVIGATE_TO_SNIPPET' });
      expect(state).toBe(prev);
    });
  });

  describe('unknown action', () => {
    it('returns current state unchanged', () => {
      const state = audioReducer(initialAudioUIState, {
        type: 'UNKNOWN_ACTION' as any,
      });
      expect(state).toBe(initialAudioUIState);
    });
  });
});
