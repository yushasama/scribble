import React, { useRef } from 'react'
import useMermaid from '../hooks/useMermaid'
import { type Theme } from '../../lib/themes'

interface MermaidRendererProps {
  code: string
  theme: Theme
}

export const MermaidRenderer = React.memo(({ code, theme }: MermaidRendererProps) => {
  const ref = useRef<HTMLDivElement>(null)
  useMermaid(ref, code, theme)
  
  return (
    <div 
      ref={ref} 
      className="mermaid-block"
    />
  )
})
