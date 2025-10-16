import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorToolbar } from './EditorToolbar';
import { InlineSuggestionControls } from './InlineSuggestionControls';
import { SuggestionCard } from './SuggestionCard';
import { AISidebar } from '../AISidebar/AISidebar';
import { EditorProvider } from '@/contexts/EditorContext';
import { SuggestionMark } from '@/extensions/SuggestionMark';
import { SelectionHighlight } from '@/extensions/SelectionHighlight';
import type { WordSuggestion } from '@/utils/wordDiff';
import { useEditorStore } from '@/store/editorStore';
import { useDocumentStore } from '@/store/documentStore';
import { useAutosave } from '@/hooks/useAutosave';
import { useTextSelection } from '@/hooks/useTextSelection';
import { notificationManager } from '@/utils/notificationSystem';

export function EditorPane() {
  const { currentDocument, updateContent, updateTitle } = useEditorStore();
  const { updateDocument } = useDocumentStore();
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<{
    suggestion: WordSuggestion;
    position: { x: number; y: number };
  } | null>(null);
  const [localTitle, setLocalTitle] = useState(currentDocument?.title || 'Untitled Document');

  // Debounced title update
  useEffect(() => {
    if (!currentDocument) return;

    const timeoutId = setTimeout(async () => {
      if (localTitle !== currentDocument.title) {
        updateTitle(localTitle);
        await updateDocument(currentDocument.id, { title: localTitle });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localTitle, currentDocument?.id]);

  // Update local title when document changes
  useEffect(() => {
    if (currentDocument?.title) {
      setLocalTitle(currentDocument.title);
    }
  }, [currentDocument?.id]);

  // Create editor first
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
        emptyEditorClass: 'is-editor-empty',
      }),
      SuggestionMark,
      SelectionHighlight.configure({
        onSelectionChange: (from, to, text) => {
          // Optional: You can add additional logic here when selection changes
          console.log('Selection changed:', { from, to, length: text.length });
        },
      }),
    ],
    content: currentDocument?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-full px-8 py-8 text-gray-100',
        spellcheck: 'true',
      },
      handleClick(_view, _pos, event) {
        // Check if clicked element has suggestion mark
        const target = event.target as HTMLElement;
        const suggestionId = target.getAttribute('data-suggestion-id');

        if (suggestionId) {
          event.preventDefault();

          // Find the suggestion
          const suggestion = suggestions.find((s) => s.id === suggestionId);
          if (suggestion) {
            // Get click position for card placement
            const rect = target.getBoundingClientRect();
            setActiveSuggestion({
              suggestion,
              position: {
                x: rect.left,
                y: rect.bottom + 8, // 8px below the underlined text
              },
            });
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      updateContent(json);
    },
    editable: true,
    autofocus: 'end',
  });

  const handleAcceptSuggestion = useCallback(
    (id: string) => {
      if (!editor) return;

      const suggestion = suggestions.find((s) => s.id === id);
      if (!suggestion) return;

      // Remove the suggestion mark first
      editor.commands.unsetSuggestionMark(id);

      try {
        const { from, to, suggestedText } = suggestion;

        // Simple: just apply at the stored position
        const tr = editor.state.tr;

        if (!suggestedText || suggestedText.length === 0) {
          tr.delete(from, to);
        } else {
          tr.replaceWith(from, to, editor.schema.text(suggestedText));
        }

        editor.view.dispatch(tr);

        // Remove from suggestions list
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setActiveSuggestion(null);
        notificationManager.success('Applied', 'Change applied successfully.');
      } catch (error) {
        console.error('Apply error:', error);
        notificationManager.error('Error', 'Could not apply suggestion.');
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        setActiveSuggestion(null);
      }
    },
    [editor, suggestions]
  );

  const handleIgnoreSuggestion = useCallback(
    (id: string) => {
      if (!editor) return;

      // Remove the suggestion mark
      editor.commands.unsetSuggestionMark(id);

      // Remove from suggestions list
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      setActiveSuggestion(null);
    },
    [editor]
  );

  const handleAcceptAll = useCallback(() => {
    if (!editor || suggestions.length === 0) return;

    // Remove all marks first
    suggestions.forEach((suggestion) => {
      editor.commands.unsetSuggestionMark(suggestion.id);
    });

    try {
      // Sort in reverse order to prevent position shifts
      const sorted = [...suggestions].sort((a, b) => b.from - a.from);

      // Create one transaction for all changes
      let tr = editor.state.tr;

      for (const suggestion of sorted) {
        const { from, to, suggestedText } = suggestion;

        if (!suggestedText || suggestedText.length === 0) {
          tr = tr.delete(from, to);
        } else {
          tr = tr.replaceWith(from, to, editor.schema.text(suggestedText));
        }
      }

      editor.view.dispatch(tr);
      setSuggestions([]);

      notificationManager.success('All Applied', `Applied ${sorted.length} suggestions successfully.`);
    } catch (error) {
      console.error('Apply all error:', error);
      notificationManager.error('Error', 'Failed to apply suggestions.');
      setSuggestions([]);
    }
  }, [editor, suggestions]);

  const handleRejectAll = useCallback(() => {
    if (!editor) return;

    // Remove all suggestion marks
    suggestions.forEach((suggestion) => {
      editor.commands.unsetSuggestionMark(suggestion.id);
    });

    setSuggestions([]);
  }, [editor, suggestions]);

  // Update editor content when document changes
  useEffect(() => {
    if (editor && currentDocument?.content) {
      const currentContent = editor.getJSON();
      const newContent = currentDocument.content;

      // Only update if content is actually different to avoid cursor jumps
      if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent);
      }
    }
  }, [currentDocument?.content, editor]);

  // Autosave hook
  useAutosave(currentDocument?.content);

  // Text selection tracking for AI feedback
  useTextSelection(editor);

  // Apply suggestion marks when suggestions change
  useEffect(() => {
    if (!editor || suggestions.length === 0) return;

    suggestions.forEach((suggestion) => {
      if (suggestion.type === 'remove' || suggestion.type === 'replace') {
        editor
          .chain()
          .focus()
          .setTextSelection({ from: suggestion.from, to: suggestion.to })
          .setSuggestionMark({
            id: suggestion.id,
            suggestion: suggestion.suggestedText,
            explanation: suggestion.explanation,
          })
          .run();
      }
    });
  }, [suggestions, editor]);

  return (
    <EditorProvider editor={editor}>
      <div className="flex h-screen flex-1 relative">
        {/* Main editor area */}
        <div className="flex flex-col flex-1 relative">
          <EditorToolbar editor={editor} />
          <div className="flex-1 overflow-y-auto relative bg-transparent pb-20">
            <div className="max-w-4xl mx-auto">
              {/* Document Title */}
              <div className="px-8 pt-8 pb-4">
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  className="w-full text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-600 focus:placeholder-gray-500"
                  placeholder="Untitled Document"
                />
              </div>
              <EditorContent editor={editor} className="min-h-full" />
            </div>
          </div>
          <InlineSuggestionControls
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            hasSuggestions={suggestions.length > 0}
          />

          {/* Suggestion popup card */}
          {activeSuggestion && (
            <SuggestionCard
              originalText={activeSuggestion.suggestion.originalText}
              suggestedText={activeSuggestion.suggestion.suggestedText}
              explanation={activeSuggestion.suggestion.explanation}
              position={activeSuggestion.position}
              onAccept={() => handleAcceptSuggestion(activeSuggestion.suggestion.id)}
              onIgnore={() => handleIgnoreSuggestion(activeSuggestion.suggestion.id)}
              onClose={() => setActiveSuggestion(null)}
            />
          )}
        </div>

        {/* Right sidebar for AI interactions */}
        <AISidebar onSuggestionsChange={setSuggestions} />
      </div>
    </EditorProvider>
  );
}
