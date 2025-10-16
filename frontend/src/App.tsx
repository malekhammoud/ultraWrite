import { Sidebar } from './components/Sidebar/Sidebar';
import { EditorPane } from './components/Editor/EditorPane';
import { NotificationToast } from './components/Notifications/NotificationToast';
import { useEditorStore } from './store/editorStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

function App() {
  const { setDocument } = useEditorStore();

  useEffect(() => {
    // Initialize with a default document
    const defaultDoc = {
      id: 'default-doc',
      title: 'Untitled Document',
      content: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try to load from localStorage
    const saved = localStorage.getItem(`document-${defaultDoc.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setDocument({
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      });
    } else {
      setDocument(defaultDoc);
    }
  }, [setDocument]);

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Background animations are now in index.css */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex h-screen w-full relative z-10"
      >
        <Sidebar />
        <EditorPane />
      </motion.div>

      {/* Global notification system */}
      <NotificationToast />
    </div>
  );
}

export default App;
