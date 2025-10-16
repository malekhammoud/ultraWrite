import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  documentSnapshot?: string; // Optional: snapshot of document at time of message
}

interface ChatState {
  // Chat visibility
  isOpen: boolean;
  setOpen: (open: boolean) => void;

  // Conversation
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Input state
  currentInput: string;
  setCurrentInput: (input: string) => void;

  // Processing state
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Document context
  includeFullDocument: boolean;
  setIncludeFullDocument: (include: boolean) => void;

  includeSelection: boolean;
  setIncludeSelection: (include: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Visibility
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),

  // Conversation
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),

  // Input
  currentInput: '',
  setCurrentInput: (input) => set({ currentInput: input }),

  // Processing
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Context options
  includeFullDocument: true,
  setIncludeFullDocument: (include) => set({ includeFullDocument: include }),

  includeSelection: true,
  setIncludeSelection: (include) => set({ includeSelection: include }),
}));
