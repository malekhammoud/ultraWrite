import { Mark, mergeAttributes } from '@tiptap/core';

// Mark for text that will be removed (red)
export const DiffRemove = Mark.create({
  name: 'diffRemove',

  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-diff-remove]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-diff-remove': '',
        class: 'bg-red-500/20 text-red-300 line-through decoration-red-500 relative inline-block px-0.5 rounded',
      }),
      0,
    ];
  },
});

// Mark for text that will be added (green)
export const DiffAdd = Mark.create({
  name: 'diffAdd',

  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-diff-add]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-diff-add': '',
        class: 'bg-green-500/20 text-green-300 relative inline-block px-0.5 rounded',
      }),
      0,
    ];
  },
});
