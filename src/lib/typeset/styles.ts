import type { CSSProperties } from 'react'
import type { Theme } from '../themes'
import type { DocumentPresentation } from './settings'

export interface TypesetTheme {
  id: string
  name: string
  typography: { fontFamily: string; fontSize: string; lineHeight: number; contentWidth: string; indent: string; paragraphGap: string }
  sectionGap: string
  sectionDenoter: 'none' | 'dash'
}

export const editorial: TypesetTheme = { id: 'editorial', name: 'Editorial', typography: { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '16px', lineHeight: 1.7, contentWidth: '44rem', indent: '1.45em', paragraphGap: '.35em' }, sectionGap: '2.8em', sectionDenoter: 'dash' }

export function createTypesetVariables(presentation: DocumentPresentation, colorTheme: Theme): CSSProperties {
  const rgb = colorTheme.background.replace('#', '')
  const light = rgb.length === 6 && (.299 * parseInt(rgb.slice(0, 2), 16) + .587 * parseInt(rgb.slice(2, 4), 16) + .114 * parseInt(rgb.slice(4, 6), 16)) > 150
  return { '--typeset-denoter-display': editorial.sectionDenoter === 'dash' ? 'inline-block' : 'none', '--typeset-font': editorial.typography.fontFamily, '--typeset-size': editorial.typography.fontSize, '--typeset-leading': editorial.typography.lineHeight, '--typeset-width': editorial.typography.contentWidth, '--typeset-indent': presentation.paragraphs === 'indented' ? editorial.typography.indent : '0', '--typeset-paragraph-gap': presentation.paragraphs === 'indented' ? editorial.typography.paragraphGap : '1em', '--typeset-section-gap': editorial.sectionGap, '--typeset-link': light ? '#0969da' : '#65b5ff', '--typeset-background-opacity': presentation.background.opacity, '--typeset-background-dimming': presentation.background.dimming, '--typeset-background-fit': presentation.background.fit, '--typeset-background-position': presentation.background.position } as CSSProperties
}
