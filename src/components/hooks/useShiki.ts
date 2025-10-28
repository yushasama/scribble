import { useShiki as useWorkerShiki } from '../../shiki/useShiki'

function normalizeLanguage(language: string): string {
  const lower = (language || '').toLowerCase()
  if (lower === 'vhd') return 'vhdl'
  return lower
}

export function useShiki(code: string, language: string, theme: string): string | null {
  const normalizedLanguage = normalizeLanguage(language)
  const { html } = useWorkerShiki(code, normalizedLanguage, theme)
  return html || null
}
