import { useEffect, useRef } from 'react';
import type { JSONContent } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';

const AUTOSAVE_DELAY = 2000; // 2 seconds - longer to reduce flickering

export function useAutosave(content: JSONContent | undefined) {
  const { setSaving, setLastSaved, currentDocument } = useEditorStore();
  const { updateDocument } = useDocumentStore();
  const timeoutRef = useRef<number | null>(null);
  const lastSavedContentRef = useRef<string>('');

  useEffect(() => {
    if (!content || !currentDocument) return;

    // Convert content to string for comparison
    const contentStr = JSON.stringify(content);

    // Skip if content hasn't actually changed
    if (contentStr === lastSavedContentRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = window.setTimeout(async () => {
      setSaving(true);

      try {
        // Save to backend API
        await updateDocument(currentDocument.id, {
          content,
        });

        // Also save to localStorage as backup
        const documentToSave = {
          ...currentDocument,
          content,
          updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(
          `document-${currentDocument.id}`,
          JSON.stringify(documentToSave)
        );

        // Update last saved content reference
        lastSavedContentRef.current = contentStr;
        setLastSaved(new Date());

        // Wait a bit before clearing saving state for visual feedback
        setTimeout(() => {
          setSaving(false);
        }, 300);
      } catch (error) {
        console.error('Failed to save document:', error);
        setSaving(false);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, currentDocument?.id]); // Simplified dependencies
}
