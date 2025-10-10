import React, { useCallback, useState } from 'react'
import { useShiki } from '../hooks/useShiki'
import { type Theme } from '../../lib/themes'
import { getThemeByShikiName } from '../../lib/themes'

interface CodeRendererProps {
  code: string
  language: string
  theme: Theme
  codeTheme: string
}

export const CodeRenderer = React.memo(({ code, language, theme, codeTheme }: CodeRendererProps) => {
  const html = useShiki(code, language, codeTheme)
  const [copied, setCopied] = useState(false)
  const accent = getThemeByShikiName(codeTheme)?.accent || theme.accent

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
    }
  }, [code])

  const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const safeHtml = html && html.length > 0
    ? html
    : `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`

  return (
    <div className="code-container" style={{ position: 'relative' }}>
      <div className="shiki-block" dangerouslySetInnerHTML={{ __html: safeHtml }} />
      <button
        className="copy-btn"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy'}
        aria-label="Copy code"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  )
})
