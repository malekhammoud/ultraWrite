import { Mark, mergeAttributes } from '@tiptap/core';

export interface SuggestionMarkOptions {
  HTMLAttributes: Record<string, any>;
}

export interface SuggestionMarkAttributes {
  id: string;
  suggestion: string;
  explanation?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    suggestionMark: {
      setSuggestionMark: (attributes: SuggestionMarkAttributes) => ReturnType;
      unsetSuggestionMark: (id: string) => ReturnType;
    };
  }
}

export const SuggestionMark = Mark.create<SuggestionMarkOptions>({
  name: 'suggestionMark',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-suggestion-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-suggestion-id': attributes.id,
          };
        },
      },
      suggestion: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-suggestion'),
        renderHTML: (attributes) => {
          if (!attributes.suggestion) {
            return {};
          }
          return {
            'data-suggestion': attributes.suggestion,
          };
        },
      },
      explanation: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-explanation'),
        renderHTML: (attributes) => {
          if (!attributes.explanation) {
            return {};
          }
          return {
            'data-explanation': attributes.explanation,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-suggestion-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'suggestion-underline',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setSuggestionMark:
        (attributes: SuggestionMarkAttributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetSuggestionMark:
        (id: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;

          let found = false;

          // Search the entire document for marks with this ID
          doc.descendants((node, pos) => {
            if (node.marks) {
              node.marks.forEach((mark) => {
                if (mark.type.name === this.name && mark.attrs.id === id) {
                  const from = pos;
                  const to = pos + node.nodeSize;

                  // Remove the mark from this range
                  tr.removeMark(from, to, mark.type);
                  found = true;
                }
              });
            }
          });

          if (found && dispatch) {
            dispatch(tr);
          }

          return found;
        },
    };
  },
});
