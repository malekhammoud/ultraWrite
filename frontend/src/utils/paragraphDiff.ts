/**
 * Paragraph-level diff utilities for granular change control
 * Splits AI suggestions into paragraph or section chunks
 */

export interface ParagraphChange {
  id: string;
  original: string;
  edited: string;
  explanation?: string;
  startPos: number;
  endPos: number;
  applied: boolean;
  rejected: boolean;
}

/**
 * Split text into paragraphs (double newline) or sentences
 */
function splitIntoParagraphs(text: string): string[] {
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/);

  // If we only have one paragraph, try splitting by single newlines
  if (paragraphs.length === 1) {
    const lines = text.split(/\n/);
    if (lines.length > 1) {
      return lines;
    }
  }

  // If still only one section and it's long, split by sentences
  if (paragraphs.length === 1 && text.length > 200) {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  return paragraphs;
}

/**
 * Align original and edited paragraphs
 */
function alignParagraphs(
  originalParagraphs: string[],
  editedParagraphs: string[]
): Array<{ original: string; edited: string }> {
  const aligned: Array<{ original: string; edited: string }> = [];

  // Simple alignment: if counts match, pair them up
  if (originalParagraphs.length === editedParagraphs.length) {
    for (let i = 0; i < originalParagraphs.length; i++) {
      aligned.push({
        original: originalParagraphs[i],
        edited: editedParagraphs[i],
      });
    }
    return aligned;
  }

  // If counts don't match, use fuzzy matching
  const used = new Set<number>();

  for (const origPara of originalParagraphs) {
    let bestMatch = -1;
    let bestScore = 0;

    for (let i = 0; i < editedParagraphs.length; i++) {
      if (used.has(i)) continue;

      const editedPara = editedParagraphs[i];
      const score = calculateSimilarity(origPara, editedPara);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = i;
      }
    }

    if (bestMatch >= 0 && bestScore > 0.3) {
      aligned.push({
        original: origPara,
        edited: editedParagraphs[bestMatch],
      });
      used.add(bestMatch);
    } else {
      // No good match found, paragraph was removed
      aligned.push({
        original: origPara,
        edited: '',
      });
    }
  }

  // Add any unused edited paragraphs as additions
  for (let i = 0; i < editedParagraphs.length; i++) {
    if (!used.has(i)) {
      aligned.push({
        original: '',
        edited: editedParagraphs[i],
      });
    }
  }

  return aligned;
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Generate paragraph-level changes from original and edited text
 */
export function generateParagraphChanges(
  original: string,
  edited: string,
  startPos: number = 0,
  explanation?: string
): ParagraphChange[] {
  const originalParagraphs = splitIntoParagraphs(original);
  const editedParagraphs = splitIntoParagraphs(edited);

  const aligned = alignParagraphs(originalParagraphs, editedParagraphs);

  const changes: ParagraphChange[] = [];
  let currentPos = startPos;

  for (let i = 0; i < aligned.length; i++) {
    const { original: origPara, edited: editedPara } = aligned[i];

    // Skip if no changes
    if (origPara === editedPara) {
      currentPos += origPara.length;
      if (i < originalParagraphs.length - 1) {
        currentPos += 2; // Account for paragraph separator
      }
      continue;
    }

    const change: ParagraphChange = {
      id: `para-${Date.now()}-${i}`,
      original: origPara,
      edited: editedPara,
      explanation,
      startPos: currentPos,
      endPos: currentPos + origPara.length,
      applied: false,
      rejected: false,
    };

    changes.push(change);

    currentPos += origPara.length;
    if (i < originalParagraphs.length - 1) {
      currentPos += 2; // Account for paragraph separator
    }
  }

  return changes;
}

/**
 * Calculate positions for paragraph changes in the context of the full document
 */
export function calculateParagraphPositions(
  fullText: string,
  paragraphChanges: ParagraphChange[]
): ParagraphChange[] {
  return paragraphChanges.map(change => {
    // Find the actual position of this paragraph in the full text
    const index = fullText.indexOf(change.original, change.startPos);

    if (index >= 0) {
      return {
        ...change,
        startPos: index,
        endPos: index + change.original.length,
      };
    }

    // If not found, keep original positions
    return change;
  });
}

