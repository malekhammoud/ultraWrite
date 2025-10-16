import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  text: string;
  id?: string;
}

export interface DiffViewProps {
  changes: DiffChange[];
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onAcceptChange?: (id: string) => void;
  onRejectChange?: (id: string) => void;
  title?: string;
  collapsible?: boolean;
}

export function DiffView({
  changes,
  onAcceptAll,
  onRejectAll,
  onAcceptChange,
  onRejectChange,
  title = 'Suggested Changes',
  collapsible = true,
}: DiffViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [acceptedChanges, setAcceptedChanges] = useState<Set<string>>(new Set());
  const [rejectedChanges, setRejectedChanges] = useState<Set<string>>(new Set());

  const handleAccept = (id?: string) => {
    if (id) {
      setAcceptedChanges((prev) => new Set(prev).add(id));
      if (onAcceptChange) onAcceptChange(id);
    } else {
      if (onAcceptAll) onAcceptAll();
    }
  };

  const handleReject = (id?: string) => {
    if (id) {
      setRejectedChanges((prev) => new Set(prev).add(id));
      if (onRejectChange) onRejectChange(id);
    } else {
      if (onRejectAll) onRejectAll();
    }
  };

  const hasAdditions = changes.some((c) => c.type === 'add');
  const hasRemovals = changes.some((c) => c.type === 'remove');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            {hasRemovals && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500/30 border border-red-500/50 rounded" />
                <span className="text-gray-400">Removed</span>
              </div>
            )}
            {hasAdditions && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500/30 border border-green-500/50 rounded" />
                <span className="text-gray-400">Added</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAccept()}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Accept All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleReject()}
            className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Reject All
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Diff content */}
            <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto bg-black/20">
              {changes.map((change, idx) => {
                const isAccepted = change.id && acceptedChanges.has(change.id);
                const isRejected = change.id && rejectedChanges.has(change.id);

                return (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      'relative inline-block group',
                      change.type === 'add' &&
                        'bg-green-500/20 text-green-300 border-l-2 border-green-500/50 pl-1',
                      change.type === 'remove' &&
                        'bg-red-500/20 text-red-300 line-through border-l-2 border-red-500/50 pl-1',
                      change.type === 'unchanged' && 'text-gray-300',
                      isAccepted && 'opacity-100',
                      isRejected && 'opacity-30'
                    )}
                  >
                    {change.text}

                    {/* Individual change controls */}
                    {change.id && (change.type === 'add' || change.type === 'remove') && !isAccepted && !isRejected && (
                      <span className="absolute -top-6 left-0 hidden group-hover:flex items-center gap-1 bg-gray-900 border border-white/20 rounded px-2 py-1 z-10 shadow-lg">
                        <button
                          onClick={() => handleAccept(change.id)}
                          className="text-green-400 hover:text-green-300 transition-colors"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleReject(change.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </motion.span>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
