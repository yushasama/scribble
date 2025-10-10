import React, { useEffect, useRef, useState } from 'react'
import { useDeferredValue } from 'react'
import { themes, type Theme } from '../lib/themes'
import { MarkdownRenderer } from './renderers/MarkdownRenderer'
import { useSourceMapSync } from '../hooks/useSourceMapSync'
import { usePreviewToEditorSync } from '../hooks/usePreviewToEditorSync'
import type { EditorView } from '@codemirror/view'

export interface PreviewShellProps {
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
    <div
      ref={previewRef}
      className="preview-wrapper"
      style={{
        '--theme-bg': currentTheme.background,
        '--theme-text': currentTheme.text,
        '--code-bg': currentTheme.codeBackground,
        '--code-text': currentTheme.codeText,
        '--theme-border': currentTheme.border,
        '--theme-accent': currentTheme.accent,
      } as React.CSSProperties}
      onClick={handleEditorChange}
    >
      <MarkdownRenderer content={deferredContent} theme={currentTheme} codeTheme={codeTheme} />

      <style>{`
        .preview-wrapper {
          box-shadow: none;
          text-shadow: none;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.6;
          color: var(--theme-text);
          background: var(--theme-bg);
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .preview-wrapper h1, .preview-wrapper h2, .preview-wrapper h3, 
        .preview-wrapper h4, .preview-wrapper h5, .preview-wrapper h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
          line-height: 1.25;
          color: var(--theme-text);
        }
        
        .preview-wrapper h1 { font-size: 2em; border-bottom: 1px solid var(--theme-border); padding-bottom: 0.3em; }
        .preview-wrapper h2 { font-size: 1.5em; border-bottom: 1px solid var(--theme-border); padding-bottom: 0.3em; }
        .preview-wrapper h3 { font-size: 1.25em; }
        .preview-wrapper h4 { font-size: 1em; }
        .preview-wrapper h5 { font-size: 0.875em; }
        .preview-wrapper h6 { font-size: 0.85em; color: var(--theme-text); opacity: 0.8; }
        
        .preview-wrapper p {
          margin: 1em 0;
          color: var(--theme-text);
        }
        
        .preview-wrapper ul, .preview-wrapper ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        .preview-wrapper li {
          margin: 0.25em 0;
          color: var(--theme-text);
        }
        
        .preview-wrapper blockquote {
          margin: 1em 0;
          padding: 0 1em;
          border-left: 4px solid var(--theme-accent);
          color: var(--theme-text);
          opacity: 0.8;
        }
        
        .preview-wrapper table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        
        .preview-wrapper th, .preview-wrapper td {
          border: 1px solid var(--theme-border);
          padding: 0.5em;
          text-align: left;
        }
        
        .preview-wrapper th {
          background: var(--code-bg);
          font-weight: 600;
          color: var(--theme-text);
        }
        
        .preview-wrapper td {
          background: var(--theme-bg);
          color: var(--theme-text);
        }
        
        /* Inline code styling (avoid affecting Shiki blocks) */
        .preview-wrapper :not(pre) > code {
          background: var(--code-bg);
          color: var(--code-text);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .preview-wrapper pre:not(.shiki) {
          background: var(--code-bg);
          color: var(--code-text);
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          line-height: 1.4;
          border: 1px solid var(--theme-border);
        }
        
        .preview-wrapper pre:not(.shiki) code {
          background: none;
          padding: 0;
          border-radius: 0;
          color: inherit;
        }
        
        .preview-wrapper a {
          color: var(--theme-accent);
          text-decoration: none;
        }
        
        .preview-wrapper a:hover {
          text-decoration: underline;
        }
        
        .preview-wrapper hr {
          border: none;
          border-top: 1.5px solid var(--theme-accent);
          margin: 2em 0;
        }
        
        .preview-wrapper img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em 0;
        }

        /* Ensure KaTeX lines do not break awkwardly */
        .katex { white-space: normal; }
        .katex-display { overflow-x: auto; }
        
        .mermaid-block {
          margin: 1em 0;
          text-align: center;
          min-height: 24px;
          overflow: visible;
        }
        .mermaid-block svg { max-width: 100%; height: auto; }
        .mermaid-block .foreignObject { overflow: visible; }

        /* Keep SVG responsive */
        .mermaid-block .flowchartTitleText { white-space: nowrap; }

        /* Fallback: force readable label text if a theme hides it */
        .mermaid-block .label text,
        .mermaid-block .label span,
        .mermaid-block .nodeLabel,
        .mermaid-block .edgeLabel text {
          fill: var(--theme-text) !important;
          color: var(--theme-text) !important;
        }
        
        /* Slightly compact default text to reduce overall width */
        .mermaid-block svg text {
          font-size: 12px;
        }
        
        /* Reduce extra paddings often added around diagrams */
        .mermaid-block svg { padding: 0; }
        
        }
        
        .math-block {
          margin: 1em 0;
          text-align: center;
        }
        
        .code-block {
          margin: 1em 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid var(--theme-border);
        }
        
        /* KaTeX overflow fixes: prevent per-equation scrollbars */
        .preview-wrapper .katex,
        .preview-wrapper .katex-display,
        .preview-wrapper .katex-display > .katex,
        .preview-wrapper .katex-display .katex-html {
          overflow: visible !important;
          max-width: 100%;
        }
        .preview-wrapper .katex-display > .katex {
          white-space: normal !important;
        }
        
        /* Print styles */
        @page {
          size: A4;
          margin: 0;
        }
        
        @media print {
          html, body, .preview-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: var(--theme-bg) !important;
            color: var(--theme-text) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .preview-wrapper, .preview-wrapper * {
            background-color: inherit !important;
            color: inherit !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          pre, code, .code-block {
            background: var(--code-bg) !important;
            color: var(--code-text) !important;
            box-shadow: none !important;
            border: none !important;
            opacity: 1 !important;
            isolation: isolate;
            page-break-inside: avoid;
          }
          
          mjx-container, mjx-container * {
            fill: currentColor !important;
            stroke: currentColor !important;
            color: var(--theme-text) !important;
            opacity: 1 !important;
            filter: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          mjx-container svg {
            shape-rendering: geometricPrecision !important;
            text-rendering: geometricPrecision !important;
            image-rendering: optimizeQuality !important;
          }
          
          .mermaid-block svg {
            vector-effect: non-scaling-stroke;
            max-width: 100%;
            height: auto;
          }
          
          mjx-container, .mermaid-block, pre, code {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  )
}
