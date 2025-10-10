import React, { useRef } from 'react'
import { useMathJax } from '../hooks/useMathJax'

interface MathRendererProps {
  html: string
}

export const MathRenderer = React.memo(({ html }: MathRendererProps) => {
  const ref = useRef<HTMLDivElement>(null)
  
  useMathJax(ref.current)
  
  return (
    <div 
      ref={ref} 
      className="math-block"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
