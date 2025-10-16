import { motion } from 'framer-motion';
import { Send, X, Loader2, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AgentInputProps {
  onSubmit: (instruction: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export function AgentInput({ onSubmit, onClose, isProcessing }: AgentInputProps) {
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim() && !isProcessing) {
      onSubmit(instruction.trim());
      setInstruction('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
      >
        <div className="mx-4 glass border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Agent Mode</h2>
                  <p className="text-xs text-gray-400">
                    Tell the AI how to edit your selected text
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Examples */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Make it more concise',
                  'Add more details',
                  'Make it more formal',
                  'Simplify the language',
                  'Add examples',
                ].map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setInstruction(example)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all"
                  >
                    {example}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Make this more professional and add statistics to support the claims..."
                  disabled={isProcessing}
                  className={cn(
                    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                  rows={4}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
                    Cmd/Ctrl
                  </kbd>{' '}
                  +{' '}
                  <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">
                    Enter
                  </kbd>{' '}
                  to send
                </div>

                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={!instruction.trim() || isProcessing}
                    whileHover={
                      instruction.trim() && !isProcessing ? { scale: 1.05 } : undefined
                    }
                    whileTap={
                      instruction.trim() && !isProcessing ? { scale: 0.95 } : undefined
                    }
                    className={cn(
                      'px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2',
                      instruction.trim() && !isProcessing
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-[0_0_30px_rgba(219,39,119,0.5)]'
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
                        <span>Send to Agent</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
