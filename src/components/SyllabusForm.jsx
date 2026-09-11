import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
  FaUndo,
  FaRedo,
  FaMinus,
  FaEraser,
} from 'react-icons/fa';

function ToolbarButton({ onClick, isActive = false, disabled = false, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[28px] h-7 ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function SyllabusForm({ handleSubmit, editData = null, onCancel, moduleId }) {
  const [formData, setFormData] = useState({
    title: '',
    workout_instructions: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: editData?.workout_instructions || '',
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[160px] max-h-[350px] overflow-y-auto px-4 py-3 focus:outline-none text-gray-800 text-sm leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();
      setFormData(prev => ({
        ...prev,
        workout_instructions: html,
      }));
    },
  });

  // Populate form if editing or when editData changes
  useEffect(() => {
    if (editData) {
      const titleVal = editData.title || '';
      const instructionsVal = editData.workout_instructions || '';

      setFormData({
        title: titleVal,
        workout_instructions: instructionsVal,
      });

      if (editor && !editor.isDestroyed) {
        if (editor.getHTML() !== instructionsVal) {
          editor.commands.setContent(instructionsVal);
        }
      }
    } else {
      setFormData({
        title: '',
        workout_instructions: '',
      });

      if (editor && !editor.isDestroyed) {
        editor.commands.setContent('');
      }
    }
  }, [editData, editor]);

  // Keep editor editable state synchronized with loading state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!loading);
    }
  }, [loading, editor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    try {
      // Determine instructions: send HTML string or null if empty
      const instructions = editor
        ? (editor.isEmpty ? null : editor.getHTML())
        : (formData.workout_instructions.trim() ? formData.workout_instructions : null);

      // Prepare the final submission data
      const submitData = {
        module_id: parseInt(moduleId),
        title: formData.title.trim(),
        workout_instructions: instructions,
      };

      await handleSubmit(submitData, editData?.id);

      // Reset form on success
      if (!editData) {
        setFormData({
          title: '',
          workout_instructions: '',
        });
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent('');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Syllabus Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter syllabus title"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          required
          disabled={loading}
        />
      </div>

      {/* Workout Instructions Field (TipTap Rich Text Editor) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Workout Instructions
          </label>
          <span className="text-xs text-gray-400">Optional</span>
        </div>

        <div
          className={`border rounded-lg overflow-hidden transition-all bg-white ${
            loading ? 'opacity-60 pointer-events-none' : ''
          } border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent`}
        >
          {/* TipTap Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
            {/* Undo / Redo */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={loading || !editor?.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <FaUndo size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={loading || !editor?.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <FaRedo size={11} />
            </ToolbarButton>

            <div className="w-[1px] h-4 bg-gray-300 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor?.isActive('heading', { level: 1 })}
              disabled={loading}
              title="Heading 1"
            >
              <span className="font-bold text-xs">H1</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor?.isActive('heading', { level: 2 })}
              disabled={loading}
              title="Heading 2"
            >
              <span className="font-bold text-xs">H2</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor?.isActive('heading', { level: 3 })}
              disabled={loading}
              title="Heading 3"
            >
              <span className="font-bold text-xs">H3</span>
            </ToolbarButton>

            <div className="w-[1px] h-4 bg-gray-300 mx-1" />

            {/* Basic Formatting */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive('bold')}
              disabled={loading}
              title="Bold (Ctrl+B)"
            >
              <FaBold size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive('italic')}
              disabled={loading}
              title="Italic (Ctrl+I)"
            >
              <FaItalic size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              isActive={editor?.isActive('underline')}
              disabled={loading}
              title="Underline (Ctrl+U)"
            >
              <FaUnderline size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              isActive={editor?.isActive('strike')}
              disabled={loading}
              title="Strikethrough"
            >
              <FaStrikethrough size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCode().run()}
              isActive={editor?.isActive('code')}
              disabled={loading}
              title="Inline Code"
            >
              <FaCode size={11} />
            </ToolbarButton>

            <div className="w-[1px] h-4 bg-gray-300 mx-1" />

            {/* Lists & Quotes */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive('bulletList')}
              disabled={loading}
              title="Bullet List"
            >
              <FaListUl size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive('orderedList')}
              disabled={loading}
              title="Numbered List"
            >
              <FaListOl size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive('blockquote')}
              disabled={loading}
              title="Blockquote"
            >
              <FaQuoteLeft size={11} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              disabled={loading}
              title="Horizontal Line"
            >
              <FaMinus size={11} />
            </ToolbarButton>

            <div className="w-[1px] h-4 bg-gray-300 mx-1" />

            {/* Clear Formatting */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
              disabled={loading}
              title="Clear Formatting"
            >
              <FaEraser size={11} />
            </ToolbarButton>
          </div>

          {/* Editor Area */}
          <EditorContent editor={editor} />
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Format workout instructions with headings, bullet points, numbered steps, and emphasis.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : (editData ? 'Update Syllabus' : 'Add Syllabus')}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default SyllabusForm;
