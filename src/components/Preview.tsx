import React from 'react';
import type { DocumentPresentation } from '../lib/typeset/settings';
import { PreviewShell } from './PreviewShell';
import type { EditorView } from '@codemirror/view';

interface PreviewProps {
  presentation?: DocumentPresentation;
  content: string;
  theme: string;
  codeTheme: string;
  editorRef?: React.RefObject<EditorView | null>;
  onEditorChangeHandlerChange?: (handler: (() => void) | null) => void;
}

export const Preview: React.FC<PreviewProps> = ({ presentation, content, theme, codeTheme, editorRef, onEditorChangeHandlerChange }) => {
  return (
    <PreviewShell
      presentation={presentation}
      content={content}
      theme={theme}
      codeTheme={codeTheme}
      editorRef={editorRef}
      onEditorChangeHandlerChange={onEditorChangeHandlerChange}
    />
  )
}