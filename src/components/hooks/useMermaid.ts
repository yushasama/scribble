import { useEffect } from 'react'

export type MermaidInitializeConfig = {
  startOnLoad?: boolean
  securityLevel?: 'loose' | 'strict' | 'antiscript' | 'sandbox'
  theme?: string
  themeCSS?: string
  themeVariables?: Record<string, string>
  flowchart?: {
    htmlLabels?: boolean
    useMaxWidth?: boolean
    nodeSpacing?: number
    rankSpacing?: number
    curve?: string
    padding?: number
    diagramPadding?: number
    titleTopMargin?: number
  }
}

export type MermaidApi = {
  initialize: (config: MermaidInitializeConfig) => void
  render: (id: string, code: string) => Promise<{ svg: string }>
}

declare global {
  interface Window {
    mermaid?: MermaidApi
  }
}

export function useMermaid(containerRef: React.RefObject<HTMLElement | null>, code: string) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Wait for Mermaid to be available (script loads async in PreviewShell)
    let cancelled = false
    const waitForMermaid = async (): Promise<MermaidApi | null> => {
      const start = Date.now()
      while (!cancelled && !window.mermaid && Date.now() - start < 5000) {
        await new Promise(r => setTimeout(r, 100))
      }
      const available = window.mermaid || null
      return available
    }

    const run = async () => {
      const mermaid = await waitForMermaid()
      if (cancelled || !mermaid) {
        if (container) container.innerHTML = '<pre class="mermaid-error">Mermaid not loaded.</pre>'
        return
      }

      // Initialize defaults to prefer compact diagrams and wrapped labels.
      // Per-diagram %%{init: ... }%% can still override these values.
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        flowchart: {
          htmlLabels: true,
          useMaxWidth: true,
          nodeSpacing: 28,
          rankSpacing: 32,
          curve: 'basis',
          padding: 8,
          diagramPadding: 8,
          // Keep title out of the graph area
          titleTopMargin: 24,
        },
        themeCSS: `
          /* Title stays on one line with space above graph */
          .flowchartTitleText { white-space: nowrap; }

          /* Hide empty edge-label backgrounds that show up as black boxes */
          .edgeLabel, .edgeLabel rect { fill: transparent !important; stroke: none !important; opacity: 0 !important; }

          /* Allow labels to wrap nicely when using htmlLabels */
          .label foreignObject, .edgeLabel foreignObject { width: auto; }
          .label foreignObject span, .edgeLabel foreignObject span {
            display: inline-block; white-space: normal !important; overflow-wrap: break-word; word-break: normal; hyphens: auto; text-align: center; line-height: 1.25; min-width: 12ch; max-width: 34ch;
          }
          .nodeLabel, .edgeLabel { white-space: normal !important; }
        `,
      })

      // Use a Unicode-safe unique id (avoid btoa on non‑Latin1)
      const uniqueId = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
        ? (globalThis.crypto as unknown as { randomUUID: () => string }).randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
      const id = 'm-' + uniqueId.slice(0, 8)

      // Only clear if content actually changed to avoid flicker
      if (container.innerHTML.trim().length === 0) {
        container.innerHTML = ''
      }
      try {
        // Validate before render to surface syntax errors clearly
        try {
          const api = mermaid as unknown as { parse?: (s: string) => void; mermaidAPI?: { parse?: (s: string) => void } }
          const maybeParse = api.parse || api.mermaidAPI?.parse
          if (typeof maybeParse === 'function') {
            maybeParse(code)
          }
        } catch (parseError) {
          const message = String((parseError as Error)?.message || parseError)
          container.innerHTML = `<pre class="mermaid-error">Mermaid syntax error:\n${message}</pre>`
          console.error('[Mermaid] Syntax error:', message)
          return
        }

        const result = await mermaid.render(id, code)
        container.innerHTML = result.svg || ''
        container.classList.add('mermaid-rendered')
      } catch {
        container.innerHTML = `<pre class="mermaid-error">Failed to render Mermaid diagram.</pre>`
      }
    }
    run()

    return () => { cancelled = true }
  }, [containerRef, code])
}

export default useMermaid
