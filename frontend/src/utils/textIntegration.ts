import { Editor } from '@tiptap/react';
import type { WordSuggestion } from './wordDiff';
import { integrationLogger } from './integrationLogger';

/**
 * TextIntegration - Robust system for applying LLM suggestions to TipTap editor
 *
 * Key features:
 * - Precise position tracking and validation
 * - Atomic transaction-based operations
 * - Whitespace preservation
 * - Position mapping after edits
 * - Error recovery and validation
 * - Real-time text search and recovery
 */

export interface TextChange {
  from: number;
  to: number;
  insert?: string;
  delete?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  actualText?: string;
  expectedText?: string;
}

export interface ApplyResult {
  success: boolean;
  error?: string;
  appliedCount?: number;
  newPosition?: number;
}

/**
 * Validates that a position range is within bounds and optionally matches expected text
 */
export function validatePosition(
  editor: Editor,
  from: number,
  to: number,
  expectedText?: string
): ValidationResult {
  const { doc } = editor.state;

  // Quick bounds check
  if (from < 0 || to > doc.content.size || from > to) {
    return {
      valid: false,
      error: `Position out of bounds (${from}-${to}, doc size: ${doc.content.size})`
    };
  }

  // Skip validation if no expected text (fast path)
  if (expectedText === undefined) {
    return { valid: true };
  }

  // Get actual text at position
  const actualText = doc.textBetween(from, to, '\n', '\u00A0');

  // Fast comparison - skip normalization if texts match exactly
  if (actualText === expectedText) {
    return { valid: true, actualText };
  }

  // Fallback: normalize and compare (handles whitespace differences)
  const normalizedActual = actualText.replace(/\s+/g, ' ').trim();
  const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();

  if (normalizedActual === normalizedExpected) {
    return { valid: true, actualText };
  }

  return {
    valid: false,
    error: 'Text mismatch - document may have changed',
    actualText,
    expectedText,
  };
}

/**
 * Finds the exact position of text in the document with fuzzy matching
 */
export function findTextPosition(
  editor: Editor,
  searchText: string,
  startFrom: number = 0,
  options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    fuzzyMatch?: boolean;
  } = {}
): { from: number; to: number } | null {
  const { doc } = editor.state;
  const { caseSensitive = true, wholeWord = false, fuzzyMatch = true } = options;

  let searchContent = searchText;
  let docText = doc.textBetween(startFrom, doc.content.size, '\n', '\u00A0');

  if (!caseSensitive) {
    searchContent = searchContent.toLowerCase();
    docText = docText.toLowerCase();
  }

  // Try exact match first
  let index = docText.indexOf(searchContent);

  // If fuzzy matching is enabled and exact match failed, try normalized version
  if (index === -1 && fuzzyMatch) {
    const normalizedSearch = searchContent.replace(/\s+/g, ' ').trim();
    const normalizedDoc = docText.replace(/\s+/g, ' ');
    index = normalizedDoc.indexOf(normalizedSearch);
  }

  if (index === -1) {
    return null;
  }

  const from = startFrom + index;
  const to = from + searchText.length;

  // Validate it's a whole word if requested
  if (wholeWord) {
    const beforeChar = from > 0 ? doc.textBetween(from - 1, from) : ' ';
    const afterChar = to < doc.content.size ? doc.textBetween(to, to + 1) : ' ';

    const isWordBoundary = (char: string) => /[\s\n\r]/.test(char) || char === '';

    if (!isWordBoundary(beforeChar) || !isWordBoundary(afterChar)) {
      // Not a whole word, search for next occurrence
      return findTextPosition(editor, searchText, to, options);
    }
  }

  return { from, to };
}

/**
 * Applies a single text change with validation and error recovery
 * This uses a SINGLE atomic operation to replace text - no separate delete + insert
 */
export function applySingleChange(
  editor: Editor,
  change: TextChange,
  validate: boolean = true
): ApplyResult {
  try {
    const { from, to, insert, delete: shouldDelete } = change;

    integrationLogger.logChange('single', { from, to, insert: insert?.substring(0, 50) });

    // Validate position if requested
    if (validate) {
      const validation = validatePosition(editor, from, to);
      if (!validation.valid) {
        integrationLogger.logError('validation_failed', validation.error || 'Unknown error');
        return { success: false, error: validation.error };
      }
    }

    // CRITICAL FIX: Use replaceWith instead of delete + insert
    // This is atomic and prevents the text from being removed without replacement
    const tr = editor.state.tr;

    if (insert !== undefined && insert.length > 0) {
      // Replace the range with new text in a SINGLE operation
      tr.replaceWith(from, to, editor.schema.text(insert));
    } else if (shouldDelete) {
      // Only delete if we explicitly want to delete with no replacement
      tr.delete(from, to);
    }

    // Dispatch the transaction
    editor.view.dispatch(tr);

    // Calculate new position
    const newPosition = insert !== undefined ? from + insert.length : from;

    integrationLogger.logSuccess('apply_single', { newPosition });
    return { success: true, newPosition };
  } catch (error) {
    integrationLogger.logError('apply_single_failed', String(error));
    return { success: false, error: String(error) };
  }
}

/**
 * Applies multiple changes in a single atomic transaction
 * Changes are automatically sorted in reverse order to prevent position shifts
 */
export function applyChangesAtomic(
  editor: Editor,
  changes: TextChange[]
): ApplyResult {
  if (changes.length === 0) {
    return { success: true, appliedCount: 0 };
  }

  integrationLogger.logChange('atomic_start', { count: changes.length });

  try {
    // Sort changes in reverse order to prevent position shifts
    const sortedChanges = [...changes].sort((a, b) => b.from - a.from);

    // Validate all changes first
    for (let i = 0; i < sortedChanges.length; i++) {
      const change = sortedChanges[i];
      const validation = validatePosition(editor, change.from, change.to);
      if (!validation.valid) {
        integrationLogger.logError('atomic_validation_failed',
          `Change ${i} at ${change.from}-${change.to}: ${validation.error}`
        );
        return {
          success: false,
          error: `Validation failed at position ${change.from}-${change.to}: ${validation.error}`,
          appliedCount: 0,
        };
      }
    }

    // Create single transaction for all changes
    let tr = editor.state.tr;

    for (const change of sortedChanges) {
      const { from, to, insert, delete: shouldDelete } = change;

      if (shouldDelete || (insert !== undefined && from !== to)) {
        tr = tr.delete(from, to);
      }

      if (insert !== undefined && insert.length > 0) {
        const textNode = editor.schema.text(insert);
        tr = tr.insert(from, textNode);
      }
    }

    // Apply all changes at once
    editor.view.dispatch(tr);

    integrationLogger.logSuccess('atomic_complete', { count: changes.length });
    return { success: true, appliedCount: changes.length };
  } catch (error) {
    integrationLogger.logError('atomic_failed', String(error));
    return { success: false, error: String(error), appliedCount: 0 };
  }
}

/**
 * Converts WordSuggestion to TextChange
 */
export function suggestionToChange(suggestion: WordSuggestion): TextChange {
  switch (suggestion.type) {
    case 'add':
      return {
        from: suggestion.from,
        to: suggestion.from,
        insert: suggestion.suggestedText,
      };

    case 'remove':
      return {
        from: suggestion.from,
        to: suggestion.to,
        delete: true,
      };

    case 'replace':
      return {
        from: suggestion.from,
        to: suggestion.to,
        insert: suggestion.suggestedText,
      };

    default:
      throw new Error(`Unknown suggestion type: ${(suggestion as any).type}`);
  }
}

/**
 * Applies a single suggestion with automatic position recovery
 */
export function applySuggestion(
  editor: Editor,
  suggestion: WordSuggestion
): ApplyResult {
  integrationLogger.logChange('suggestion', {
    id: suggestion.id,
    type: suggestion.type,
    from: suggestion.from,
    to: suggestion.to
  });

  // Fast path: try to apply at stored position first
  const validation = validatePosition(
    editor,
    suggestion.from,
    suggestion.to,
    suggestion.originalText
  );

  let finalSuggestion = suggestion;

  // If validation failed and we have original text, try to find it
  if (!validation.valid && suggestion.originalText) {
    integrationLogger.logChange('position_recovery', { original: suggestion.originalText.substring(0, 30) });

    const newPosition = findTextPosition(editor, suggestion.originalText, 0, { fuzzyMatch: true });

    if (!newPosition) {
      integrationLogger.logError('text_not_found', suggestion.originalText.substring(0, 50));
      return {
        success: false,
        error: `Could not find text: "${suggestion.originalText.substring(0, 50)}..."`
      };
    }

    integrationLogger.logSuccess('position_recovered', newPosition);
    finalSuggestion = {
      ...suggestion,
      from: newPosition.from,
      to: newPosition.to,
    };
  }

  // Convert and apply (skip validation since we just did it)
  const change = suggestionToChange(finalSuggestion);
  return applySingleChange(editor, change, false);
}

/**
 * Applies multiple suggestions atomically with automatic recovery
 */
export function applySuggestionsAtomic(
  editor: Editor,
  suggestions: WordSuggestion[]
): ApplyResult {
  integrationLogger.logChange('suggestions_atomic_start', { count: suggestions.length });

  // Validate and potentially relocate all suggestions first
  const validatedSuggestions: WordSuggestion[] = [];

  for (const suggestion of suggestions) {
    const validation = validatePosition(
      editor,
      suggestion.from,
      suggestion.to,
      suggestion.originalText
    );

    if (!validation.valid) {
      integrationLogger.logChange('suggestion_recovery', { id: suggestion.id });

      // Try to find the text
      if (!suggestion.originalText) {
        integrationLogger.logError('no_original_text', suggestion.id);
        return {
          success: false,
          error: `Cannot recover suggestion ${suggestion.id}: no original text`,
          appliedCount: 0,
        };
      }

      const newPosition = findTextPosition(editor, suggestion.originalText, 0, { fuzzyMatch: true });

      if (!newPosition) {
        integrationLogger.logError('recovery_failed', suggestion.id);
        return {
          success: false,
          error: `Could not find text for suggestion ${suggestion.id}: "${suggestion.originalText.substring(0, 50)}"`,
          appliedCount: 0,
        };
      }

      validatedSuggestions.push({
        ...suggestion,
        from: newPosition.from,
        to: newPosition.to,
      });
    } else {
      validatedSuggestions.push(suggestion);
    }
  }

  // Convert all to changes
  const changes = validatedSuggestions.map(suggestionToChange);

  // Apply atomically
  return applyChangesAtomic(editor, changes);
}

/**
 * Replaces text in a selection, preserving surrounding context
 * Uses ATOMIC replaceWith operation - guaranteed to work like Cursor/Claude
 */
export function replaceSelectionSmart(
  editor: Editor,
  newText: string,
  options: {
    preserveWhitespace?: boolean;
    from?: number;
    to?: number;
  } = {}
): ApplyResult {
  const { preserveWhitespace = true, from: customFrom, to: customTo } = options;

  try {
    const from = customFrom !== undefined ? customFrom : editor.state.selection.from;
    const to = customTo !== undefined ? customTo : editor.state.selection.to;

    // Validate bounds before attempting to replace
    const { doc } = editor.state;
    if (from < 0 || to > doc.content.size || from > to) {
      integrationLogger.logError('replace_selection_bounds', `Invalid bounds: ${from}-${to}, doc size: ${doc.content.size}`);
      return {
        success: false,
        error: `Invalid position: ${from}-${to} (document has ${doc.content.size} characters)`
      };
    }

    const oldText = editor.state.doc.textBetween(from, to, '\n', '\u00A0');

    // Ensure we have text to insert
    if (!newText) {
      integrationLogger.logError('replace_selection_no_text', 'No new text provided');
      return {
        success: false,
        error: 'No replacement text provided'
      };
    }

    let textToInsert = newText;

    // Preserve leading/trailing whitespace if requested
    if (preserveWhitespace && oldText) {
      const leadingWhitespace = oldText.match(/^\s*/)?.[0] || '';
      const trailingWhitespace = oldText.match(/\s*$/)?.[0] || '';
      textToInsert = leadingWhitespace + newText.trim() + trailingWhitespace;
    }

    // Don't do anything if the text is exactly the same
    if (oldText === textToInsert) {
      integrationLogger.logChange('replace_selection_noop', 'Text is already the same, skipping');
      return {
        success: true,
        newPosition: to
      };
    }

    integrationLogger.logChange('replace_selection', {
      from,
      to,
      oldText: oldText.substring(0, 50),
      newText: textToInsert.substring(0, 50),
      oldLength: oldText.length,
      newLength: textToInsert.length
    });

    // CRITICAL: Use atomic replaceWith operation
    const tr = editor.state.tr;
    tr.replaceWith(from, to, editor.schema.text(textToInsert));
    editor.view.dispatch(tr);

    const newPosition = from + textToInsert.length;
    integrationLogger.logSuccess('replace_selection_complete', { newPosition });

    return {
      success: true,
      newPosition
    };
  } catch (error) {
    integrationLogger.logError('replace_selection_failed', String(error));
    return { success: false, error: String(error) };
  }
}

/**
 * Replaces text by finding it in the document (more reliable than position-based)
 */
export function replaceTextByContent(
  editor: Editor,
  originalText: string,
  newText: string,
  options: {
    preserveWhitespace?: boolean;
    caseSensitive?: boolean;
  } = {}
): ApplyResult {
  const { preserveWhitespace = true, caseSensitive = true } = options;

  integrationLogger.logChange('replace_by_content', {
    originalLength: originalText.length,
    newLength: newText.length
  });

  // Find the text in the document
  const position = findTextPosition(editor, originalText, 0, {
    caseSensitive,
    fuzzyMatch: true
  });

  if (!position) {
    integrationLogger.logError('text_not_found_for_replace', originalText.substring(0, 50));
    return {
      success: false,
      error: `Could not find text: "${originalText.substring(0, 50)}..."`
    };
  }

  // Replace using the found position
  return replaceSelectionSmart(editor, newText, {
    preserveWhitespace,
    from: position.from,
    to: position.to,
  });
}

/**
 * Gets the current selection info with validation
 */
export function getSelectionInfo(editor: Editor): {
  from: number;
  to: number;
  text: string;
  isEmpty: boolean;
} | null {
  try {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '\n', '\u00A0');

    return {
      from,
      to,
      text,
      isEmpty: from === to,
    };
  } catch (error) {
    integrationLogger.logError('get_selection_info_failed', String(error));
    return null;
  }
}
