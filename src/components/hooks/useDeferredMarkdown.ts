import { useState, useEffect, useRef } from 'react'

type UnknownAst = unknown
interface MarkdownWorkerMessage {
  success: boolean
  ast?: UnknownAst
  content?: string
  theme?: string
  error?: string
}

export function useDeferredMarkdown(content: string, theme: string) {
  const [ast, setAst] = useState<UnknownAst>(null)
  const [isLoading, setIsLoading] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const lastContentRef = useRef<string>('')
  
  useEffect(() => {
    // Only parse if content actually changed
    if (content === lastContentRef.current) return
    
    lastContentRef.current = content
    setIsLoading(true)
    
    // Create worker for this parse
    const worker = new Worker(new URL('../../workers/markdownParser.ts', import.meta.url))
    workerRef.current = worker
    
    worker.onmessage = (e: MessageEvent<MarkdownWorkerMessage>) => {
      const { success, ast: parsedAst, error } = e.data
      
      if (success && parsedAst) {
        setAst(parsedAst)
      } else if (error) {
        // Silently ignore in production; log in dev if available
        if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
          console.warn('Markdown parsing failed:', error)
        }
      }
      
      setIsLoading(false)
      worker.terminate()
      workerRef.current = null
    }
    
    worker.postMessage({ content, theme })
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [content, theme])
  
  return { ast, isLoading }
}
