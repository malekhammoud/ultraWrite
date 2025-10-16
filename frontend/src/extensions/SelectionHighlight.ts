import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SelectionHighlightOptions {
  onSelectionChange?: (from: number, to: number, text: string) => void;
}

export const SelectionHighlight = Extension.create<SelectionHighlightOptions>({
  name: 'selectionHighlight',

  addOptions() {
    return {
      onSelectionChange: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { onSelectionChange } = this.options;

    return [
      new Plugin({
        key: new PluginKey('selectionHighlight'),

        state: {
          init(): { from: number | null; to: number | null; decorations: DecorationSet } {
            return {
              from: null,
              to: null,
              decorations: DecorationSet.empty,
            };
          },

          apply(tr, value, _oldState, newState): { from: number | null; to: number | null; decorations: DecorationSet } {
            const { selection } = newState;
            const { from, to } = selection;

            // Only track non-empty selections
            if (from !== to) {
              const text = newState.doc.textBetween(from, to, ' ');

              // Call the callback if provided
              if (onSelectionChange) {
                onSelectionChange(from, to, text);
              }

              // Create decoration for the selected range
              const decoration = Decoration.inline(from, to, {
                class: 'active-selection',
                nodeName: 'span',
              });

              return {
                from,
                to,
                decorations: DecorationSet.create(newState.doc, [decoration]),
              };
            } else if (value.from !== null && value.to !== null) {
              // Keep the previous selection highlighted for a moment
              // This maintains the highlight briefly when user starts typing
              const stillValid = value.from < newState.doc.content.size &&
                                value.to <= newState.doc.content.size;

              if (stillValid && tr.docChanged) {
                // If document changed (user typed), maintain highlight for this update
                try {
                  const decoration = Decoration.inline(
                    Math.max(0, value.from),
                    Math.min(newState.doc.content.size, value.to),
                    {
                      class: 'active-selection',
                      nodeName: 'span',
                    }
                  );

                  return {
                    from: value.from,
                    to: value.to,
                    decorations: DecorationSet.create(newState.doc, [decoration]),
                  };
                } catch (e) {
                  // If decoration creation fails, clear it
                  return {
                    from: null,
                    to: null,
                    decorations: DecorationSet.empty,
                  };
                }
              }
            }

            // Clear selection highlight
            return {
              from: null,
              to: null,
              decorations: DecorationSet.empty,
            };
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },
        },

        view() {
          return {
            update(view) {
              const pluginKey = new PluginKey('selectionHighlight');
              const pluginState = pluginKey.getState(view.state);
              const hasActiveSelection = pluginState?.from !== null && pluginState?.to !== null;

              // Toggle class on editor element to control ::selection visibility
              const editorElement = view.dom.closest('.tiptap');
              if (editorElement) {
                if (hasActiveSelection) {
                  editorElement.classList.add('has-active-selection');
                } else {
                  editorElement.classList.remove('has-active-selection');
                }
              }
            },
          };
        },
      }),
    ];
  },
});
