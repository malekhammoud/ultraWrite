import { create } from 'zustand';
import type { ParagraphChange } from '@/utils/paragraphDiff';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DiffItem {
  type: 'add' | 'remove' | 'unchanged';
  text: string;
}

export interface AgentEdit {
  id: string;
  original: string;
  edited: string;
  explanation: string;
  changes: DiffItem[];
  paragraphChanges?: ParagraphChange[]; // NEW: paragraph-level changes
  timestamp: Date;
  applied: boolean;
}

interface AgentState {
  // Conversation state
  conversationHistory: AgentMessage[];
  addMessage: (message: AgentMessage) => void;
  clearConversation: () => void;

  // Pending edit (shown as preview before applying)
  pendingEdit: AgentEdit | null;
  setPendingEdit: (edit: AgentEdit | null) => void;

  // NEW: Apply/reject individual paragraph
  applyParagraph: (paragraphId: string) => void;
  rejectParagraph: (paragraphId: string) => void;

  // Edit history
  editHistory: AgentEdit[];
  addToHistory: (edit: AgentEdit) => void;

  // Agent state
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Current instruction input
  currentInstruction: string;
  setCurrentInstruction: (instruction: string) => void;

  // Whether agent mode is active
  isAgentModeActive: boolean;
  setAgentModeActive: (active: boolean) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  // Conversation state
  conversationHistory: [],
  addMessage: (message) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, message],
    })),
  clearConversation: () =>
    set({
      conversationHistory: [],
      pendingEdit: null,
      error: null,
    }),

  // Pending edit
  pendingEdit: null,
  setPendingEdit: (edit) => set({ pendingEdit: edit }),

  // NEW: Paragraph-level actions
  applyParagraph: (paragraphId) =>
    set((state) => {
      if (!state.pendingEdit?.paragraphChanges) return state;

      return {
        pendingEdit: {
          ...state.pendingEdit,
          paragraphChanges: state.pendingEdit.paragraphChanges.map(p =>
            p.id === paragraphId ? { ...p, applied: true } : p
          ),
        },
      };
    }),

  rejectParagraph: (paragraphId) =>
    set((state) => {
      if (!state.pendingEdit?.paragraphChanges) return state;

      return {
        pendingEdit: {
          ...state.pendingEdit,
          paragraphChanges: state.pendingEdit.paragraphChanges.map(p =>
            p.id === paragraphId ? { ...p, rejected: true } : p
          ),
        },
      };
    }),

  // Edit history
  editHistory: [],
  addToHistory: (edit) =>
    set((state) => ({
      editHistory: [...state.editHistory, edit],
    })),

  // Agent state
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),
  error: null,
  setError: (error) => set({ error }),

  // Current instruction
  currentInstruction: '',
  setCurrentInstruction: (instruction) => set({ currentInstruction: instruction }),

  // Agent mode active
  isAgentModeActive: false,
  setAgentModeActive: (active) => set({ isAgentModeActive: active }),
}));
