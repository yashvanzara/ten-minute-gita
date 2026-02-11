import { AlignedWord, SentenceGroup } from '@/types/audio';
import { CONFIG } from '@/constants/config';

/**
 * Splits a section's words into sentence groups for sentence-level highlighting.
 *
 * Sentences are split on terminators: . ? ! ।
 * If a sentence exceeds SENTENCE_MAX_WORDS, force a break at the nearest comma.
 */
export function splitIntoSentences(
  words: AlignedWord[],
): SentenceGroup[] {
  if (words.length === 0) return [];

  const maxWords = CONFIG.VOICE_MODE.SENTENCE_MAX_WORDS;
  const groups: SentenceGroup[] = [];
  let sentenceStart = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].word;
    const isSentenceEnd = /[.?!।]$/.test(word);
    const isLastWord = i === words.length - 1;
    const sentenceLength = i - sentenceStart + 1;

    // Check if we need to force a break due to length
    const needsForceBreak = sentenceLength >= maxWords && !isSentenceEnd && !isLastWord;

    if (isSentenceEnd || isLastWord || needsForceBreak) {
      let breakAt = i;

      // If forcing a break, look back for a comma
      if (needsForceBreak) {
        let commaIndex = -1;
        for (let j = i; j > sentenceStart; j--) {
          if (/[,，]$/.test(words[j].word)) {
            commaIndex = j;
            break;
          }
        }
        if (commaIndex > sentenceStart) {
          breakAt = commaIndex;
        }
        // If no comma found, break at current position
      }

      const sentenceWords = words.slice(sentenceStart, breakAt + 1);
      groups.push({
        startWordIndex: sentenceStart,
        endWordIndex: breakAt,
        text: sentenceWords.map(w => w.word).join(' '),
      });

      sentenceStart = breakAt + 1;

      // If we forced a break before current position, reprocess from breakAt + 1
      if (needsForceBreak && breakAt < i) {
        // Continue loop from breakAt + 1 (sentenceStart is already set)
        // The next iteration will start a new sentence from there
      }
    }
  }

  return groups;
}
