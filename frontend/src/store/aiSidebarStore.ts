import { create } from 'zustand';

export type AISidebarMode = 'grammar' | 'agent' | 'rewrite' | 'expand' | 'evaluate' | null;

export interface EvaluationRubric {
  id: string;
  name: string;
  criteria: string;
  createdAt: Date;
}

export interface EvaluationResult {
  id: string;
  rubricId: string;
  rubricName: string;
  score?: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  feedback: string;
  evaluatedAt: Date;
  textSnippet: string; // First 100 chars of evaluated text
}

interface AISidebarState {
  // Sidebar visibility and mode
  isOpen: boolean;
  currentMode: AISidebarMode;
  setOpen: (open: boolean) => void;
  setMode: (mode: AISidebarMode) => void;

  // Current instruction input
  currentInstruction: string;
  setCurrentInstruction: (instruction: string) => void;

  // Evaluation rubrics
  rubrics: EvaluationRubric[];
  activeRubricId: string | null;
  addRubric: (rubric: Omit<EvaluationRubric, 'id' | 'createdAt'>) => void;
  setActiveRubric: (id: string | null) => void;
  deleteRubric: (id: string) => void;

  // Evaluation results
  evaluationResults: EvaluationResult[];
  addEvaluationResult: (result: Omit<EvaluationResult, 'id' | 'evaluatedAt'>) => void;
  deleteEvaluationResult: (id: string) => void;
  clearEvaluationResults: () => void;

  // Processing state
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Reset function
  reset: () => void;
}

export const useAISidebarStore = create<AISidebarState>((set) => ({
  // Sidebar state
  isOpen: true, // Always open by default
  currentMode: null,
  setOpen: () => set({ isOpen: true }), // Always stay open, ignore close requests
  setMode: (mode) => set({ currentMode: mode, isOpen: true }), // Always keep open

  // Instruction
  currentInstruction: '',
  setCurrentInstruction: (instruction) => set({ currentInstruction: instruction }),

  // Rubrics
  rubrics: [],
  activeRubricId: null,
  addRubric: (rubric) => {
    const newRubric: EvaluationRubric = {
      ...rubric,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    set((state) => ({
      rubrics: [...state.rubrics, newRubric],
      activeRubricId: newRubric.id,
    }));
  },
  setActiveRubric: (id) => set({ activeRubricId: id }),
  deleteRubric: (id) => set((state) => ({
    rubrics: state.rubrics.filter((r) => r.id !== id),
    activeRubricId: state.activeRubricId === id ? null : state.activeRubricId,
  })),

  // Processing
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),

  // Error
  error: null,
  setError: (error) => set({ error }),

  // Evaluation results
  evaluationResults: [],
  addEvaluationResult: (result) => {
    const newResult: EvaluationResult = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      evaluatedAt: new Date(),
    };
    set((state) => ({
      evaluationResults: [newResult, ...state.evaluationResults], // Newest first
    }));
  },
  deleteEvaluationResult: (id) => set((state) => ({
    evaluationResults: state.evaluationResults.filter((r) => r.id !== id),
  })),
  clearEvaluationResults: () => set({ evaluationResults: [] }),

  // Reset
  reset: () => set({
    currentInstruction: '',
    error: null,
    isProcessing: false,
  }),
}));
