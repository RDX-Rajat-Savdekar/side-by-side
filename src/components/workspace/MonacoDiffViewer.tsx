import React, { useEffect, useRef } from 'react';
import { DiffEditor, Editor, useMonaco } from '@monaco-editor/react';
import { DiffViewMode } from '../../types/lesson';

interface MonacoDiffViewerProps {
  beforeCode: string;
  afterCode: string;
  language: string;
  diffViewMode: DiffViewMode;
  targetLine?: number | null;
}

export const MonacoDiffViewer: React.FC<MonacoDiffViewerProps> = ({
  beforeCode,
  afterCode,
  language,
  diffViewMode,
  targetLine,
}) => {
  const monaco = useMonaco();
  const diffEditorRef = useRef<any>(null);
  const singleEditorRef = useRef<any>(null);

  // Define custom dark theme when monaco mounts
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('evolution-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'ff7b72' },
          { token: 'string', foreground: 'a5d6ff' },
          { token: 'number', foreground: '79c0ff' },
          { token: 'type', foreground: 'ffa657' },
          { token: 'identifier', foreground: 'e6edf3' },
          { token: 'delimiter', foreground: '8b949e' },
        ],
        colors: {
          'editor.background': '#0d1117',
          'editor.foreground': '#e6edf3',
          'editorLineNumber.foreground': '#6e768166',
          'editorLineNumber.activeForeground': '#e6edf3',
          'editor.lineHighlightBackground': '#161b2280',
          'editor.selectionBackground': '#264f7844',
          'diffEditor.insertedTextBackground': '#2ea04322',
          'diffEditor.removedTextBackground': '#f8514922',
          'diffEditor.insertedLineBackground': '#2ea04315',
          'diffEditor.removedLineBackground': '#f8514915',
          'editorOverviewRuler.addedForeground': '#3fb95060',
          'editorOverviewRuler.deletedForeground': '#f8514960',
          'scrollbarSlider.background': '#8b949e20',
          'scrollbarSlider.hoverBackground': '#8b949e35',
        }
      });
      monaco.editor.setTheme('evolution-dark');
    }
  }, [monaco]);

  // Handle jump to target line number
  useEffect(() => {
    if (!targetLine) return;

    if (diffViewMode === 'single' && singleEditorRef.current) {
      singleEditorRef.current.revealLineInCenter(targetLine);
      singleEditorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
    } else if (diffEditorRef.current) {
      const modifiedEditor = diffEditorRef.current.getModifiedEditor();
      if (modifiedEditor) {
        modifiedEditor.revealLineInCenter(targetLine);
        modifiedEditor.setPosition({ lineNumber: targetLine, column: 1 });
      }
    }
  }, [targetLine, diffViewMode]);

  const handleDiffMount = (editor: any) => {
    diffEditorRef.current = editor;
  };

  const handleSingleMount = (editor: any) => {
    singleEditorRef.current = editor;
  };

  const commonOptions = {
    readOnly: true,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on' as const,
    folding: true,
    renderWhitespace: 'none' as const,
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    padding: { top: 12, bottom: 20 },
  };

  if (diffViewMode === 'single') {
    return (
      <div className="diff-editor-wrapper">
        <Editor
          height="100%"
          language={language || 'python'}
          value={afterCode}
          theme="evolution-dark"
          options={commonOptions}
          onMount={handleSingleMount}
        />
      </div>
    );
  }

  return (
    <div className="diff-editor-wrapper">
      <DiffEditor
        height="100%"
        original={beforeCode}
        modified={afterCode}
        language={language || 'python'}
        theme="evolution-dark"
        options={{
          ...commonOptions,
          renderSideBySide: diffViewMode === 'split',
          enableSplitViewResizing: true,
          ignoreTrimWhitespace: false,
        }}
        onMount={handleDiffMount}
      />
    </div>
  );
};
