export interface DocumentPresentation {
  style: 'classic' | 'editorial'
  paragraphs: 'indented' | 'block'
  background: { image: string; opacity: number; dimming: number; fit: 'cover' | 'contain'; position: 'center' | 'top' | 'bottom' }
}

export const defaultPresentation: DocumentPresentation = { style: 'classic', paragraphs: 'indented', background: { image: '', opacity: .15, dimming: .2, fit: 'cover', position: 'center' } }

export function validBackgroundImage(value: unknown): string {
  if (typeof value !== 'string') return ''
  if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) return value
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '' } catch { return '' }
}

export function parsePresentation(value: unknown): DocumentPresentation {
  if (!value || typeof value !== 'object') return defaultPresentation
  const input = value as Record<string, unknown>
  const bg = input.background && typeof input.background === 'object' ? input.background as Record<string, unknown> : {}
  const unit = (value: unknown, fallback: number): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback
  return { style: input.style === 'editorial' ? 'editorial' : 'classic', paragraphs: input.paragraphs === 'block' ? 'block' : 'indented', background: { image: validBackgroundImage(bg.image), opacity: unit(bg.opacity, .15), dimming: unit(bg.dimming, .2), fit: bg.fit === 'contain' ? 'contain' : 'cover', position: bg.position === 'top' || bg.position === 'bottom' ? bg.position : 'center' } }
}
