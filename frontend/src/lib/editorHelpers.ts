import { Editor } from '@tiptap/react';
import type { DiffChange } from '@/components/AIToolbar/DiffView';
import { replaceSelectionSmart, findTextPosition, applySingleChange } from '@/utils/textIntegration';

/**
 * Apply diff changes to the editor
 * Replaces the selected text with the new version from the diff
 *
 * IMPROVED: Uses new integration system for better reliability
 */
export function applyDiffChanges(
  editor: Editor | null,
  changes: DiffChange[],
  originalText: string
): boolean {
  if (!editor) return false;

  try {
    const newText = changes
      .filter((c) => c.type !== 'remove')
      .map((c) => c.text)
      .join('');

    // First, try to find the text at the current selection
    const { from, to } = editor.state.selection;

    if (from !== to) {
      // We have a selection - use smart replacement
      const result = replaceSelectionSmart(editor, newText);
      return result.success;
    }

    // No selection - try to find the original text in the document
    const position = findTextPosition(editor, originalText);

    if (position) {
      // Found it - apply the change
      const result = applySingleChange(editor, {
        from: position.from,
        to: position.to,
        insert: newText,
      });
      return result.success;
    }

    console.error('Could not find original text in document');
    return false;
  } catch (error) {
    console.error('Error applying diff changes:', error);
    return false;
  }
}

/**
 * Insert text at the current cursor position
 *
 * IMPROVED: Uses new integration system
 */
export function insertTextAtCursor(editor: Editor | null, text: string): boolean {
  if (!editor) return false;

  try {
    const { from } = editor.state.selection;
    const result = applySingleChange(editor, {
      from,
      to: from,
      insert: text,
    });
    return result.success;
  } catch (error) {
    console.error('Error inserting text:', error);
    return false;
  }
}

/**
 * Replace selected text
 *
 * IMPROVED: Uses new integration system
 */
export function replaceSelection(editor: Editor | null, newText: string): boolean {
  if (!editor) return false;

  try {
    const { from, to } = editor.state.selection;

    if (from === to) {
      // No selection, just insert
      return insertTextAtCursor(editor, newText);
    }

    const result = replaceSelectionSmart(editor, newText);
    return result.success;
  } catch (error) {
    console.error('Error replacing selection:', error);
    return false;
  }
}

/**
 * Get the currently selected text
 */
export function getSelectedText(editor: Editor | null): string {
  if (!editor) return '';

  const { from, to } = editor.state.selection;
  return editor.state.doc.textBetween(from, to, ' ');
}

/**
 * Get context around the selection (for AI processing)
 */
export function getSelectionContext(
  editor: Editor | null,
  contextLength: number = 200
): { before: string; after: string } {
  if (!editor) return { before: '', after: '' };

  try {
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;

    // Get text before selection
    const beforeStart = Math.max(0, from - contextLength);
    const before = doc.textBetween(beforeStart, from, ' ');

    // Get text after selection
    const afterEnd = Math.min(doc.content.size, to + contextLength);
    const after = doc.textBetween(to, afterEnd, ' ');

    return { before, after };
  } catch (error) {
    console.error('Error getting selection context:', error);
    return { before: '', after: '' };
  }
}
