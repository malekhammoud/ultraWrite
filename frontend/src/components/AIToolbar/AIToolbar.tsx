import { motion } from 'framer-motion';
import { Sparkles, Loader2, Command } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AIModeSelector, type AIMode } from './AIModeSelector';
import { useAIFeedbackStore } from '@/store/aiFeedbackStore';
import { useEditorStore } from '@/store/editorStore';
import { useEditorContext } from '@/contexts/EditorContext';
import { aiApi, type AIFeedbackRequest } from '@/services/api';
import { useAISidebarStore } from '@/store/aiSidebarStore';
import type { WordSuggestion } from '@/utils/wordDiff';
import { processAIFeedback } from '@/utils/wordDiff';

interface AIToolbarProps {
  onSuggestionsChange: (suggestions: WordSuggestion[]) => void;
}

export function AIToolbar({ onSuggestionsChange }: AIToolbarProps) {
  const [selectedMode, setSelectedMode] = useState<AIMode>('grammar');
  const [isProcessing, setIsProcessing] = useState(false);

  const { selectedText } = useAIFeedbackStore();
  const { currentDocument } = useEditorStore();
  const { editor } = useEditorContext();
  const { setMode: setSidebarMode } = useAISidebarStore();

  const hasSelection = selectedText && selectedText.text.length > 0;

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (hasSelection) {
          // For modes that need instructions, open sidebar
          if (['agent', 'rewrite', 'expand', 'evaluate'].includes(selectedMode)) {
            setSidebarMode(selectedMode as 'agent' | 'rewrite' | 'expand' | 'evaluate');
          } else {
            // For grammar, process immediately
            handleProcess();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMode, hasSelection]);

  const handleProcess = async () => {
    if (!selectedText || !currentDocument || !editor) return;

    setIsProcessing(true);
    onSuggestionsChange([]);

    try {
      const { from, to } = editor.state.selection;
      let suggestions: WordSuggestion[] = [];

      // Only handle grammar mode here, others are handled by sidebar
      if (selectedMode === 'grammar') {
        const feedbackType = 'grammar';

        const request: AIFeedbackRequest = {
          documentId: currentDocument.id,
          userId: 'default-user',
          selectedText: selectedText.text,
          context: selectedText.context,
          feedbackType: feedbackType as any,
          fullDocument: JSON.stringify(currentDocument.content),
        };

        const response = await aiApi.getFeedback(request);

        if (response.errors && response.errors.length > 0) {
          // Collect all grammar fixes
          let correctedText = selectedText.text;
          response.errors.forEach((error: any) => {
            if (error.originalText && error.suggestion) {
              correctedText = correctedText.replace(error.originalText, error.suggestion);
            }
          });

          // Generate word-level suggestions
          suggestions = processAIFeedback(
            selectedText.text,
            correctedText,
            from,
            to,
            'grammar',
            response.errors.map((e: any) => e.message).join('; ')
          );
        }
      }

      // Apply suggestions using marks
      onSuggestionsChange(suggestions);
    } catch (err: any) {
      console.error('AI processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonLabel = () => {
    switch (selectedMode) {
      case 'agent':
        return 'Ask Agent';
      case 'grammar':
        return 'Fix Grammar';
      case 'rewrite':
        return 'Rewrite';
      case 'expand':
        return 'Expand';
      case 'evaluate':
        return 'Evaluate';
      default:
        return 'Process';
    }
  };

  const handleButtonClick = () => {
    if (!hasSelection || isProcessing) return;

    // For modes that need instructions, open sidebar
    if (['agent', 'rewrite', 'expand', 'evaluate'].includes(selectedMode)) {
      setSidebarMode(selectedMode as 'agent' | 'rewrite' | 'expand' | 'evaluate');
    } else {
      // For grammar, process immediately
      handleProcess();
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 backdrop-blur-xl bg-black/40"
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <AIModeSelector
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            disabled={isProcessing}
          />

          <div className="flex-1">
            {hasSelection ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Sparkles className="w-3 h-3" />
                <span>{selectedText.text.length} characters selected</span>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Select text to use AI tools</div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>

          <motion.button
            whileHover={hasSelection && !isProcessing ? { scale: 1.05 } : undefined}
            whileTap={hasSelection && !isProcessing ? { scale: 0.95 } : undefined}
            onClick={handleButtonClick}
            disabled={!hasSelection || isProcessing}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
              hasSelection && !isProcessing
                ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]'
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
                <Sparkles className="w-4 h-4" />
                <span>{getButtonLabel()}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
