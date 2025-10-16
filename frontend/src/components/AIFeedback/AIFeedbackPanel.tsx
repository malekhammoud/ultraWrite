import {
  Sparkles, Lightbulb, AlertCircle, CheckCircle,
  RefreshCw, Check, X, ChevronRight, Brain, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAIFeedbackStore, type FeedbackItem } from '@/store/aiFeedbackStore';
import { useEditorStore } from '@/store/editorStore';
import { aiApi, type AIFeedbackRequest } from '@/services/api';

interface AIFeedbackPanelProps {
  isOpen?: boolean;
}

type TabType = 'feedback' | 'rewrite' | 'expand';

export function AIFeedbackPanel({ isOpen = true }: AIFeedbackPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('feedback');

  // AI Feedback store
  const {
    selectedText,
    feedbackItems,
    setFeedbackItems,
    isAnalyzing,
    setAnalyzing,
    error,
    setError,
    clearFeedback,
    rewriteOptions,
    setRewriteOptions,
    expansions,
    setExpansions,
  } = useAIFeedbackStore();

  // Editor store
  const { currentDocument } = useEditorStore();

  // Clear feedback when tab changes
  useEffect(() => {
    clearFeedback();
  }, [activeTab, clearFeedback]);

  const handleAnalyze = async () => {
    if (!selectedText || !currentDocument) {
      setError('Please select some text to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);
    clearFeedback();

    try {
      // Determine feedback type based on active tab
      let feedbackType: 'grammar' | 'clarity' | 'style' | 'rewrite' | 'expand' = 'grammar';

      if (activeTab === 'feedback') {
        // For feedback tab, try grammar first
        feedbackType = 'grammar';
      } else if (activeTab === 'rewrite') {
        feedbackType = 'rewrite';
      } else if (activeTab === 'expand') {
        feedbackType = 'expand';
      }

      const request: AIFeedbackRequest = {
        documentId: currentDocument.id,
        userId: 'default-user', // TODO: Replace with real user ID when auth is added
        selectedText: selectedText.text,
        context: selectedText.context,
        feedbackType,
        fullDocument: JSON.stringify(currentDocument.content),
      };

      const response = await aiApi.getFeedback(request);

      // Parse response based on type
      if (feedbackType === 'grammar') {
        // Grammar feedback - convert to feedback items
        if (response.errors && response.errors.length > 0) {
          const items: FeedbackItem[] = response.errors.map((error: any, index: number) => ({
            id: `grammar-${index}`,
            type: error.type === 'spelling' ? 'warning' : 'suggestion',
            message: error.suggestion || 'Grammar issue detected',
            details: error.explanation,
            originalText: error.originalText,
            suggestion: error.suggestion,
            aiGenerated: true,
          }));
          setFeedbackItems(items);
        } else {
          setFeedbackItems([{
            id: 'no-errors',
            type: 'success',
            message: 'No grammar issues found!',
            details: response.summary || 'Your text looks good.',
            aiGenerated: true,
          }]);
        }
      } else if (feedbackType === 'rewrite') {
        // Rewrite options
        if (response.rewrites) {
          if (Array.isArray(response.rewrites) && typeof response.rewrites[0] === 'object') {
            // Structured rewrites with version info
            setRewriteOptions(response.rewrites.map((r: any) => r.text || r));
          } else {
            // Simple array of strings
            setRewriteOptions(response.rewrites);
          }
        }
      } else if (feedbackType === 'expand') {
        // Expansion options
        if (response.expansions) {
          setExpansions(response.expansions.map((exp: any) => ({
            type: exp.approach || exp.type || 'Expansion',
            content: exp.text || exp.content || '',
            reasoning: exp.reasoning,
          })));
        }
      }
    } catch (err: any) {
      console.error('AI Feedback error:', err);
      setError(err.message || 'Failed to get AI feedback. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'suggestion':
        return Sparkles;
      case 'warning':
        return AlertCircle;
      case 'success':
        return CheckCircle;
      default:
        return Lightbulb;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'from-purple-600/20 to-purple-600/5';
      case 'warning':
        return 'from-yellow-500/20 to-yellow-500/5';
      case 'success':
        return 'from-cyan-500/20 to-cyan-500/5';
      default:
        return 'from-pink-500/20 to-pink-500/5';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return 'text-purple-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-cyan-400';
      default:
        return 'text-pink-400';
    }
  };

  if (!isOpen) {
    return null;
  }

  const tabs = [
    { id: 'feedback' as TabType, label: 'Feedback', icon: Sparkles },
    { id: 'rewrite' as TabType, label: 'Rewrite', icon: RefreshCw },
    { id: 'expand' as TabType, label: 'Expand', icon: ChevronRight },
  ];

  const hasSelection = selectedText && selectedText.text.length > 0;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-96 glass border-l border-border/50 flex flex-col h-screen relative z-10"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-br from-purple-600/10 to-cyan-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center neon-glow-purple">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white">AI Assistant</h2>
            <p className="text-xs text-gray-400">Powered by Gemini 2.5</p>
          </div>
        </div>

        {/* Selection indicator */}
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-white/5 border border-cyan-500/30"
          >
            <p className="text-xs text-cyan-400 font-medium mb-1">Selected Text</p>
            <p className="text-xs text-gray-300 line-clamp-2">{selectedText.text}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all relative',
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {!hasSelection && feedbackItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-400 text-sm">
                    Select text to get AI feedback
                  </p>
                </div>
              ) : feedbackItems.length === 0 && !isAnalyzing ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Ready to analyze your text
                  </p>
                  <p className="text-gray-500 text-xs">
                    Click "Analyze with AI" below
                  </p>
                </div>
              ) : (
                feedbackItems.map((item, index) => {
                  const Icon = getIcon(item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'p-4 rounded-lg border border-white/10 bg-gradient-to-br backdrop-blur-sm',
                        getGradient(item.type)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5', getIconColor(item.type))}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-white mb-1">{item.message}</p>
                          {item.details && (
                            <p className="text-xs text-gray-400 leading-relaxed">{item.details}</p>
                          )}
                          {item.aiGenerated && item.suggestion && (
                            <div className="flex gap-2 mt-3">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Apply
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-3 py-1.5 bg-white/5 text-gray-400 rounded text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Dismiss
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {activeTab === 'rewrite' && (
            <motion.div
              key="rewrite"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {rewriteOptions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-cyan-500/20 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {hasSelection ? 'Get AI rewrite suggestions' : 'Select text to rewrite'}
                  </p>
                  {hasSelection && (
                    <p className="text-gray-500 text-xs">
                      Click "Analyze with AI" below
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">AI rewrite options:</p>
                  {rewriteOptions.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-600/10 to-transparent cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">Option {index + 1}</span>
                        <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{option}</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-3 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        Apply
                      </motion.button>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'expand' && (
            <motion.div
              key="expand"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {expansions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-600/20 to-purple-500/20 flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-cyan-400" />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {hasSelection ? 'Get AI expansion ideas' : 'Select text to expand'}
                  </p>
                  {hasSelection && (
                    <p className="text-gray-500 text-xs">
                      Click "Analyze with AI" below
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">Ways to expand your ideas:</p>
                  {expansions.map((expansion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-600/10 to-transparent"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-4 h-4 text-cyan-400" />
                        <span className="font-medium text-white text-sm">{expansion.type}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed mb-2">{expansion.content}</p>
                      {expansion.reasoning && (
                        <p className="text-xs text-gray-500 italic">{expansion.reasoning}</p>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-3 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium hover:bg-cyan-500/30 transition-colors"
                      >
                        Insert
                      </motion.button>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-border/50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          className={cn(
            "w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
            hasSelection
              ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              : "bg-white/5 text-gray-500 cursor-not-allowed"
          )}
          disabled={isAnalyzing || !hasSelection}
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{hasSelection ? 'Analyze with AI' : 'Select text first'}</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
