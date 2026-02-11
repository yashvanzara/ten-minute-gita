import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';

const MINI_BAR_HEIGHT = 80; // Approximate height of MiniBar (chips + playback row + padding)

export function useAudioBottomPadding(): number {
  const { uiState } = useAudioPlayerContext();
  return uiState.playerState === 'mini' ? MINI_BAR_HEIGHT : 0;
}
