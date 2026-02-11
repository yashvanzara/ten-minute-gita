import { useMemo } from 'react';
import { useAudioPlayerContext } from '@/contexts/AudioPlayerContext';
import { SentenceGroup } from '@/types/audio';
import { splitIntoSentences } from '@/utils/sentenceSplitter';

export interface WordHighlight {
  highlightType: 'word';
  activeWordIndex: number;
  sectionIndex: number;
}

export interface SentenceHighlight {
  highlightType: 'sentence';
  activeSentenceIndex: number;
  sentenceRange: { startWordIndex: number; endWordIndex: number };
  sectionIndex: number;
}

export interface GapHighlight {
  highlightType: 'gap';
}

export interface NoHighlight {
  highlightType: 'none';
}

export type AudioHighlightState = WordHighlight | SentenceHighlight | GapHighlight | NoHighlight;

interface AudioPositionInput {
  currentSectionIndex: number;
  currentSectionType: string | null;
  activeWordIndex: number;
  isInGap: boolean;
}

interface AudioHighlightResult {
  highlight: AudioHighlightState;
  sentenceGroupsBySection: Map<number, SentenceGroup[]>;
}

/**
 * Accepts position from the caller's useAudioPosition() to avoid creating
 * a second independent polling instance.
 */
export function useAudioHighlight(position: AudioPositionInput, enabled: boolean = true): AudioHighlightResult {
  const { alignedData, uiState } = useAudioPlayerContext();
  const isActive = enabled && uiState.playerState !== 'off';

  // Pre-compute sentence groups for all prose sections
  const sentenceGroupsBySection = useMemo(() => {
    const map = new Map<number, SentenceGroup[]>();
    if (!alignedData) return map;

    for (let i = 0; i < alignedData.sections.length; i++) {
      const section = alignedData.sections[i];
      if (section.type !== 'verse') {
        map.set(i, splitIntoSentences(section.words));
      }
    }
    return map;
  }, [alignedData]);

  const highlight = useMemo((): AudioHighlightState => {
    if (!isActive || !alignedData) {
      return { highlightType: 'none' };
    }

    if (position.isInGap) {
      return { highlightType: 'gap' };
    }

    if (position.currentSectionIndex < 0) {
      return { highlightType: 'none' };
    }

    const section = alignedData.sections[position.currentSectionIndex];

    // Verse sections get word-level highlighting
    if (section.type === 'verse') {
      return {
        highlightType: 'word',
        activeWordIndex: position.activeWordIndex,
        sectionIndex: position.currentSectionIndex,
      };
    }

    // Prose sections get sentence-level highlighting
    const sentences = sentenceGroupsBySection.get(position.currentSectionIndex);
    if (!sentences || sentences.length === 0) {
      return { highlightType: 'none' };
    }

    // Find which sentence contains the active word
    let activeSentenceIndex = 0;
    for (let i = 0; i < sentences.length; i++) {
      if (
        position.activeWordIndex >= sentences[i].startWordIndex &&
        position.activeWordIndex <= sentences[i].endWordIndex
      ) {
        activeSentenceIndex = i;
        break;
      }
    }

    const sentence = sentences[activeSentenceIndex];
    return {
      highlightType: 'sentence',
      activeSentenceIndex,
      sentenceRange: {
        startWordIndex: sentence.startWordIndex,
        endWordIndex: sentence.endWordIndex,
      },
      sectionIndex: position.currentSectionIndex,
    };
  }, [isActive, alignedData, position, sentenceGroupsBySection]);

  return { highlight, sentenceGroupsBySection };
}
