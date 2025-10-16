import { diffWordsWithSpace, type Change } from 'diff';

export interface WordSuggestion {
  id: string;
  from: number;
  to: number;
  originalText: string;
  suggestedText: string;
  explanation?: string;
  type: 'replace' | 'add' | 'remove';
}

/**
 * Generate a unique ID for suggestions
 */
function generateId(): string {
  return `suggestion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates word-level suggestions by comparing original and suggested text.
 * SIMPLIFIED: Better handling of positions and merging
 */
export function generateWordSuggestions(
  originalText: string,
  suggestedText: string,
  startPos: number,
  explanation?: string
): WordSuggestion[] {
  const suggestions: WordSuggestion[] = [];
  const diffs: Change[] = diffWordsWithSpace(originalText, suggestedText);

  let posInOriginal = 0; // Track position in original text

  // First pass: collect all changes
  const changes: Array<{
    type: 'add' | 'remove' | 'unchanged';
    value: string;
    posInOriginal: number;
  }> = [];

  for (const change of diffs) {
    if (change.added) {
      changes.push({ type: 'add', value: change.value, posInOriginal });
    } else if (change.removed) {
      changes.push({ type: 'remove', value: change.value, posInOriginal });
      posInOriginal += change.value.length;
    } else {
      changes.push({ type: 'unchanged', value: change.value, posInOriginal });
      posInOriginal += change.value.length;
    }
  }

  // Second pass: merge adjacent remove+add into replace
  let i = 0;
  while (i < changes.length) {
    const current = changes[i];

    if (current.type === 'remove' && i + 1 < changes.length && changes[i + 1].type === 'add') {
      // Merge remove + add into replace
      const next = changes[i + 1];
      suggestions.push({
        id: generateId(),
        from: startPos + current.posInOriginal,
        to: startPos + current.posInOriginal + current.value.length,
        originalText: current.value,
        suggestedText: next.value,
        explanation,
        type: 'replace',
      });
      i += 2; // Skip both
    } else if (current.type === 'remove') {
      // Standalone remove
      suggestions.push({
        id: generateId(),
        from: startPos + current.posInOriginal,
        to: startPos + current.posInOriginal + current.value.length,
        originalText: current.value,
        suggestedText: '',
        explanation,
        type: 'remove',
      });
      i++;
    } else if (current.type === 'add') {
      // Standalone add
      suggestions.push({
        id: generateId(),
        from: startPos + current.posInOriginal,
        to: startPos + current.posInOriginal,
        originalText: '',
        suggestedText: current.value,
        explanation,
        type: 'add',
      });
      i++;
    } else {
      // Unchanged
      i++;
    }
  }

  return suggestions;
}

/**
 * Fixes any overlapping positions in suggestions
 * Currently unused but kept for potential future use
 */
/*
function fixPositionOverlaps(suggestions: WordSuggestion[]): WordSuggestion[] {
  if (suggestions.length <= 1) return suggestions;

  const fixed: WordSuggestion[] = [];
  let lastTo = -1;

  for (const suggestion of suggestions) {
    let { from, to } = suggestion;

    // Ensure this suggestion doesn't overlap with the previous one
    if (from < lastTo) {
      from = lastTo;
      to = Math.max(to, lastTo);
    }

    fixed.push({
      ...suggestion,
      from,
      to,
    });

    lastTo = to;
  }

  return fixed;
}
*/

/**
 * Generates a simple replacement suggestion (entire selection replaced)
 * Used for modes like "Rewrite" where the entire text is changed
 *
 * @param originalText - The original selected text
 * @param suggestedText - The AI-suggested replacement
 * @param from - Start position in editor
 * @param to - End position in editor
 * @param explanation - Optional explanation
 */
export function generateSimpleReplacement(
  originalText: string,
  suggestedText: string,
  from: number,
  to: number,
  explanation?: string
): WordSuggestion {
  return {
    id: generateId(),
    from,
    to,
    originalText,
    suggestedText,
    explanation,
    type: 'replace',
  };
}

/**
 * Generates an expansion suggestion (adds text after selection)
 * Used for "Expand" mode where text is added, not replaced
 *
 * @param addedText - The text to add after the selection
 * @param position - Position in editor where text should be added
 * @param explanation - Optional explanation
 */
export function generateExpansionSuggestion(
  addedText: string,
  position: number,
  explanation?: string
): WordSuggestion {
  return {
    id: generateId(),
    from: position,
    to: position,
    originalText: '',
    suggestedText: addedText,
    explanation,
    type: 'add',
  };
}

/**
 * Merges adjacent suggestions intelligently (OPTIMIZED)
 */
export function mergeAdjacentSuggestions(suggestions: WordSuggestion[]): WordSuggestion[] {
  if (suggestions.length <= 1) return suggestions;

  const merged: WordSuggestion[] = [];
  let current = suggestions[0];

  for (let i = 1; i < suggestions.length; i++) {
    const next = suggestions[i];
    const gap = next.from - current.to;

    // Quick merge check
    if (gap <= 2 && current.type === next.type && current.explanation === next.explanation) {
      // Merge in place
      current = {
        ...current,
        to: next.to,
        originalText: current.originalText + next.originalText,
        suggestedText: current.suggestedText + next.suggestedText,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Groups suggestions into sentence-level changes when appropriate
 * If most of a sentence is being changed, group it as one suggestion
 */
export function groupSentenceLevelChanges(suggestions: WordSuggestion[]): WordSuggestion[] {
  if (suggestions.length <= 1) return suggestions;

  const grouped: WordSuggestion[] = [];
  let i = 0;

  while (i < suggestions.length) {
    const current = suggestions[i];

    // Look ahead to see if we should group this with nearby suggestions
    let j = i + 1;
    let totalSpan = current.to - current.from;
    let changedSpan = current.originalText.length;

    // Check the next few suggestions to see if they're part of a larger edit
    while (j < suggestions.length) {
      const next = suggestions[j];
      const gap = next.from - suggestions[j - 1].to;

      // If gap is too large, stop grouping
      if (gap > 10) break;

      totalSpan = next.to - current.from;
      changedSpan += next.originalText.length;
      j++;

      // If we've found a cluster of changes that cover >70% of a span, group them
      const changeRatio = changedSpan / totalSpan;
      if (changeRatio > 0.7 && j - i >= 3) {
        // Group all of these into one suggestion
        const groupedSuggestion: WordSuggestion = {
          id: generateId(),
          from: current.from,
          to: suggestions[j - 1].to,
          originalText: '',
          suggestedText: '',
          explanation: current.explanation,
          type: 'replace',
        };

        // Reconstruct the original and suggested text
        for (let k = i; k < j; k++) {
          groupedSuggestion.originalText += suggestions[k].originalText;
          groupedSuggestion.suggestedText += suggestions[k].suggestedText;
        }

        grouped.push(groupedSuggestion);
        i = j;
        break;
      }
    }

    // If we didn't group, just add the current suggestion
    if (i < j) {
      // Already grouped above
    } else {
      grouped.push(current);
      i++;
    }
  }

  return grouped;
}

/**
 * Filters out trivial suggestions (OPTIMIZED)
 */
export function filterTrivialSuggestions(suggestions: WordSuggestion[]): WordSuggestion[] {
  const filtered: WordSuggestion[] = [];

  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i];

    // Always keep if has explanation
    if (s.explanation) {
      filtered.push(s);
      continue;
    }

    // Filter empty changes
    const origTrim = s.originalText.trim();
    const suggTrim = s.suggestedText.trim();

    if (origTrim === '' && suggTrim === '') continue;

    // Keep the suggestion
    filtered.push(s);
  }

  return filtered;
}

/**
 * Main function to process AI feedback and generate suggestions
 * IMPROVED: Split by sentences for better granularity
 */
export function processAIFeedback(
  originalText: string,
  aiSuggestion: string,
  from: number,
  to: number,
  mode: 'grammar' | 'rewrite' | 'expand' | 'agent' | 'evaluate',
  explanation?: string
): WordSuggestion[] {
  if (mode === 'expand') {
    return [generateExpansionSuggestion(aiSuggestion, to, explanation)];
  }

  // For grammar mode, try to split by sentences
  if (mode === 'grammar' || mode === 'agent') {
    return splitBySentences(originalText, aiSuggestion, from, to, explanation);
  }

  // For rewrite and evaluate, do full replacement
  return [generateSimpleReplacement(originalText, aiSuggestion, from, to, explanation)];
}

/**
 * Split corrections by sentences for more granular control
 */
function splitBySentences(
  originalText: string,
  aiSuggestion: string,
  from: number,
  to: number,
  explanation?: string
): WordSuggestion[] {
  // Split by sentence boundaries (. ! ? followed by space or newline)
  const sentenceRegex = /[.!?]+(?:\s+|$)/g;

  const originalSentences: string[] = [];
  const suggestedSentences: string[] = [];

  // Split original text
  let lastIndex = 0;
  let match;
  const originalMatches: number[] = [0];

  while ((match = sentenceRegex.exec(originalText)) !== null) {
    originalSentences.push(originalText.substring(lastIndex, match.index + match[0].length));
    lastIndex = match.index + match[0].length;
    originalMatches.push(lastIndex);
  }
  if (lastIndex < originalText.length) {
    originalSentences.push(originalText.substring(lastIndex));
  }

  // Split suggested text
  lastIndex = 0;
  sentenceRegex.lastIndex = 0;
  while ((match = sentenceRegex.exec(aiSuggestion)) !== null) {
    suggestedSentences.push(aiSuggestion.substring(lastIndex, match.index + match[0].length));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < aiSuggestion.length) {
    suggestedSentences.push(aiSuggestion.substring(lastIndex));
  }

  // If sentence counts don't match or text is short, just do full replacement
  if (originalSentences.length !== suggestedSentences.length || originalText.length < 50) {
    return [generateSimpleReplacement(originalText, aiSuggestion, from, to, explanation)];
  }

  // Create one suggestion per sentence
  const suggestions: WordSuggestion[] = [];
  let currentPos = from;

  for (let i = 0; i < originalSentences.length; i++) {
    const origSent = originalSentences[i];
    const suggSent = suggestedSentences[i];

    // Only create suggestion if sentences differ
    if (origSent.trim() !== suggSent.trim()) {
      suggestions.push({
        id: generateId(),
        from: currentPos,
        to: currentPos + origSent.length,
        originalText: origSent,
        suggestedText: suggSent,
        explanation,
        type: 'replace',
      });
    }

    currentPos += origSent.length;
  }

  // If no differences found or only one sentence, do full replacement
  if (suggestions.length === 0 || suggestions.length === 1) {
    return [generateSimpleReplacement(originalText, aiSuggestion, from, to, explanation)];
  }

  return suggestions;
}
