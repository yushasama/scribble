import React, { useRef } from 'react'
import useMermaid from '../hooks/useMermaid'

interface MermaidRendererProps {
  code: string
}

export const MermaidRenderer = React.memo(({ code }: MermaidRendererProps) => {
  const ref = useRef<HTMLDivElement>(null)
  useMermaid(ref, code)
  
  return (
    <div 
      ref={ref} 
      className="mermaid-block"
    />
  )
})
