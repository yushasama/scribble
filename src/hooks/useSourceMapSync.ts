/**
 * Bidirectional Source Mapping Hook
 * Enables sync between Markdown editor and rendered preview
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { EditorSelection } from '@codemirror/state';
import { debounce } from '../lib/utils/debounce';
import type { EditorView } from '@codemirror/view';

interface SourceMapSyncOptions {
  editorRef: React.RefObject<EditorView | null>;
  previewRef: React.RefObject<HTMLDivElement>;
  throttleMs?: number;
}

interface SourceMapNode {
  element: HTMLElement;
  startLine: number;
  endLine: number;
}

export function useSourceMapSync({
  editorRef,
  previewRef,
  throttleMs = 150
}: SourceMapSyncOptions) {
  const sourceMapRef = useRef<SourceMapNode[]>([]);
  const isScrollingRef = useRef(false);
  const lastEditorLineRef = useRef<number>(0);

  // Build source map from DOM elements with data-pos attributes
  const buildSourceMap = useCallback(() => {
    if (!previewRef.current) return;

    const sourceMap: SourceMapNode[] = [];
    const elements = previewRef.current.querySelectorAll('[data-pos-start]');

    // Quiet logs for performance

    elements.forEach((element) => {
      const startLine = parseInt(element.getAttribute('data-pos-start') || '0');
      const endLine = parseInt(element.getAttribute('data-pos-end') || startLine.toString());
      
      // No per-element logs
      
      if (startLine > 0) {
        sourceMap.push({
          element: element as HTMLElement,
          startLine,
          endLine
        });
      }
    });

    // Sort by line number for efficient searching
    sourceMap.sort((a, b) => a.startLine - b.startLine);
    sourceMapRef.current = sourceMap;
    
    // Quiet logs
  }, [previewRef]);

  // Find preview element for a given line number
  const findPreviewElement = useCallback((lineNumber: number): HTMLElement | null => {
    const sourceMap = sourceMapRef.current;
    if (sourceMap.length === 0) return null;

    // Binary search for the closest element
    let left = 0;
    let right = sourceMap.length - 1;
    let closest = null;
    let closestDistance = Infinity;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const node = sourceMap[mid];

      if (lineNumber >= node.startLine && lineNumber <= node.endLine) {
        return node.element;
      }

      const distance = Math.min(
        Math.abs(lineNumber - node.startLine),
        Math.abs(lineNumber - node.endLine)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = node.element;
      }

      if (lineNumber < node.startLine) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return closest;
  }, []);

  // Get current editor line number
  const getCurrentEditorLine = useCallback((): number => {
    if (!editorRef.current) return 0;

    try {
      const view = editorRef.current;
      
      // CodeMirror 6
      if (view && view.state) {
        const selection = view.state.selection.main;
        if (selection) {
          const pos = selection.head;
          const line = view.state.doc.lineAt(pos);
          return line.number;
        }
      }
    } catch (error) {
      console.warn('Failed to get editor line:', error);
    }

    return 0;
  }, [editorRef]);

  // Scroll editor to line
  const scrollEditorToLine = useCallback((lineNumber: number) => {
    if (!editorRef.current || lineNumber <= 0) return;

    try {
      const view = editorRef.current;
      
      // CodeMirror 6
      if (view && view.state) {
        const line = view.state.doc.line(lineNumber);
        if (line) {
          view.dispatch({
            selection: EditorSelection.cursor(line.from),
            scrollIntoView: true
          });
          view.focus();
        }
      }
    } catch (error) {
      console.warn('Failed to scroll editor to line:', error);
    }
  }, [editorRef]);

  // Scroll preview to element
  const scrollPreviewToElement = useCallback((element: HTMLElement) => {
    if (!element) return;

    element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });

    // Add temporary highlight
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
    
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.transition = '';
    }, 1000);
  }, []);

  // Handle preview click
  const handlePreviewClick = useCallback((event: MouseEvent) => {
    if (isScrollingRef.current) return;

    const target = event.target as HTMLElement;
    const elementWithPos = target.closest('[data-pos-start]') as HTMLElement;
    
    // Quiet logs
    
    if (elementWithPos) {
      const startLine = parseInt(elementWithPos.getAttribute('data-pos-start') || '0');
      if (startLine > 0) {
        // Quiet logs
        isScrollingRef.current = true;
        scrollEditorToLine(startLine);
        
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);
      }
    }
  }, [scrollEditorToLine]);

  // Handle editor scroll/cursor change
  const handleEditorChange = useCallback(() => {
    if (isScrollingRef.current) return;

    const currentLine = getCurrentEditorLine();
    // Quiet logs
    
    if (currentLine === lastEditorLineRef.current) return;

    lastEditorLineRef.current = currentLine;
    const previewElement = findPreviewElement(currentLine);
    
    // Quiet logs
    
    if (previewElement) {
      isScrollingRef.current = true;
      scrollPreviewToElement(previewElement);
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);
    }
  }, [getCurrentEditorLine, findPreviewElement, scrollPreviewToElement]);

  // Debounced editor change handler
  const debouncedEditorChange = useMemo(() => debounce(handleEditorChange, throttleMs), [handleEditorChange, throttleMs]);

  // Setup event listeners
  useEffect(() => {
    if (!previewRef.current || !editorRef.current) return;

    // Build initial source map
    buildSourceMap();

    // Preview click listener
    const previewElement = previewRef.current;
    previewElement.addEventListener('click', handlePreviewClick);

    // Editor change listeners for CodeMirror 6
    const view = editorRef.current;

    if (view) {
      // We'll use a different approach - listen to the editor's update events
      // This is handled by the Editor component itself through the updateListener
    }

    return () => {
      if (previewElement) {
        previewElement.removeEventListener('click', handlePreviewClick);
      }
    };
  }, [previewRef, editorRef, buildSourceMap, handlePreviewClick, debouncedEditorChange]);

  // Rebuild source map when content changes
  useEffect(() => {
    const timeoutId = setTimeout(buildSourceMap, 100);
    return () => clearTimeout(timeoutId);
  }, [buildSourceMap]);

  return {
    handlePreviewClick,
    handleEditorChange: debouncedEditorChange,
    buildSourceMap,
    findPreviewElement,
    scrollEditorToLine,
    scrollPreviewToElement
  };
}