import { useEffect } from 'react'

export function useMathJax(container: HTMLElement | null) {
  useEffect(() => {
    const maybeWin = window as unknown as { MathJax?: { typesetPromise: (els: HTMLElement[]) => Promise<void> } }
    if (!container || typeof window === 'undefined' || !maybeWin || !maybeWin.MathJax) return

    const typesetMath = async () => {
      try {
        // Guard again for TS
        const api = maybeWin.MathJax as { typesetPromise: (els: HTMLElement[]) => Promise<void> }
        await api.typesetPromise([container])
      } catch (error: unknown) {
        if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
          console.warn('MathJax typesetting failed:', error)
        }
      }
    }

    typesetMath()
  }, [container])
}
