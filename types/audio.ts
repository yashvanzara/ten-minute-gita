export interface AlignedWord {
  word: string;
  start: number;
  end: number;
  matched: boolean;
}

export interface AlignedSection {
  type: 'verse' | 'verseTranslation' | 'commentary' | 'reflection';
  text: string;
  words: AlignedWord[];
  verse_index?: number;
}

export interface AlignedData {
  audio_file: string;
  snippet_key: string;
  language: string;
  duration_seconds: number;
  total_source_words: number;
  matched_words: number;
  match_rate: number;
  sections: AlignedSection[];
}

export type PlayerState = 'off' | 'full' | 'mini';

// Audio action types (defined here for use in both reducer and context)
export type AudioAction =
  | { type: 'SET_PLAYER_STATE'; payload: PlayerState }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'MARK_LISTENED' }
  | { type: 'RESTORE_POSITION'; payload: { savedTime: number; hasListened: boolean; speed: number } }
  | { type: 'TOGGLE_SPEED_PANEL' }
  | { type: 'LOAD_SNIPPET'; payload: number }
  | { type: 'DISMISS' }
  | { type: 'DISMISS_PLAYER' }
  | { type: 'MINIMIZE_PLAYER' }
  | { type: 'NAVIGATE_TO_SNIPPET' };

export type ListenPillState = 'fresh' | 'resume' | 'completed';

export type ChipType = 'shloka' | 'translation' | 'commentary' | 'reflection';

export interface SentenceGroup {
  startWordIndex: number;
  endWordIndex: number;
  text: string;
}

export interface AudioUIState {
  playerState: PlayerState;
  speed: number;
  hasListened: boolean;
  savedTime: number;
  snippetId: number | null;
  isSpeedExpanded: boolean;
}

export interface SavedAudioPosition {
  snippetId: number;
  time: number;
  hasListened: boolean;
  speed: number;
}
