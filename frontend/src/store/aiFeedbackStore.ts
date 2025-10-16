import { create } from 'zustand';
import type { AIFeedbackResponse } from '@/services/api';

export interface TextSelection {
  text: string;
  from: number;
  to: number;
  context?: string;
}

export interface FeedbackItem {
  id: string;
  type: 'grammar' | 'clarity' | 'style' | 'suggestion' | 'warning' | 'success' | 'info';
  message: string;
  details?: string;
  originalText?: string;
  suggestion?: string;
  aiGenerated: boolean;
}

interface AIFeedbackState {
  // Selection state
  selectedText: TextSelection | null;
  setSelectedText: (selection: TextSelection | null) => void;

  // Feedback state
  currentFeedback: AIFeedbackResponse | null;
  feedbackItems: FeedbackItem[];
  setFeedbackItems: (items: FeedbackItem[]) => void;
  addFeedbackItem: (item: FeedbackItem) => void;
  removeFeedbackItem: (id: string) => void;
  clearFeedback: () => void;

  // Loading states
  isAnalyzing: boolean;
  setAnalyzing: (analyzing: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Active feedback type
  activeFeedbackType: 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand' | null;
  setActiveFeedbackType: (type: 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand' | null) => void;

  // Rewrite options
  rewriteOptions: string[];
  setRewriteOptions: (options: string[]) => void;

  // Expansions
  expansions: Array<{ type: string; content: string; reasoning?: string }>;
  setExpansions: (expansions: Array<{ type: string; content: string; reasoning?: string }>) => void;
}

export const useAIFeedbackStore = create<AIFeedbackState>((set) => ({
  // Selection state
  selectedText: null,
  setSelectedText: (selection) => set({ selectedText: selection }),

  // Feedback state
  currentFeedback: null,
  feedbackItems: [],
  setFeedbackItems: (items) => set({ feedbackItems: items }),
  addFeedbackItem: (item) =>
    set((state) => ({
      feedbackItems: [...state.feedbackItems, item],
    })),
  removeFeedbackItem: (id) =>
    set((state) => ({
      feedbackItems: state.feedbackItems.filter((item) => item.id !== id),
    })),
  clearFeedback: () =>
    set({
      currentFeedback: null,
      feedbackItems: [],
      rewriteOptions: [],
      expansions: [],
      error: null,
    }),

  // Loading states
  isAnalyzing: false,
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  error: null,
  setError: (error) => set({ error }),

  // Active feedback type
  activeFeedbackType: null,
  setActiveFeedbackType: (type) => set({ activeFeedbackType: type }),

  // Rewrite options
  rewriteOptions: [],
  setRewriteOptions: (options) => set({ rewriteOptions: options }),

  // Expansions
  expansions: [],
  setExpansions: (expansions) => set({ expansions }),
}));
