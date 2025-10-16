import { createContext, useContext, type ReactNode } from 'react';
import type { Editor } from '@tiptap/react';

interface EditorContextType {
  editor: Editor | null;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({
  children,
  editor,
}: {
  children: ReactNode;
  editor: Editor | null;
}) {
  return (
    <EditorContext.Provider value={{ editor }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return context;
}
