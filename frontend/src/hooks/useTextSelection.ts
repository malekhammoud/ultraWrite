import { useEffect } from 'react';
import { useAIFeedbackStore } from '@/store/aiFeedbackStore';
import type { Editor } from '@tiptap/react';

/**
 * Hook to track text selection in the TipTap editor
 * and update the AI feedback store
 */
export function useTextSelection(editor: Editor | null) {
  const setSelectedText = useAIFeedbackStore((state) => state.setSelectedText);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');

      // Only update if there's actual text selected
      if (text && text.trim().length > 0) {
        // Get context (surrounding text)
        const contextBefore = editor.state.doc.textBetween(
          Math.max(0, from - 100),
          from,
          ' '
        );
        const contextAfter = editor.state.doc.textBetween(
          to,
          Math.min(editor.state.doc.content.size, to + 100),
          ' '
        );

        setSelectedText({
          text: text.trim(),
          from,
          to,
          context: `${contextBefore}${text}${contextAfter}`,
        });
      } else {
        // No text selected, clear selection
        setSelectedText(null);
      }
    };

    // Listen to selection updates
    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, setSelectedText]);
}
