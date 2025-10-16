import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  ChevronRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Check,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AIMode = 'grammar' | 'rewrite' | 'expand' | 'agent' | 'evaluate';

export interface AIModeOption {
  id: AIMode;
  label: string;
  icon: any;
  description: string;
  color: string;
  gradient: string;
}

const AI_MODES: AIModeOption[] = [
  {
    id: 'grammar',
    label: 'Fix Grammar',
    icon: CheckCircle2,
    description: 'Check grammar, spelling, and punctuation',
    color: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    icon: RefreshCw,
    description: 'Rewrite with custom instructions',
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'expand',
    label: 'Expand',
    icon: ChevronRight,
    description: 'Expand with custom guidance',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'agent',
    label: 'Agent Mode',
    icon: Bot,
    description: 'Conversational AI editing',
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'evaluate',
    label: 'Evaluate',
    icon: Target,
    description: 'Evaluate against custom rubrics',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-500',
  },
];

interface AIModeSelectorProps {
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  disabled?: boolean;
}

export function AIModeSelector({ selectedMode, onModeChange, disabled }: AIModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = AI_MODES.find((m) => m.id === selectedMode) || AI_MODES[0];
  const Icon = selectedOption.icon;

  return (
    <div className="relative">
      <motion.button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          disabled
            ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed'
            : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
          'backdrop-blur-sm'
        )}
      >
        <div className={cn('w-5 h-5', selectedOption.color)}>
          <Icon className="w-full h-full" />
        </div>
        <span className="text-sm font-medium">{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 w-72 glass border border-white/20 rounded-xl p-2 shadow-2xl z-50"
            >
              {AI_MODES.map((mode) => {
                const ModeIcon = mode.icon;
                const isSelected = selectedMode === mode.id;

                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => {
                      onModeChange(mode.id);
                      setIsOpen(false);
                    }}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left',
                      isSelected
                        ? 'bg-gradient-to-r ' + mode.gradient + ' shadow-lg'
                        : 'hover:bg-white/10'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-white/20'
                          : 'bg-white/5'
                      )}
                    >
                      <ModeIcon className={cn('w-4 h-4', isSelected ? 'text-white' : mode.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={cn('text-sm font-semibold', isSelected ? 'text-white' : 'text-gray-200')}>
                          {mode.label}
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
  );
}