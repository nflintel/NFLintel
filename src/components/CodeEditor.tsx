import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Undo2, Redo2 } from 'lucide-react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
}

export interface CodeEditorHandle {
  undo: () => void;
  redo: () => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(({ language, value, onChange, theme = 'dark', readOnly = false }, ref) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define a custom dark theme
    monaco.editor.defineTheme('deepsite-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'f8f8f2' },
        { token: 'string', foreground: '10b981' }, // emerald-500
        { token: 'number', foreground: 'bd93f9' },
        { token: 'operator', foreground: 'ffffff' },
        { token: 'type', foreground: '8be9fd' },
        { token: 'function', foreground: '10b981' },
        { token: 'tag', foreground: '10b981', fontStyle: 'bold' },
        { token: 'attribute.name', foreground: 'ffffff' },
        { token: 'attribute.value', foreground: '10b981' },
        { token: 'property', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'attribute.value.unit', foreground: 'bd93f9' },
        { token: 'attribute.value.number', foreground: 'bd93f9' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#333333',
        'editorLineNumber.activeForeground': '#ffffff',
        'editor.selectionBackground': '#222222',
        'editor.inactiveSelectionBackground': '#111111',
        'editorCursor.foreground': '#10b981',
        'editor.lineHighlightBackground': '#0a0a0a',
        'editorBracketMatch.background': '#222222',
        'editorBracketMatch.border': '#10b981',
      }
    });

    // Define a custom light theme
    monaco.editor.defineTheme('deepsite-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
        { token: 'keyword', foreground: '000000', fontStyle: 'bold' },
        { token: 'identifier', foreground: '0f172a' },
        { token: 'string', foreground: '059669' }, // emerald-600
        { token: 'number', foreground: '7c3aed' },
        { token: 'operator', foreground: '000000' },
        { token: 'type', foreground: '0ea5e9' },
        { token: 'function', foreground: '059669' },
        { token: 'tag', foreground: '059669', fontStyle: 'bold' },
        { token: 'attribute.name', foreground: '000000' },
        { token: 'attribute.value', foreground: '059669' },
        { token: 'property', foreground: '000000', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorLineNumber.foreground': '#cbd5e1',
        'editorLineNumber.activeForeground': '#000000',
        'editor.selectionBackground': '#f1f5f9',
        'editor.inactiveSelectionBackground': '#f8fafc',
        'editorCursor.foreground': '#059669',
        'editor.lineHighlightBackground': '#f8fafc',
        'editorBracketMatch.background': '#f1f5f9',
        'editorBracketMatch.border': '#059669',
      }
    });

    monaco.editor.setTheme(theme === 'dark' ? 'deepsite-dark' : 'deepsite-light');
  };

  useImperativeHandle(ref, () => ({
    undo: () => {
      if (editorRef.current) {
        editorRef.current.trigger('keyboard', 'undo', null);
      }
    },
    redo: () => {
      if (editorRef.current) {
        editorRef.current.trigger('keyboard', 'redo', null);
      }
    }
  }));

  return (
    <div className="h-full w-full overflow-hidden relative">
      {!readOnly && (
        <div className="absolute top-4 right-6 z-10 flex gap-2">
          <button
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.trigger('keyboard', 'undo', null);
              }
            }}
            className="p-2 bg-black dark:bg-zinc-900/50 hover:bg-slate-700/50 text-slate-400 hover:text-emerald-500 border-2 border-black dark:border-white backdrop-blur-sm transition-all"
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.trigger('keyboard', 'redo', null);
              }
            }}
            className="p-2 bg-black dark:bg-zinc-900/50 hover:bg-slate-700/50 text-slate-400 hover:text-emerald-500 border-2 border-black dark:border-white backdrop-blur-sm transition-all"
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>
      )}
      <Editor
        height="100%"
        language={language}
        theme={theme === 'dark' ? 'deepsite-dark' : 'deepsite-light'}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
});
