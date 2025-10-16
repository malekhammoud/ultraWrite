import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParagraphChange } from '@/utils/paragraphDiff';

export interface ParagraphDiffViewProps {
  paragraphChanges: ParagraphChange[];
  onAcceptParagraph: (id: string) => void;
  onRejectParagraph: (id: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

export function ParagraphDiffView({
  paragraphChanges,
  onAcceptParagraph,
  onRejectParagraph,
  onAcceptAll,
  onRejectAll,
}: ParagraphDiffViewProps) {
  const pendingChanges = paragraphChanges.filter(p => !p.applied && !p.rejected);
  const hasChanges = pendingChanges.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-white">
            Suggested Changes by Section
          </h4>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            {pendingChanges.length} pending
          </span>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAcceptAll}
              className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Accept All
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRejectAll}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reject All
            </motion.button>
          </div>
        )}
      </div>

      {/* Info message */}
      {hasChanges && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-cyan-300">
              Review each section individually. Accept the changes you like and reject the ones you don't.
            </p>
          </div>
        </div>
      )}

      {/* Paragraph changes */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {paragraphChanges.map((change, index) => (
            <ParagraphChangeCard
              key={change.id}
              change={change}
              index={index}
              onAccept={() => onAcceptParagraph(change.id)}
              onReject={() => onRejectParagraph(change.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {!hasChanges && paragraphChanges.length > 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-sm text-gray-400">All changes reviewed</p>
        </div>
      )}
    </div>
  );
}

interface ParagraphChangeCardProps {
  change: ParagraphChange;
  index: number;
  onAccept: () => void;
  onReject: () => void;
}

function ParagraphChangeCard({
  change,
  index,
  onAccept,
  onReject,
}: ParagraphChangeCardProps) {
  const isApplied = change.applied;
  const isRejected = change.rejected;
  const isPending = !isApplied && !isRejected;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isApplied || isRejected ? 0.5 : 1,
        y: 0
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'glass border rounded-xl overflow-hidden transition-all',
        isPending && 'border-purple-500/30 bg-purple-500/5',
        isApplied && 'border-green-500/30 bg-green-500/5',
        isRejected && 'border-white/10 bg-white/5'
      )}
    >
      {/* Header */}
      <div className="px-4 py-2 bg-black/20 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Section {index + 1}</span>
          {isApplied && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Applied
            </span>
          )}
          {isRejected && (
            <span className="px-2 py-0.5 bg-white/10 text-gray-400 text-xs rounded-full flex items-center gap-1">
              <X className="w-3 h-3" />
              Rejected
            </span>
          )}
        </div>

        {isPending && (
          <div className="flex gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAccept}
              className="p-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg transition-all"
              title="Accept this change"
            >
              <Check className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onReject}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
              title="Reject this change"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Content - Side by side diff */}
      <div className="grid grid-cols-2 divide-x divide-white/10">
        {/* Original */}
        <div className="p-4">
          <div className="text-xs text-gray-400 mb-2 font-medium">Original</div>
          <div className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
            {change.original || <span className="text-gray-500 italic">(empty)</span>}
          </div>
        </div>

        {/* Edited */}
        <div className="p-4 bg-green-500/5">
          <div className="text-xs text-green-400 mb-2 font-medium">Suggested</div>
          <div className="text-sm text-green-300 font-mono leading-relaxed whitespace-pre-wrap">
            {change.edited || <span className="text-gray-500 italic">(removed)</span>}
          </div>
        </div>
      </div>

      {/* Explanation */}
      {change.explanation && isPending && (
        <div className="px-4 py-2 bg-cyan-500/5 border-t border-cyan-500/20">
          <p className="text-xs text-cyan-300">{change.explanation}</p>
        </div>
      )}
    </motion.div>
  );
}

