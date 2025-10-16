import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, Bot, RefreshCw, ChevronRight, Target, Plus, Trash2, PlayCircle, ClipboardList, History, MessageSquare, ChevronDown, Check, CheckCircle2, Command } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useAISidebarStore } from '@/store/aiSidebarStore';
import { useAIFeedbackStore } from '@/store/aiFeedbackStore';
import { useEditorStore } from '@/store/editorStore';
import { useAgentStore } from '@/store/agentStore';
import { useEditorContext } from '@/contexts/EditorContext';
import { aiApi, agentApi, chatApi, type AIFeedbackRequest, type AgentEditRequest, type ChatRequest } from '@/services/api';
import type { WordSuggestion } from '@/utils/wordDiff';
import { processAIFeedback } from '@/utils/wordDiff';
import { useChatStore } from '@/store/chatStore';

interface AISidebarProps {
  onSuggestionsChange: (suggestions: WordSuggestion[]) => void;
}

// Helper to format evaluation results
function formatEvaluation(evaluation: any): string {
  if (!evaluation) return '';

  const parts = [];

  if (evaluation.score !== undefined) {
    parts.push(`Score: ${evaluation.score}/100`);
  }

  if (evaluation.strengths && evaluation.strengths.length > 0) {
    parts.push('\nStrengths:');
    evaluation.strengths.forEach((s: string) => parts.push(`• ${s}`));
  }

  if (evaluation.weaknesses && evaluation.weaknesses.length > 0) {
    parts.push('\nWeaknesses:');
    evaluation.weaknesses.forEach((w: string) => parts.push(`• ${w}`));
  }

  if (evaluation.suggestions && evaluation.suggestions.length > 0) {
    parts.push('\nSuggestions:');
    evaluation.suggestions.forEach((s: string) => parts.push(`• ${s}`));
  }

  return parts.join('\n');
}

export type AIMode = 'grammar' | 'rewrite' | 'expand' | 'agent' | 'evaluate' | 'chat';

interface ModeConfig {
  id: AIMode;
  title: string;
  icon: any;
  color: string;
  description: string;
  placeholder?: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'grammar',
    title: 'Fix Grammar',
    icon: CheckCircle2,
    color: 'from-green-500 to-emerald-500',
    description: 'Check grammar, spelling, and punctuation',
  },
  {
    id: 'agent',
    title: 'Agent Mode',
    icon: Bot,
    color: 'from-pink-500 to-purple-500',
    description: 'Conversational AI editing',
    placeholder: 'Tell the AI how to edit your text...\n\nExamples:\n• Make it more concise\n• Add more details\n• Make it more formal\n• Fix grammar and improve flow',
  },
  {
    id: 'rewrite',
    title: 'Rewrite',
    icon: RefreshCw,
    color: 'from-purple-500 to-pink-500',
    description: 'Rewrite with custom instructions',
    placeholder: 'How should we rewrite this?\n\nExamples:\n• Make it more professional\n• Simplify for a general audience\n• Use active voice\n• Make it more engaging',
  },
  {
    id: 'expand',
    title: 'Expand',
    icon: ChevronRight,
    color: 'from-cyan-500 to-blue-500',
    description: 'Expand with custom guidance',
    placeholder: 'What should we add?\n\nExamples:\n• Add supporting evidence\n• Include examples\n• Elaborate on key points\n• Add a conclusion',
  },
  {
    id: 'evaluate',
    title: 'Evaluate',
    icon: Target,
    color: 'from-yellow-500 to-orange-500',
    description: 'Evaluate against custom rubrics',
    placeholder: 'Enter your evaluation rubric...\n\nExample:\n• Clarity: Is the writing clear and easy to understand?\n• Evidence: Are claims supported with evidence?\n• Structure: Is the text well-organized?',
  },
  {
    id: 'chat',
    title: 'Chat with Document',
    icon: MessageSquare,
    color: 'from-blue-500 to-cyan-500',
    description: 'Have a conversation about your document',
  },
];

export function AISidebar({ onSuggestionsChange }: AISidebarProps) {
  const {
    currentMode,
    setMode,
    currentInstruction,
    setCurrentInstruction,
    isProcessing,
    setProcessing,
    error,
    setError,
    rubrics,
    activeRubricId,
    addRubric,
    setActiveRubric,
    deleteRubric,
    evaluationResults,
    addEvaluationResult,
    deleteEvaluationResult,
  } = useAISidebarStore();

  const { selectedText } = useAIFeedbackStore();
  const { currentDocument } = useEditorStore();
  const { addMessage, conversationHistory } = useAgentStore();
  const { editor } = useEditorContext();

  const [showRubricInput, setShowRubricInput] = useState(false);
  const [newRubricName, setNewRubricName] = useState('');
  const [evaluateTab, setEvaluateTab] = useState<'rubrics' | 'results'>('rubrics');
  const [selectedMode, setSelectedMode] = useState<AIMode>('grammar');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'chat'>('main');

  // Chat state
  const { messages, addMessage: addChatMessage } = useChatStore();
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const hasSelection = selectedText && selectedText.text.length > 0;
  const selectedModeConfig = MODES.find((m) => m.id === selectedMode) || MODES[0];
  const Icon = selectedModeConfig.icon;
  const config = selectedModeConfig; // Alias for backwards compatibility

  const activeRubric = rubrics.find((r) => r.id === activeRubricId);

  // When mode changes, update sidebar mode for backwards compatibility
  useEffect(() => {
    if (['grammar', 'agent', 'rewrite', 'expand', 'evaluate'].includes(selectedMode)) {
      setMode(selectedMode as 'agent' | 'rewrite' | 'expand' | 'evaluate');
    } else if (selectedMode === 'chat') {
      // Switch to chat tab when chat mode is selected
      setActiveTab('chat');
    }
  }, [selectedMode, setMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentDocument || !currentMode) return;

    // For evaluate mode, ensure we have a rubric
    if (currentMode === 'evaluate') {
      if (!activeRubric && !currentInstruction.trim()) {
        setError('Please select a rubric or create a new one');
        return;
      }

      // If first time using evaluate, save the rubric
      if (!activeRubric && currentInstruction.trim()) {
        addRubric({
          name: newRubricName || 'Untitled Rubric',
          criteria: currentInstruction,
        });
        setShowRubricInput(false);
        setNewRubricName('');
      }
    }

    const instructionToUse = activeRubric ? activeRubric.criteria : currentInstruction;

    // Grammar mode doesn't require instruction
    if (currentMode !== 'grammar' && !instructionToUse.trim()) {
      setError('Please enter instructions');
      return;
    }

    setProcessing(true);
    setError(null);
    onSuggestionsChange([]);

    try {
      // Get the ACTUAL editor selection positions
      if (!editor) {
        setError('Editor not available');
        setProcessing(false);
        return;
      }

      const { from, to } = editor.state.selection;

      // If no selection, use the entire document
      const hasSelection = from !== to;
      const textToProcess = hasSelection && selectedText
        ? selectedText.text
        : editor.getText();

      const actualFrom = hasSelection ? from : 0;
      const actualTo = hasSelection ? to : editor.state.doc.content.size;

      let suggestions: WordSuggestion[] = [];

      if (currentMode === 'grammar') {
        const request: AIFeedbackRequest = {
          documentId: currentDocument.id,
          userId: 'default-user',
          selectedText: textToProcess,
          context: selectedText?.context,
          feedbackType: 'grammar' as any,
          fullDocument: JSON.stringify(currentDocument.content),
        };

        const response = await aiApi.getFeedback(request);

        if (response.errors && response.errors.length > 0) {
          let correctedText = textToProcess;
          response.errors.forEach((error: any) => {
            if (error.originalText && error.suggestion) {
              correctedText = correctedText.replace(error.originalText, error.suggestion);
            }
          });

          suggestions = processAIFeedback(
            textToProcess,
            correctedText,
            actualFrom,
            actualTo,
            'grammar',
            response.errors.map((e: any) => e.message).join('; ')
          );
        }
      } else if (currentMode === 'agent') {
        const request: AgentEditRequest = {
          documentId: currentDocument.id,
          userId: 'default-user',
          selectedText: textToProcess,
          instruction: instructionToUse,
          context: selectedText?.context,
          conversationHistory: conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
        };

        const response = await agentApi.processEdit(request);

        addMessage({
          role: 'user',
          content: instructionToUse,
          timestamp: new Date(),
        });
        addMessage({
          role: 'assistant',
          content: response.explanation,
          timestamp: new Date(),
        });

        suggestions = processAIFeedback(
          textToProcess,
          response.edited,
          actualFrom,
          actualTo,
          'agent',
          response.explanation
        );
      } else if (currentMode === 'rewrite') {
        const request: AIFeedbackRequest = {
          documentId: currentDocument.id,
          userId: 'default-user',
          selectedText: textToProcess,
          context: selectedText?.context,
          feedbackType: 'rewrite',
          fullDocument: JSON.stringify(currentDocument.content),
          customInstruction: instructionToUse,
        };

        const response = await aiApi.getFeedback(request);

        if (response.rewrites && response.rewrites.length > 0) {
          const firstRewrite = response.rewrites[0];
          const newText = typeof firstRewrite === 'string'
            ? firstRewrite
            : (firstRewrite as any).text || '';

          suggestions = processAIFeedback(
            textToProcess,
            newText,
            actualFrom,
            actualTo,
            'rewrite',
            instructionToUse
          );
        }
      } else if (currentMode === 'expand') {
        const request: AIFeedbackRequest = {
          documentId: currentDocument.id,
          userId: 'default-user',
          selectedText: textToProcess,
          context: selectedText?.context,
          feedbackType: 'expand',
          fullDocument: JSON.stringify(currentDocument.content),
          customInstruction: instructionToUse,
        };

        const response = await aiApi.getFeedback(request);

        if (response.expansions && response.expansions.length > 0) {
          const expansion = response.expansions[0] as any;
          const expandText = expansion.text || expansion.content || '';

          suggestions = processAIFeedback(
            textToProcess,
            textToProcess + ' ' + expandText,
            actualFrom,
            actualTo,
            'expand',
            instructionToUse
          );
        }
      } else if (currentMode === 'evaluate') {
        const request: AIFeedbackRequest = {
          documentId: currentDocument.id,
          userId: 'default-user',
          selectedText: textToProcess,
          context: selectedText?.context,
          feedbackType: 'evaluate',
          fullDocument: JSON.stringify(currentDocument.content),
          customInstruction: instructionToUse,
        };

        const response = await aiApi.getFeedback(request);

        // Store the evaluation result in state
        if (response.feedback || response.evaluation) {
          const evaluation: any = response.evaluation || {};
          const rubricToUse = activeRubric || rubrics.find(r => r.criteria === instructionToUse);

          addEvaluationResult({
            rubricId: rubricToUse?.id || 'custom',
            rubricName: rubricToUse?.name || newRubricName || 'Custom Evaluation',
            score: evaluation.score,
            strengths: evaluation.strengths || [],
            weaknesses: evaluation.weaknesses || [],
            suggestions: evaluation.suggestions || [],
            feedback: response.feedback || formatEvaluation(evaluation),
            textSnippet: textToProcess.substring(0, 100),
          });

          // Switch to results tab to show the new evaluation
          setEvaluateTab('results');
        }

        // Don't create suggestions for evaluate mode
        suggestions = [];
      }

      onSuggestionsChange(suggestions);

      // Only clear instruction if not using a saved rubric
      if (currentMode !== 'evaluate' || !activeRubric) {
        setCurrentInstruction('');
      }
    } catch (err: any) {
      console.error('AI processing error:', err);
      setError(err.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const handleRubricSelect = (rubricId: string) => {
    setActiveRubric(rubricId);
    const rubric = rubrics.find((r) => r.id === rubricId);
    if (rubric) {
      setCurrentInstruction(rubric.criteria);
    }
  };

  const handleEvaluateWithRubric = async (rubricId: string) => {
    if (!currentDocument || !editor) return;

    const rubric = rubrics.find((r) => r.id === rubricId);
    if (!rubric) return;

    setProcessing(true);
    setError(null);

    try {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      const textToProcess = hasSelection && selectedText
        ? selectedText.text
        : editor.getText();

      const request: AIFeedbackRequest = {
        documentId: currentDocument.id,
        userId: 'default-user',
        selectedText: textToProcess,
        context: selectedText?.context,
        feedbackType: 'evaluate',
        fullDocument: JSON.stringify(currentDocument.content),
        customInstruction: rubric.criteria,
      };

      const response = await aiApi.getFeedback(request);

      // Store the evaluation result
      if (response.feedback || response.evaluation) {
        const evaluation: any = response.evaluation || {};
        addEvaluationResult({
          rubricId: rubric.id,
          rubricName: rubric.name,
          score: evaluation.score,
          strengths: evaluation.strengths || [],
          weaknesses: evaluation.weaknesses || [],
          suggestions: evaluation.suggestions || [],
          feedback: response.feedback || formatEvaluation(evaluation),
          textSnippet: textToProcess.substring(0, 100),
        });

        // Switch to results tab to show the new evaluation
        setEvaluateTab('results');
      }
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setError(err.message || 'Failed to evaluate');
    } finally {
      setProcessing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatProcessing || !currentDocument || !editor) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatProcessing(true);

    // Add user message
    addChatMessage({
      role: 'user',
      content: userMessage,
    });

    try {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      const request: ChatRequest = {
        message: userMessage,
        documentId: currentDocument.id,
        userId: 'default-user',
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        selectedText: hasSelection && selectedText ? selectedText.text : undefined,
        documentContext: JSON.stringify(currentDocument.content),
      };

      const response = await chatApi.sendMessage(request);

      // Add assistant response
      addChatMessage({
        role: 'assistant',
        content: response.message,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message.',
      });
    } finally {
      setIsChatProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-96 glass border-l border-white/10 flex flex-col h-screen"
    >
      {/* Mode Selector Dropdown - Always visible at top */}
      <div className="p-3 border-b border-white/10 bg-black/20">
        <div className="relative">
          <motion.button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className={cn('w-5 h-5', selectedModeConfig.color.replace('from-', 'text-').replace(' to-', '').split(' ')[0])}>
                <Icon className="w-full h-full" />
              </div>
              <span className="text-sm font-medium text-white">{selectedModeConfig.title}</span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </motion.button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 right-0 glass border border-white/20 rounded-xl p-2 shadow-2xl z-50"
                >
                  {MODES.map((mode) => {
                    const ModeIcon = mode.icon;
                    const isSelected = selectedMode === mode.id;

                    return (
                      <motion.button
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode.id);
                          if (mode.id === 'chat') {
                            setActiveTab('chat');
                          } else {
                            setActiveTab('main');
                          }
                          setIsDropdownOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left',
                          isSelected
                            ? `bg-gradient-to-r ${mode.color} shadow-lg`
                            : 'hover:bg-white/10'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            isSelected ? 'bg-white/20' : 'bg-white/5'
                          )}
                        >
                          <ModeIcon className={cn('w-4 h-4', isSelected ? 'text-white' : mode.color.replace('from-', 'text-').replace(' to-', '').split(' ')[0])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className={cn('text-sm font-semibold', isSelected ? 'text-white' : 'text-gray-200')}>
                              {mode.title}
                            </h4>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <p className={cn('text-xs', isSelected ? 'text-white/80' : 'text-gray-400')}>
                            {mode.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Selection info */}
        <div className="mt-2 flex items-center justify-between text-xs">
          {hasSelection ? (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Sparkles className="w-3 h-3" />
              <span>{selectedText.text.length} chars selected</span>
            </div>
          ) : (
            <span className="text-gray-500">Select text or use full document</span>
          )}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {currentMode ? (
        <>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Universal tabs for all modes - only show if not in chat-only mode */}
            {selectedMode == 'evaluate' && (
              <div className="p-4 pb-0">
                {/* Nested tabs for evaluate mode when on main tab */}
                {currentMode === 'evaluate' && activeTab === 'main' && (
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg mt-2">
                  <button
                    onClick={() => setEvaluateTab('rubrics')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
                      evaluateTab === 'rubrics'
                        ? 'bg-green-500/20 text-green-300'
                        : 'text-gray-400 hover:text-gray-300'
                    )}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Rubrics
                  </button>
                  <button
                    onClick={() => setEvaluateTab('results')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2',
                      evaluateTab === 'results'
                        ? 'bg-green-500/20 text-green-300'
                        : 'text-gray-400 hover:text-gray-300'
                    )}
                  >
                    <History className="w-4 h-4" />
                    Results ({evaluationResults.length})
                  </button>
                </div>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Main tab content */}
                {activeTab === 'main' && (
                  <>

                {/* Rubrics tab content */}
                {currentMode === 'evaluate' && evaluateTab === 'rubrics' && rubrics.length > 0 && !showRubricInput && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Saved Rubrics</label>
                    <div className="space-y-2">
                      {rubrics.map((rubric) => (
                        <div
                          key={rubric.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all group',
                            activeRubricId === rubric.id
                              ? 'bg-green-500/20 border-green-500/50'
                              : 'bg-white/5 border-white/10'
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleRubricSelect(rubric.id)}
                            >
                              <h4 className="text-sm font-medium text-white">{rubric.name}</h4>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {rubric.criteria}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRubric(rubric.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleEvaluateWithRubric(rubric.id)}
                            disabled={isProcessing}
                            className={cn(
                              'w-full px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-2',
                              isProcessing
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30'
                            )}
                          >
                            <PlayCircle className="w-3 h-3" />
                            Evaluate with this Rubric
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowRubricInput(true);
                        setActiveRubric(null);
                        setCurrentInstruction('');
                      }}
                      className="w-full p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Rubric
                    </button>
                  </div>
                )}

                {/* Results tab content */}
                {currentMode === 'evaluate' && evaluateTab === 'results' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Evaluation History</label>
                      {evaluationResults.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Clear all evaluation results?')) {
                              evaluationResults.forEach(result => deleteEvaluationResult(result.id));
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {evaluationResults.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No evaluations yet</p>
                        <p className="text-xs mt-1">Evaluate text with a rubric to see results here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {evaluationResults.map((result) => (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-white">{result.rubricName}</h4>
                                  {result.score !== undefined && (
                                    <span className={cn(
                                      'px-2 py-0.5 rounded text-xs font-bold',
                                      result.score >= 80 ? 'bg-green-500/20 text-green-300' :
                                      result.score >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
                                      'bg-red-500/20 text-red-300'
                                    )}>
                                      {result.score}/100
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(result.evaluatedAt).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                                  "{result.textSnippet}..."
                                </p>
                              </div>
                              <button
                                onClick={() => deleteEvaluationResult(result.id)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>

                            {result.strengths.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-green-300 mb-1">Strengths:</p>
                                <ul className="space-y-0.5">
                                  {result.strengths.map((strength, idx) => (
                                    <li key={idx} className="text-xs text-gray-300 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-green-400">
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.weaknesses.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-red-300 mb-1">Weaknesses:</p>
                                <ul className="space-y-0.5">
                                  {result.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="text-xs text-gray-300 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-red-400">
                                      {weakness}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.suggestions.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-blue-300 mb-1">Suggestions:</p>
                                <ul className="space-y-0.5">
                                  {result.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="text-xs text-gray-300 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-blue-400">
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.feedback && !result.strengths.length && !result.weaknesses.length && (
                              <div>
                                <p className="text-xs text-gray-300 whitespace-pre-wrap">
                                  {result.feedback}
                                </p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rubric name input for new rubrics */}
                {currentMode === 'evaluate' && showRubricInput && !activeRubric && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Rubric Name</label>
                    <input
                      type="text"
                      value={newRubricName}
                      onChange={(e) => setNewRubricName(e.target.value)}
                      placeholder="e.g., Essay Evaluation"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors"
                    />
                  </div>
                )}

                {/* Instruction input - hide for grammar mode */}
                {currentMode !== 'grammar' && (currentMode !== 'evaluate' || showRubricInput || !activeRubric) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      {currentMode === 'evaluate' && !activeRubric ? 'Evaluation Criteria' : 'Instructions'}
                    </label>
                    <textarea
                      value={currentInstruction}
                      onChange={(e) => setCurrentInstruction(e.target.value)}
                      placeholder={config?.placeholder}
                      disabled={isProcessing}
                      className={cn(
                        'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none transition-colors',
                        isProcessing && 'opacity-50 cursor-not-allowed',
                        currentMode === 'agent' && 'focus:border-pink-500/50',
                        currentMode === 'rewrite' && 'focus:border-purple-500/50',
                        currentMode === 'expand' && 'focus:border-cyan-500/50',
                        currentMode === 'evaluate' && 'focus:border-green-500/50'
                      )}
                      rows={8}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Grammar mode info */}
                {currentMode === 'grammar' && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-300 mb-1">Grammar Check Ready</h4>
                        <p className="text-xs text-gray-300">
                          Click "Check Grammar" below to analyze your text for grammar, spelling, and punctuation errors.
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {hasSelection
                            ? `${selectedText.text.length} characters selected`
                            : 'Analyzing entire document'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick examples */}
                {currentMode !== 'evaluate' && currentMode !== 'grammar' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Quick Examples</label>
                    <div className="flex flex-wrap gap-2">
                      {currentMode === 'agent' && [
                        'Make it more concise',
                        'Add more details',
                        'Make it more formal',
                        'Simplify language',
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setCurrentInstruction(example)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                        >
                          {example}
                        </button>
                      ))}
                      {currentMode === 'rewrite' && [
                        'More professional',
                        'Simpler language',
                        'Active voice',
                        'More engaging',
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setCurrentInstruction(example)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                        >
                          {example}
                        </button>
                      ))}
                      {currentMode === 'expand' && [
                        'Add examples',
                        'Add evidence',
                        'Elaborate more',
                        'Add conclusion',
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setCurrentInstruction(example)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
                  >
                    {error}
                  </motion.div>
                )}
                  </>
                )}

                {/* Chat tab content */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full">
                    {/* Chat messages */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-30" />
                          <p className="text-sm font-medium">Start a conversation</p>
                          <p className="text-xs mt-1 px-4">
                            Ask questions about your document, get suggestions, or discuss improvements
                          </p>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                'flex gap-2',
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              )}
                            >
                              {message.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-4 h-4 text-blue-300" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  'max-w-[80%] px-3 py-2 rounded-lg text-sm',
                                  message.role === 'user'
                                    ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                                    : 'bg-white/5 text-gray-200 border border-white/10'
                                )}
                              >
                                {message.role === 'user' ? (
                                  <p className="whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                  <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                                        ul: ({ children }) => <ul className="mb-3 last:mb-0 space-y-1.5 ml-4 pl-6 list-disc marker:text-blue-400">{children}</ul>,
                                        ol: ({ children }) => <ol className="mb-3 last:mb-0 space-y-1.5 ml-4 pl-6 list-decimal marker:text-blue-400">{children}</ol>,
                                        li: ({ children }) => <li className="pl-2 leading-relaxed">{children}</li>,
                                        code: ({ inline, children }: any) =>
                                          inline ? (
                                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-blue-300">
                                              {children}
                                            </code>
                                          ) : (
                                            <code className="block bg-black/30 p-3 rounded text-xs font-mono overflow-x-auto my-3 leading-relaxed">
                                              {children}
                                            </code>
                                          ),
                                        pre: ({ children }) => <pre className="bg-black/30 p-3 rounded overflow-x-auto my-3">{children}</pre>,
                                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                        em: ({ children }) => <em className="italic">{children}</em>,
                                        h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-white">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-base font-bold mb-2.5 mt-3 first:mt-0 text-white">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-2.5 first:mt-0 text-white">{children}</h3>,
                                        blockquote: ({ children }) => (
                                          <blockquote className="border-l-2 border-blue-400 pl-4 py-0.5 italic text-gray-300 my-3">
                                            {children}
                                          </blockquote>
                                        ),
                                        a: ({ href, children }) => (
                                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                            {children}
                                          </a>
                                        ),
                                        hr: () => <hr className="my-4 border-t border-white/20" />,
                                        table: ({ children }) => (
                                          <div className="overflow-x-auto my-3">
                                            <table className="min-w-full divide-y divide-white/20">{children}</table>
                                          </div>
                                        ),
                                        thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
                                        tbody: ({ children }) => <tbody className="divide-y divide-white/10">{children}</tbody>,
                                        tr: ({ children }) => <tr>{children}</tr>,
                                        th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-white">{children}</th>,
                                        td: ({ children }) => <td className="px-3 py-2 text-xs text-gray-300">{children}</td>,
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                                <p className="text-xs opacity-50 mt-1">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              {message.role === 'user' && (
                                <div className="w-7 h-7 rounded-lg bg-gray-600/50 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs text-white">You</span>
                                </div>
                              )}
                            </motion.div>
                          ))}
                          <div ref={chatEndRef} />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - changes based on active tab */}
          {activeTab === 'main' && (hasSelection || ['grammar', 'agent', 'rewrite', 'expand', 'evaluate'].includes(currentMode || '')) && (
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">Cmd/Ctrl</kbd>
                  {' + '}
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">Enter</kbd>
                  {' to send'}
                </p>
              </div>
              <motion.button
                onClick={handleSubmit}
                disabled={isProcessing || (currentMode !== 'grammar' && !currentInstruction.trim())}
                whileHover={!isProcessing && (currentMode === 'grammar' || currentInstruction.trim()) ? { scale: 1.02 } : undefined}
                whileTap={!isProcessing && (currentMode === 'grammar' || currentInstruction.trim()) ? { scale: 0.98 } : undefined}
                className={cn(
                  'w-full px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                  !isProcessing && (currentMode === 'grammar' || currentInstruction.trim())
                    ? `bg-gradient-to-r ${config?.color} text-white shadow-lg hover:shadow-xl`
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                )}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {currentMode === 'grammar'
                        ? 'Check Grammar'
                        : currentMode === 'evaluate' && !activeRubric && rubrics.length === 0
                        ? 'Create & Evaluate'
                        : currentMode === 'evaluate' && !activeRubric
                        ? 'Save & Evaluate'
                        : 'Apply'}
                    </span>
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Chat footer */}
          {activeTab === 'chat' && (
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="Ask anything about your document..."
                  disabled={isChatProcessing}
                  className={cn(
                    'flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500/50 transition-colors',
                    isChatProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                  rows={2}
                />
                <motion.button
                  onClick={handleChatSend}
                  disabled={isChatProcessing || !chatInput.trim()}
                  whileHover={!isChatProcessing && chatInput.trim() ? { scale: 1.05 } : undefined}
                  whileTap={!isChatProcessing && chatInput.trim() ? { scale: 0.95 } : undefined}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
                    !isChatProcessing && chatInput.trim()
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {isChatProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press <kbd className="px-1 bg-white/5 border border-white/10 rounded text-xs">Enter</kbd> to send, <kbd className="px-1 bg-white/5 border border-white/10 rounded text-xs">Shift+Enter</kbd> for new line
              </p>
            </div>
          )}
        </>
      ) : (
        /* Empty state when no mode is selected */
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center text-gray-500">
            <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">AI Assistant</h3>
            <p className="text-sm">
              Select a mode from the toolbar to get started
            </p>
            <div className="mt-6 space-y-2 text-xs text-left">
              <p className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span><strong>Agent:</strong> Get AI-powered edits</span>
              </p>
              <p className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span><strong>Rewrite:</strong> Rephrase your text</span>
              </p>
              <p className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                <span><strong>Expand:</strong> Add more detail</span>
              </p>
              <p className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span><strong>Evaluate:</strong> Get feedback</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
