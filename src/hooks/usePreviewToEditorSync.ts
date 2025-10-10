/**
 * Preview to Editor Sync Hook
 * Handles clicking on preview elements to scroll to corresponding editor lines
 */

import { useEffect, useCallback } from 'react';
import type { EditorView } from '@codemirror/view';

interface PreviewToEditorSyncOptions {
  previewRef: React.RefObject<HTMLDivElement>;
  editorRef: React.RefObject<EditorView | null>;
}

export function usePreviewToEditorSync({
  previewRef,
  editorRef
}: PreviewToEditorSyncOptions) {
  
  const handlePreviewClick = useCallback((e: MouseEvent) => {
    console.log('Click detected on:', e.target);
    
    if (!editorRef.current) {
      console.log('No editor ref');
      return;
    }

    // Find the nearest element with data-pos-start
    const target = (e.target as HTMLElement)?.closest('[data-pos-start]');
    console.log('Found target with data-pos-start:', target);
    
    if (!target) {
      console.log('No element with data-pos-start found');
      return;
    }

    const startLine = parseInt(target.getAttribute('data-pos-start') || '', 10);
    console.log('Parsed start line:', startLine);
    
    if (!Number.isFinite(startLine) || startLine < 1) {
      console.log('Invalid start line:', startLine);
      return;
    }

    console.log('Preview clicked:', {
      element: target.tagName,
      startLine,
      textContent: target.textContent?.substring(0, 50) + '...'
    });

    const view = editorRef.current;
    const line = Math.max(1, startLine);
    
    try {
      const lineInfo = view.state.doc.line(line);
      
      // Scroll the editor to that line and focus it
      view.dispatch({
        selection: { anchor: lineInfo.from, head: lineInfo.from },
        scrollIntoView: true,
      });
      
      // Focus the editor
      view.focus();
      
      console.log('Scrolled editor to line:', line);
    } catch (error) {
      console.warn('Failed to scroll to line:', line, error);
    }
  }, [editorRef]);

  // Setup click listener
  useEffect(() => {
    if (!previewRef.current) {
      console.log('No preview ref available');
      return;
    }

    const previewElement = previewRef.current;
    console.log('Adding click listener to preview element');
    previewElement.addEventListener('click', handlePreviewClick);
    
    return () => {
      console.log('Removing click listener from preview element');
      previewElement.removeEventListener('click', handlePreviewClick);
    };
  }, [previewRef, handlePreviewClick]);
}
