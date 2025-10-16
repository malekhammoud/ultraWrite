import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface SuggestionCardProps {
  originalText: string;
  suggestedText: string;
  explanation?: string;
  position: { x: number; y: number };
  onAccept: () => void;
  onIgnore: () => void;
  onClose: () => void;
}

export const SuggestionCard = ({
  originalText,
  suggestedText,
  explanation,
  position,
  onAccept,
  onIgnore,
  onClose,
}: SuggestionCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Adjust position to prevent going off-screen
  const adjustedPosition = { ...position };
  if (cardRef.current) {
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - rect.width - 16;
    }
    if (rect.bottom > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - rect.height - 16;
    }
    if (adjustedPosition.x < 16) {
      adjustedPosition.x = 16;
    }
    if (adjustedPosition.y < 16) {
      adjustedPosition.y = 16;
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-50 glass rounded-lg shadow-2xl border border-purple-500/20 p-4 max-w-sm"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-xs font-medium text-purple-400 uppercase tracking-wider">
            Suggestion
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text comparison */}
        <div className="space-y-2 mb-4">
          {/* Original text */}
          <div className="flex items-start gap-2">
            <div className="text-xs text-gray-400 mt-0.5 min-w-[60px]">Original:</div>
            <div className="flex-1 text-sm text-red-300 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 line-through">
              {originalText}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <ChevronRight className="w-4 h-4 text-gray-500 rotate-90" />
          </div>

          {/* Suggested text */}
          <div className="flex items-start gap-2">
            <div className="text-xs text-gray-400 mt-0.5 min-w-[60px]">Suggestion:</div>
            <div className="flex-1 text-sm text-green-300 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 font-medium">
              {suggestedText}
            </div>
          </div>
        </div>

        {/* Explanation (if provided) */}
        {explanation && (
          <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded">
            <div className="text-xs text-blue-400 mb-1 font-medium">Why this change?</div>
            <div className="text-xs text-gray-300 leading-relaxed">{explanation}</div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded border border-green-500/30 transition-all hover:border-green-500/50 font-medium"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={() => {
              onIgnore();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 rounded border border-gray-500/20 transition-all hover:border-gray-500/30"
          >
            <X className="w-4 h-4" />
            Ignore
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>Press Esc to close</span>
          <span>Enter to accept</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
