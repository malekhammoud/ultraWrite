import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare, Trash2, Settings, FileText, Type } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';
import { useEditorStore } from '@/store/editorStore';
import { useAIFeedbackStore } from '@/store/aiFeedbackStore';
import { useEditorContext } from '@/contexts/EditorContext';
import { chatApi, type ChatRequest } from '@/services/api';
import type { ChatMessage } from '@/store/chatStore';

export function ChatSidebar() {
  const {
    isOpen,
    setOpen,
    messages,
    addMessage,
    clearMessages,
    currentInput,
    setCurrentInput,
    isProcessing,
    setProcessing,
    error,
    setError,
    includeFullDocument,
    setIncludeFullDocument,
    includeSelection,
    setIncludeSelection,
  } = useChatStore();

  const { currentDocument } = useEditorStore();
  const { selectedText } = useAIFeedbackStore();
  const { editor } = useEditorContext();

  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentInput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentInput.trim() || isProcessing || !currentDocument) return;

    const userMessage = currentInput.trim();
    setCurrentInput('');
    setError(null);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    });

    setProcessing(true);

    try {
      // Prepare context
      const docText = includeFullDocument && editor ? editor.getText() : undefined;
      const selectedTextContent = includeSelection && selectedText ? selectedText.text : undefined;

      const request: ChatRequest = {
        documentId: currentDocument.id,
        userId: 'default-user',
        message: userMessage,
        conversationHistory: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        documentContext: docText,
        selectedText: selectedTextContent,
      };

      // Use streaming for real-time response
      let assistantMessage = '';

      // Add a temporary message that we'll update
      addMessage({
        role: 'assistant',
        content: '',
      });

      await chatApi.streamMessage(
        request,
        (chunk) => {
          // Update the last message with streaming content
          assistantMessage += chunk;
          // Note: For real-time updates, we'd need to modify the store
          // For now, we'll just accumulate and update once complete
        },
        () => {
          // Complete - the message is already added above
          // We should update it with the final content
          // This is a limitation of the current store design
        }
      );

      // For now, fallback to non-streaming if streaming fails or isn't available
      if (!assistantMessage) {
        const response = await chatApi.sendMessage(request);
        addMessage({
          role: 'assistant',
          content: response.message,
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message');

      // Add error message
      addMessage({
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear all messages?')) {
      clearMessages();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-96 glass border-l border-white/10 flex flex-col h-screen"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-500 to-cyan-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Chat</h2>
                  <p className="text-xs text-white/70">Ask about your document</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearChat}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  title="Clear chat"
                  disabled={messages.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 pt-3 border-t border-white/20"
              >
                <p className="text-xs text-white/80 mb-2 font-medium">Include in context:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFullDocument}
                      onChange={(e) => setIncludeFullDocument(e.target.checked)}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 checked:bg-white"
                    />
                    <FileText className="w-3 h-3 text-white/80" />
                    <span className="text-xs text-white">Full document</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSelection}
                      onChange={(e) => setIncludeSelection(e.target.checked)}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 checked:bg-white"
                    />
                    <Type className="w-3 h-3 text-white/80" />
                    <span className="text-xs text-white">Selected text</span>
                  </label>
                </div>
              </motion.div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-500/20 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-medium mb-2">Start a conversation</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Ask questions about your document, get writing suggestions, or discuss ideas.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}
                {isProcessing && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs"
            >
              {error}
            </motion.div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Ask about your document..."
                disabled={isProcessing}
                rows={1}
                className={cn(
                  'flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500/50 transition-colors max-h-32',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <motion.button
                type="submit"
                disabled={!currentInput.trim() || isProcessing}
                whileHover={currentInput.trim() && !isProcessing ? { scale: 1.05 } : undefined}
                whileTap={currentInput.trim() && !isProcessing ? { scale: 0.95 } : undefined}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center',
                  currentInput.trim() && !isProcessing
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs">Shift</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs">Enter</kbd>
              {' for new line'}
            </p>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
        )}
      >
        {isUser ? (
          <span className="text-white text-xs font-semibold">You</span>
        ) : (
          <MessageSquare className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message */}
      <div
        className={cn(
          'flex-1 rounded-2xl p-3 text-sm',
          isUser
            ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-tr-sm'
            : 'bg-white/5 border border-white/10 rounded-tl-sm'
        )}
      >
        <p className="text-white whitespace-pre-wrap break-words">{message.content}</p>
        <p className="text-xs text-gray-500 mt-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
