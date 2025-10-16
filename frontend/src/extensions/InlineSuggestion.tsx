import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SuggestionDecoration {
  from: number;
  to: number;
  type: 'add' | 'remove';
  id: string;
  newText?: string;
}

export interface InlineSuggestionOptions {
  suggestions: SuggestionDecoration[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const InlineSuggestionKey = new PluginKey('inlineSuggestion');

export const InlineSuggestion = Extension.create<InlineSuggestionOptions>({
  name: 'inlineSuggestion',

  addOptions() {
    return {
      suggestions: [],
      onAccept: () => {},
      onReject: () => {},
      onAcceptAll: () => {},
      onRejectAll: () => {},
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: InlineSuggestionKey,

        state: {
          init() {
            return {
              suggestions: [],
            };
          },
          apply(tr: any, value: any) {
            const meta = tr.getMeta(InlineSuggestionKey);
            if (meta) {
              console.log('📝 Updating suggestions:', meta.suggestions);
              return { suggestions: meta.suggestions || [] };
            }
            return value;
          },
        },

        props: {
          decorations(state: any) {
            const pluginState = InlineSuggestionKey.getState(state) as { suggestions: SuggestionDecoration[] };
            const { suggestions } = pluginState;

            console.log('🎨 Creating decorations for suggestions:', suggestions);

            if (!suggestions || suggestions.length === 0) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];

            suggestions.forEach((suggestion) => {
              console.log('  - Processing suggestion:', suggestion);

              if (suggestion.type === 'remove') {
                // Inline decoration for text to be removed (red + strikethrough)
                const deco = Decoration.inline(
                  suggestion.from,
                  suggestion.to,
                  {
                    class: 'bg-red-500/20 text-red-300 line-through',
                    'data-suggestion-id': suggestion.id,
                    'data-suggestion-type': 'remove',
                  },
                  {
                    id: suggestion.id,
                  }
                );
                decorations.push(deco);
                console.log('    ✓ Created remove decoration:', suggestion.from, '->', suggestion.to);
              } else if (suggestion.type === 'add' && suggestion.newText) {
                // Widget decoration for text to be added (green)
                const span = document.createElement('span');
                span.className = 'bg-green-500/20 text-green-300 px-1 rounded mx-0.5';
                span.setAttribute('data-suggestion-id', suggestion.id);
                span.setAttribute('data-suggestion-type', 'add');
                span.textContent = suggestion.newText;
                span.style.display = 'inline-block';
                span.style.position = 'relative';
                span.style.zIndex = '10';

                const deco = Decoration.widget(
                  suggestion.from,
                  span,
                  {
                    id: suggestion.id,
                    side: 1, // Place after position
                  }
                );
                decorations.push(deco);
                console.log('    ✓ Created add widget:', suggestion.newText);
              }
            });

            console.log('🎨 Total decorations created:', decorations.length);
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

// Helper to update suggestions
export function updateSuggestions(editor: any, suggestions: SuggestionDecoration[]) {
  console.log('🔄 updateSuggestions called with:', suggestions);
  const tr = editor.state.tr;
  tr.setMeta(InlineSuggestionKey, { suggestions });
  editor.view.dispatch(tr);
}

// Helper to clear all suggestions
export function clearSuggestions(editor: any) {
  updateSuggestions(editor, []);
}
