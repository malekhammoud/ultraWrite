import { useEditor } from '@tiptap/react';
import {
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Undo, Redo, Code, Quote, Minus, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  // Calculate word and character count
  const text = editor.getText() || '';
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characterCount = text.length;

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    label,
    disabled
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: any;
    label: string;
    disabled?: boolean;
  }) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={cn(
        'p-2 rounded-lg transition-all relative group',
        disabled && 'opacity-30 cursor-not-allowed',
        !disabled && isActive
          ? 'bg-gradient-to-br from-purple-600/30 to-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      )}
      title={label}
      type="button"
    >
      <Icon className="w-4 h-4 relative z-10" />
      {isActive && !disabled && (
        <motion.div
          layoutId="activeToolbar"
          className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-cyan-500/20 rounded-lg"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      {/* Tooltip */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    </motion.button>
  );

  const Separator = () => (
    <div className="w-px h-6 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent mx-1" />
  );

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border-b border-border/50 p-3 flex items-center gap-1 sticky top-0 z-20 backdrop-blur-xl"
    >
      {/* Format group */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold (⌘+B)"
          disabled={!editor.can().chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic (⌘+I)"
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={Code}
          label="Inline Code (⌘+E)"
          disabled={!editor.can().chain().focus().toggleCode().run()}
        />
      </div>

      <Separator />

      {/* Heading group */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          label="Heading 3"
        />
      </div>

      <Separator />

      {/* List group */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Ordered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          label="Quote"
        />
      </div>

      <Separator />

      {/* Additional formatting */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          icon={Minus}
          label="Horizontal Rule"
        />
      </div>

      <div className="flex-1" />

      {/* Document stats */}
      <div className="flex items-center gap-4 px-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{characterCount} characters</span>
        </div>
      </div>

      <Separator />

      {/* History group */}
      <div className="flex items-center gap-1 px-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          icon={Undo}
          label="Undo (⌘+Z)"
          disabled={!editor.can().chain().focus().undo().run()}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          icon={Redo}
          label="Redo (⌘+⇧+Z)"
          disabled={!editor.can().chain().focus().redo().run()}
        />
      </div>

      <Separator />

    </motion.div>
  );
}

