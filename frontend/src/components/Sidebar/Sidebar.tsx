import { FileText, Plus, Clock, Star, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const [activeSection, setActiveSection] = useState('all');
  const {
    filteredDocuments,
    isLoading,
    currentFilter,
    fetchDocuments,
    setFilter,
    createDocument,
    deleteDocument,
    toggleStar,
  } = useDocumentStore();
  const { currentDocument, setDocument } = useEditorStore();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setFilter(activeSection as any);
  }, [activeSection, setFilter]);

  const handleCreateDocument = async () => {
    try {
      const newDoc = await createDocument();
      // Convert to editor document format
      setDocument({
        id: newDoc.id,
        title: newDoc.title,
        content: newDoc.content || {},
        createdAt: new Date(newDoc.created_at),
        updatedAt: new Date(newDoc.updated_at),
      });
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleSelectDocument = (doc: any) => {
    setDocument({
      id: doc.id,
      title: doc.title,
      content: doc.content || {},
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at),
    });
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
    }
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(id);
  };

  const sections = [
    { id: 'all', label: 'All Documents', icon: FileText, color: 'purple' },
    { id: 'recent', label: 'Recent', icon: Clock, color: 'cyan' },
    { id: 'starred', label: 'Starred', icon: Star, color: 'pink' },
    { id: 'trash', label: 'Trash', icon: Trash2, color: 'gray' },
  ];

  const getGlowColor = (color: string) => {
    switch (color) {
      case 'purple': return 'hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]';
      case 'cyan': return 'hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]';
      case 'pink': return 'hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]';
      default: return '';
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-16 glass border-r border-border/50 p-2 flex flex-col items-center gap-2 relative z-10"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateDocument}
          className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 w-full flex items-center justify-center neon-glow-purple"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent my-2" />
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.button
              key={section.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'p-2 rounded-lg w-full flex items-center justify-center transition-all',
                activeSection === section.id
                  ? 'bg-purple-600/30 text-cyan-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5',
                getGlowColor(section.color)
              )}
              title={section.label}
            >
              <Icon className="w-5 h-5" />
            </motion.button>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 glass border-r border-border/50 flex flex-col h-screen relative z-10"
    >
      {/* Header with Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center neon-glow-purple">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold gradient-text">UltraWrite</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateDocument}
          className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 border-b border-border/50">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <motion.button
              key={section.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-purple-600/20 to-cyan-500/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-500/20 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn(
                'w-4 h-4 relative z-10',
                isActive && 'text-cyan-400'
              )} />
              <span className="relative z-10 font-medium">{section.label}</span>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 relative z-10"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 px-4">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 text-sm">No documents yet</p>
            <p className="text-gray-500 text-xs mt-1">Create one to get started</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectDocument(doc)}
                className={cn(
                  'group relative p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5',
                  currentDocument?.id === doc.id && 'bg-gradient-to-r from-purple-600/10 to-cyan-500/10 border border-purple-500/30'
                )}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleStar(doc.id, e)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Star
                        className={cn(
                          'w-3.5 h-3.5',
                          doc.is_starred ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'
                        )}
                      />
                    </button>
                    {currentFilter === 'trash' ? (
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDeleteDocument(doc.id, e)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
