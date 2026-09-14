import React, { useEffect, useRef, useState } from 'react'
import { useDeferredValue } from 'react'
import { themes, type Theme } from '../lib/themes'
import { MarkdownRenderer } from './renderers/MarkdownRenderer'
import { useSourceMapSync } from '../hooks/useSourceMapSync'
import { usePreviewToEditorSync } from '../hooks/usePreviewToEditorSync'
import '../lib/typeset/document.css'
import { createTypesetVariables } from '../lib/typeset/styles'
import { defaultPresentation, type DocumentPresentation } from '../lib/typeset/settings'
import type { EditorView } from '@codemirror/view'

export interface PreviewShellProps {
  presentation?: DocumentPresentation
  content: string
  theme: string
  codeTheme: string
  editorRef?: React.RefObject<EditorView | null>
  onEditorChangeHandlerChange?: (handler: (() => void) | null) => void
}

declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (elements: HTMLElement[]) => Promise<void>
      startup?: {
        output?: {
          svg?: {
            fontCache?: string
          }
        }
      }
    }
    mermaid?: import('./hooks/useMermaid').MermaidApi
  }
}

export const PreviewShell: React.FC<PreviewShellProps> = ({ 
  content,
  presentation = defaultPresentation,
  theme, 
  codeTheme, 
  editorRef,
  onEditorChangeHandlerChange
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Use deferred content to prevent rebuilds on every keystroke
  const deferredContent = useDeferredValue(content)
  
  // Update theme when prop changes
  useEffect(() => {
    const found = themes.find(t => t.name === theme) || themes[0]
    setCurrentTheme(found)
    document.documentElement.style.setProperty('--accent-color', found.accent)
    document.documentElement.style.setProperty('--border-color', found.border)
  }, [theme])

  // Math is rendered by rehype-mathjax; no runtime MathJax script/typeset needed

  // Initialize Mermaid
  useEffect(() => {
    if (window.mermaid) return

    const mermaidScript = document.createElement('script')
    mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js'
    mermaidScript.async = true
    mermaidScript.onload = () => {
      // Optional: load ELK layout plugin (auto-registers on load)
      const elkScript = document.createElement('script')
      elkScript.src = 'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk/dist/mermaid-layout-elk.min.js'
      elkScript.async = true
      document.head.appendChild(elkScript)
    }
    document.head.appendChild(mermaidScript)

    return () => {
      document.head.removeChild(mermaidScript)
    }
  }, [])

  // Source mapping for bidirectional sync
  const { handleEditorChange } = useSourceMapSync({
    editorRef: editorRef || { current: null },
    previewRef: previewRef as React.RefObject<HTMLDivElement>,
    throttleMs: 150
  })

  // Expose debounced handler to parent when requested
  useEffect(() => {
    if (onEditorChangeHandlerChange) {
      onEditorChangeHandlerChange(() => handleEditorChange())
    }
  }, [handleEditorChange, onEditorChangeHandlerChange])

  // Preview to editor sync
  usePreviewToEditorSync({
    previewRef: previewRef as React.RefObject<HTMLDivElement>,
    editorRef: editorRef || { current: null }
  })

  return (
    <div className="preview-viewport">
    <div
      ref={previewRef}
      className="preview-wrapper"
      data-typeset={presentation.style}
      style={{
        ...createTypesetVariables(presentation, currentTheme),
        '--theme-bg': currentTheme.background,
        '--theme-text': currentTheme.text,
        '--code-bg': currentTheme.codeBackground,
        '--code-text': currentTheme.codeText,
        '--theme-border': currentTheme.border,
        '--theme-accent': currentTheme.accent,
      } as React.CSSProperties}
      onClick={handleEditorChange}
    >
      {presentation.background.image && <div className="typeset-background" aria-hidden="true"><div style={{ backgroundImage: `url("${presentation.background.image}")` }} /><span /></div>}
      <MarkdownRenderer content={deferredContent} theme={currentTheme} codeTheme={codeTheme} />


    </div>
    </div>
  )
}
