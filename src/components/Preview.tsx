import React from 'react';
import { PreviewShell } from './PreviewShell';
import type { EditorView } from '@codemirror/view';

interface PreviewProps {
  content: string;
  theme: string;
  codeTheme: string;
  editorRef?: React.RefObject<EditorView | null>;
  onEditorChangeHandlerChange?: (handler: (() => void) | null) => void;
}

export const Preview: React.FC<PreviewProps> = ({ content, theme, codeTheme, editorRef, onEditorChangeHandlerChange }) => {
  return (
    <PreviewShell
      content={content}
      theme={theme}
      codeTheme={codeTheme}
      editorRef={editorRef}
      onEditorChangeHandlerChange={onEditorChangeHandlerChange}
    />
  )
}