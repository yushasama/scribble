import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useShiki } from '../hooks/useShiki'
import { type Theme } from '../../lib/themes'
import { getThemeByShikiName } from '../../lib/themes'

interface CodeRendererProps {
  code: string
  language: string
  theme: Theme
  codeTheme: string
}

const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const CodeRenderer = React.memo(({ code, language, theme: _theme, codeTheme }: CodeRendererProps) => {
  const html = useShiki(code, language, codeTheme)
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<number | null>(null)
  const accent = getThemeByShikiName(codeTheme)?.accent ?? '#7aa2f7'
  void _theme

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Clipboard copy failed:', error)
    }
  }, [code])

  const safeHtml = html && html.length > 0 ? html : `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`

  return (
    <figure className="code-container" style={{ '--accent': accent } as React.CSSProperties}>
      <figcaption className="code-toolbar">
        <span className="code-language">{language === 'plaintext' ? 'text' : language}</span>
        <button className="copy-btn" type="button" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy code'} aria-label={copied ? 'Code copied' : 'Copy code'}>
          {copied ? (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </figcaption>
      <div className="shiki-block" dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </figure>
  )
})
