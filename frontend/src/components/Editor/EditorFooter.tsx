import { useEditorStore } from '@/store/editorStore';
import { SaveIcon, CheckCircle, FileText, Clock, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditorFooterProps {
  wordCount: number;
  characterCount: number;
}

export function EditorFooter({ wordCount, characterCount }: EditorFooterProps) {
  const { isSaving, lastSaved } = useEditorStore();
  const [lastSavedText, setLastSavedText] = useState<string>('');
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  useEffect(() => {
    if (lastSaved) {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

      if (diff < 60) {
        setLastSavedText('Just now');
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setLastSavedText(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`);
      } else {
        setLastSavedText(lastSaved.toLocaleTimeString());
      }
    }
  }, [lastSaved]);

  const StatBadge = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
      <Icon className="w-3.5 h-3.5 text-cyan-400" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-white font-medium text-sm">{value}</span>
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border-t border-border/50 px-6 py-3 flex items-center justify-between text-sm backdrop-blur-xl relative z-10"
    >
      {/* Left side - Statistics */}
      <div className="flex items-center gap-3">
        <StatBadge icon={FileText} label="words" value={wordCount} />
        <StatBadge icon={BarChart3} label="characters" value={characterCount} />
        <StatBadge icon={Clock} label="min read" value={readingTime || '< 1'} />
      </div>

      {/* Right side - Save status */}
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-2 text-purple-400"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <SaveIcon className="w-4 h-4" />
            </motion.div>
            <span className="font-medium">Saving...</span>
          </motion.div>
        ) : lastSaved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20"
          >
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-medium">Saved</span>
            <span className="text-gray-400 text-xs">{lastSavedText}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

