import { motion } from 'framer-motion';
import { Send, Loader2, Check, X, Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAgentStore, type AgentMessage } from '@/store/agentStore';
import { useAIFeedbackStore } from '@/store/aiFeedbackStore';
import { useEditorStore } from '@/store/editorStore';
import { useEditorContext } from '@/contexts/EditorContext';
import { agentApi, type AgentEditRequest } from '@/services/api';
import { applySingleChange } from '@/utils/textIntegration';
import { notificationManager } from '@/utils/notificationSystem';
import { generateParagraphChanges } from '@/utils/paragraphDiff';
import { ParagraphDiffView } from './ParagraphDiffView';

export function AgentMode() {
  const [showDiff, setShowDiff] = useState(true);

  // Agent store
  const {
    conversationHistory,
    addMessage,
    pendingEdit,
    setPendingEdit,
    isProcessing,
    setProcessing,
    error,
    setError,
    currentInstruction,
    setCurrentInstruction,
    addToHistory,
    applyParagraph,
    rejectParagraph,
  } = useAgentStore();

  // Other stores
  const { selectedText } = useAIFeedbackStore();
  const { currentDocument } = useEditorStore();
  const { editor } = useEditorContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentInstruction.trim() || !selectedText || !currentDocument) {
      setError('Please select text and enter an instruction');
      return;
    }

    setProcessing(true);
    setError(null);

    // Add user message to conversation
    const userMessage: AgentMessage = {
      role: 'user',
      content: currentInstruction,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    try {
      const request: AgentEditRequest = {
        documentId: currentDocument.id,
        userId: 'default-user',
        selectedText: selectedText.text,
        instruction: currentInstruction,
        context: selectedText.context,
        conversationHistory,
      };

      const response = await agentApi.processEdit(request);

      // Add assistant response to conversation
      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: response.explanation,
        timestamp: new Date(),
      };
      addMessage(assistantMessage);

      // Generate paragraph-level changes
      const paragraphChanges = generateParagraphChanges(
        response.original,
        response.edited,
        selectedText.from,
        response.explanation
      );

      // Set pending edit for preview
      setPendingEdit({
        id: response.conversationId,
        original: response.original,
        edited: response.edited,
        explanation: response.explanation,
        changes: response.changes,
        paragraphChanges, // Include paragraph-level changes
        timestamp: new Date(),
        applied: false,
      });

      // Clear instruction
      setCurrentInstruction('');
    } catch (err: any) {
      console.error('Agent error:', err);
      setError(err.message || 'Failed to process instruction');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyParagraph = (paragraphId: string) => {
    if (!pendingEdit?.paragraphChanges || !editor || !selectedText) {
      return;
    }

    const paragraph = pendingEdit.paragraphChanges.find(p => p.id === paragraphId);
    if (!paragraph) return;

    try {
      // Apply this specific paragraph change
      const result = applySingleChange(editor, {
        from: paragraph.startPos,
        to: paragraph.endPos,
        insert: paragraph.edited,
      }, false);

      if (result.success) {
        applyParagraph(paragraphId);
        notificationManager.success('Applied', 'Section updated successfully');
      } else {
        setError(result.error || 'Failed to apply change');
        notificationManager.error('Error', result.error || 'Failed to apply change');
      }
    } catch (err: any) {
      console.error('Apply paragraph error:', err);
      setError('Failed to apply change');
      notificationManager.error('Error', 'Something went wrong');
    }
  };

  const handleRejectParagraph = (paragraphId: string) => {
    rejectParagraph(paragraphId);
    notificationManager.info('Rejected', 'Section change rejected');
  };

  const handleApplyAll = () => {
    if (!pendingEdit?.paragraphChanges || !editor) return;

    const pendingChanges = pendingEdit.paragraphChanges.filter(p => !p.applied && !p.rejected);

    // Apply all pending paragraphs
    pendingChanges.forEach(paragraph => {
      handleApplyParagraph(paragraph.id);
    });

    // After all applied, add to history
    setTimeout(() => {
      addToHistory({ ...pendingEdit, applied: true });
      setPendingEdit(null);
    }, 500);
  };

  const handleRejectAll = () => {
    if (!pendingEdit?.paragraphChanges) return;

    const pendingChanges = pendingEdit.paragraphChanges.filter(p => !p.applied && !p.rejected);

    // Reject all pending paragraphs
    pendingChanges.forEach(paragraph => {
      rejectParagraph(paragraph.id);
    });

    notificationManager.info('Rejected', 'All changes rejected');

    // Clear pending edit after a moment
    setTimeout(() => {
      setPendingEdit(null);
    }, 500);
  };

  const handleReject = () => {
    if (!pendingEdit) return;
    setPendingEdit(null);
  };

  const hasSelection = selectedText && selectedText.text.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Info banner */}
      {!hasSelection && (
        <div className="p-3 bg-purple-500/10 border-b border-purple-500/20">
          <p className="text-xs text-purple-300 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Select text to use Agent Mode
          </p>
        </div>
      )}

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Agent Mode</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Like Cursor AI for writing. Tell the AI how to edit your text, and review changes section by section.
            </p>
          </div>
        ) : (
          conversationHistory.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-3 rounded-lg',
                message.role === 'user'
                  ? 'bg-purple-500/20 border border-purple-500/30 ml-8'
                  : 'bg-cyan-500/10 border border-cyan-500/20 mr-8'
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  message.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-cyan-500 text-white'
                )}>
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}

        {/* Pending edit preview - with paragraph-level changes */}
        {pendingEdit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-purple-500/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Suggested Edit
              </h4>
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                {showDiff ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show
                  </>
                )}
              </button>
            </div>

            {showDiff && pendingEdit.paragraphChanges && pendingEdit.paragraphChanges.length > 0 ? (
              // NEW: Show paragraph-level diff view
              <ParagraphDiffView
                paragraphChanges={pendingEdit.paragraphChanges}
                onAcceptParagraph={handleApplyParagraph}
                onRejectParagraph={handleRejectParagraph}
                onAcceptAll={handleApplyAll}
                onRejectAll={handleRejectAll}
              />
            ) : showDiff ? (
              // Fallback: Show simple diff if no paragraph changes
              <>
                <div className="mb-3 p-3 rounded bg-black/20 font-mono text-xs leading-relaxed overflow-x-auto">
                  {pendingEdit.changes.map((change, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        change.type === 'add' && 'bg-green-500/20 text-green-300',
                        change.type === 'remove' && 'bg-red-500/20 text-red-300 line-through',
                        change.type === 'unchanged' && 'text-gray-300'
                      )}
                    >
                      {change.text}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mb-3 italic">
                  {pendingEdit.explanation}
                </p>

                {/* Simple action buttons for fallback */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleApplyAll}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded text-xs font-medium hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Apply All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReject}
                    className="px-3 py-2 bg-white/5 text-gray-400 rounded text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </motion.button>
                </div>
              </>
            ) : null}
          </motion.div>
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
      </div>

      {/* Input form */}
      <div className="p-4 border-t border-border/50">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              value={currentInstruction}
              onChange={(e) => setCurrentInstruction(e.target.value)}
              placeholder={hasSelection ? "Tell me how to edit this text..." : "Select text first..."}
              disabled={!hasSelection || isProcessing}
              className={cn(
                "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors",
                !hasSelection && "opacity-50 cursor-not-allowed"
              )}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {hasSelection ? (
                <>Cmd/Ctrl + Enter to send</>
              ) : (
                <>Select text to enable Agent Mode</>
              )}
            </p>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!hasSelection || !currentInstruction.trim() || isProcessing}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-xs transition-all flex items-center gap-2",
                hasSelection && currentInstruction.trim() && !isProcessing
                  ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
