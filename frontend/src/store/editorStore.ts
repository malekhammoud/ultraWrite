import { create } from 'zustand';
import type { JSONContent } from '@tiptap/react';

export interface Document {
  id: string;
  title: string;
  content: JSONContent;
  createdAt: Date;
  updatedAt: Date;
}

interface EditorState {
  currentDocument: Document | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  setDocument: (doc: Document) => void;
  updateContent: (content: JSONContent) => void;
  updateTitle: (title: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocument: null,
  isLoading: false,
  isSaving: false,
  lastSaved: null,

  setDocument: (doc) => {
    set({ currentDocument: doc, lastSaved: null });
  },

  updateContent: (content) => {
    const state = get();
    if (!state.currentDocument) return;

    // Only update if content actually changed to prevent unnecessary re-renders
    const currentContentStr = JSON.stringify(state.currentDocument.content);
    const newContentStr = JSON.stringify(content);

    if (currentContentStr !== newContentStr) {
      set({
        currentDocument: {
          ...state.currentDocument,
          content,
          updatedAt: new Date(),
        },
      });
    }
  },

  updateTitle: (title) => {
    const state = get();
    if (!state.currentDocument) return;

    set({
      currentDocument: {
        ...state.currentDocument,
        title,
        updatedAt: new Date(),
      },
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),

  reset: () => set({
    currentDocument: null,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
  }),
}));
