import { useShiki as useWorkerShiki } from '../../shiki/useShiki'

export function useShiki(code: string, language: string, theme: string): string | null {
  const { html } = useWorkerShiki(code, language, theme)
  return html || null
}
