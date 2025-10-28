import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useShiki } from '../hooks/useShiki'
import { type Theme } from '../../lib/themes'
import { getThemeByShikiName } from '../../lib/themes'

interface CodeRendererProps {
  code: string
  language: string
  theme: Theme
  codeTheme: string
}

export const CodeRenderer = React.memo(
  ({ code, language, theme: _theme, codeTheme }: CodeRendererProps) => {
    const html = useShiki(code, language, codeTheme)
    const [copied, setCopied] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const accent = getThemeByShikiName(codeTheme)?.accent ?? '#7aa2f7'
    void _theme

    console.log('codeTheme:', codeTheme)  // 👈 ADD THIS
    console.log('accent:', accent)         // 👈 AND THIS
    

    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 768)
      check()
      window.addEventListener('resize', check)
      return () => window.removeEventListener('resize', check)
    }, [])

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      } catch (err) {
        console.error('Clipboard copy failed:', err)
      }
    }, [code])

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const safeHtml =
      html && html.length > 0
        ? html
        : `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`

    const [scrollLockActive, setScrollLockActive] = useState(false)

    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLDivElement>) => {
        if (isMobile) return
        const pre = e.currentTarget.querySelector('pre.shiki') as HTMLElement | null
        if (!pre) return
        const hasHorizontalOverflow = pre.scrollWidth > pre.clientWidth
        if (!scrollLockActive || !hasHorizontalOverflow) return
        e.preventDefault()
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        pre.scrollTo({ left: pre.scrollLeft + delta, behavior: 'smooth' })
      },
      [isMobile, scrollLockActive]
    )

    const handleClick = useCallback(() => {
      if (isMobile) return
      const pre = containerRef.current?.querySelector('pre.shiki') as HTMLElement | null
      if (!pre) return
      const hasHorizontalOverflow = pre.scrollWidth > pre.clientWidth
      setScrollLockActive(hasHorizontalOverflow)
    }, [isMobile])

    return (
        <div
          ref={containerRef}
          className="code-container"
          style={{ 
            position: 'relative', 
            '--accent': accent 
          } as React.CSSProperties}
          onWheel={handleWheel}
          onClick={handleClick}
        >
        <div
          className="shiki-block"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        <button
          className="copy-btn"
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy'}
          aria-label="Copy code"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    )
  }
)
