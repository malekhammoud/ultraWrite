import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface InlineSuggestionControlsProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  hasSuggestions: boolean;
}

export function InlineSuggestionControls({
  onAcceptAll,
  onRejectAll,
  hasSuggestions,
}: InlineSuggestionControlsProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!hasSuggestions) return;

    // Find the first suggestion element
    const suggestion = document.querySelector('[data-suggestion-type]');
    if (suggestion) {
      const rect = suggestion.getBoundingClientRect();
      setPosition({
        top: rect.top - 50,
        left: rect.left,
      });
    }
  }, [hasSuggestions]);

  return (
    <AnimatePresence>
      {hasSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 100,
          }}
          className="flex items-center gap-2 glass border border-white/20 rounded-lg p-2 shadow-2xl backdrop-blur-xl"
        >
          <span className="text-xs text-gray-400 px-2">AI Suggestion</span>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAcceptAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 text-green-400 rounded-md text-xs font-medium transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Accept
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRejectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-md text-xs font-medium transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
