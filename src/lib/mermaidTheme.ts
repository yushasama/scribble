import { type Theme } from './themes'

type RGB = { r: number; g: number; b: number }

export type MermaidTheme = {
  border: string
  labelBackground: string
  line: string
  variables: Record<string, string>
}

export function createMermaidTheme(theme: Theme): MermaidTheme {
  const background = normalizeHex(theme.background, '#ffffff')
  const suppliedText = normalizeHex(theme.text, '#111827')
  const text = ensureContrast(suppliedText, background, 7)
  const surface = mix(background, text, isDark(background) ? 0.13 : 0.07)
  const surfaceStrong = mix(background, theme.accent, isDark(background) ? 0.22 : 0.12)
  const nodeText = ensureContrast(text, surface, 7)
  const line = ensureContrast(normalizeHex(theme.accent, text), background, 3)
  const border = ensureContrast(normalizeHex(theme.border, line), background, 3)
  const labelBackground = mix(background, text, isDark(background) ? 0.08 : 0.04)

  return {
    border,
    labelBackground,
    line,
    variables: {
      background,
      primaryColor: surface,
      primaryTextColor: nodeText,
      primaryBorderColor: line,
      secondaryColor: surfaceStrong,
      secondaryTextColor: ensureContrast(text, surfaceStrong, 7),
      secondaryBorderColor: border,
      tertiaryColor: labelBackground,
      tertiaryTextColor: ensureContrast(text, labelBackground, 7),
      tertiaryBorderColor: border,
      mainBkg: surface,
      secondBkg: surfaceStrong,
      nodeBorder: line,
      nodeTextColor: nodeText,
      lineColor: line,
      textColor: text,
      titleColor: text,
      edgeLabelBackground: labelBackground,
      clusterBkg: labelBackground,
      clusterBorder: border,
      actorBkg: surface,
      actorBorder: line,
      actorTextColor: nodeText,
      actorLineColor: line,
      signalColor: line,
      signalTextColor: text,
      labelBoxBkgColor: labelBackground,
      labelBoxBorderColor: border,
      labelTextColor: text,
      loopTextColor: text,
      noteBkgColor: surfaceStrong,
      noteBorderColor: border,
      noteTextColor: ensureContrast(text, surfaceStrong, 7),
      activationBkgColor: surfaceStrong,
      activationBorderColor: line,
      sectionBkgColor: surface,
      altSectionBkgColor: labelBackground,
      gridColor: border,
      taskBkgColor: surface,
      taskBorderColor: line,
      taskTextColor: nodeText,
      activeTaskBkgColor: surfaceStrong,
      activeTaskBorderColor: line,
      doneTaskBkgColor: labelBackground,
      doneTaskBorderColor: border,
      critBkgColor: surfaceStrong,
      critBorderColor: line,
      todayLineColor: line,
    },
  }
}

function ensureContrast(candidate: string, background: string, minimumRatio: number): string {
  if (contrastRatio(candidate, background) >= minimumRatio) return candidate
  const black = '#000000'
  const white = '#ffffff'
  return contrastRatio(black, background) >= contrastRatio(white, background) ? black : white
}

function contrastRatio(left: string, right: string): number {
  const lighter = Math.max(luminance(left), luminance(right))
  const darker = Math.min(luminance(left), luminance(right))
  return (lighter + 0.05) / (darker + 0.05)
}

function luminance(color: string): number {
  const { r, g, b } = hexToRGB(color)
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function mix(left: string, right: string, rightWeight: number): string {
  const a = hexToRGB(normalizeHex(left, '#ffffff'))
  const b = hexToRGB(normalizeHex(right, '#000000'))
  return rgbToHex({ r: Math.round(a.r + (b.r - a.r) * rightWeight), g: Math.round(a.g + (b.g - a.g) * rightWeight), b: Math.round(a.b + (b.b - a.b) * rightWeight) })
}

function isDark(color: string): boolean {
  return luminance(color) < 0.18
}

function normalizeHex(color: string, fallback: string): string {
  const value = color.trim()
  if (/^#[\da-f]{6}$/i.test(value)) return value.toLowerCase()
  if (/^#[\da-f]{3}$/i.test(value)) return `#${value.slice(1).split('').map((digit) => digit + digit).join('')}`.toLowerCase()
  return fallback
}

function hexToRGB(color: string): RGB {
  const value = normalizeHex(color, '#000000').slice(1)
  return { r: Number.parseInt(value.slice(0, 2), 16), g: Number.parseInt(value.slice(2, 4), 16), b: Number.parseInt(value.slice(4, 6), 16) }
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}
