import React, { useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'
import type { Node } from 'unist'
import { MermaidRenderer } from './MermaidRenderer'
import { CodeRenderer } from './CodeRenderer'
import { type Theme } from '../../lib/themes'
import remarkSourceMap from '../../utils/remarkSourceMap'
import imageSizeShorthand from '../../lib/plugins/imageSizeShorthand'

interface MarkdownRendererProps {
  content: string
  theme: Theme
  codeTheme?: string
}

export const MarkdownRenderer = React.memo(({ content, theme, codeTheme }: MarkdownRendererProps) => {
  const remarkPlugins = useMemo(() => (
    [
      remarkSourceMap as unknown as never,
      imageSizeShorthand as unknown as never,
      remarkGfm as unknown as never,
      [remarkMath, { singleDollarTextMath: true }] as unknown as never,
    ]
  ), [])

  const rehypePlugins = useMemo(() => (
    [
      [rehypeKatex, {
        strict: false,
        output: 'html',
        KaTeX: undefined,
        macros: { '\\RR': '\\mathbb{R}', '\\NN': '\\mathbb{N}' },
      }] as unknown as never,
      (() => (tree: Node) => {
        visit(tree, (node) => {
          const n = node as { type?: string; data?: { hProperties?: Record<string, unknown> }; properties?: Record<string, unknown> }
          if (n.type === 'element' && n.data?.hProperties) {
            n.properties = { ...n.properties, ...n.data.hProperties }
          }
        })
      }) as unknown as never,
    ]
  ), [])

  const Code = useCallback((props: unknown) => {
    const { inline, className, children, ...rest } = props as { inline?: boolean; className?: string; children?: React.ReactNode } & Record<string, unknown>
    const cls = className || ''
    const dataLang = (rest && typeof rest === 'object' ? (rest as Record<string, unknown>)['data-language'] : undefined) as string | undefined
    const language = /language-([\w-]+)/.exec(cls)?.[1]
      || /lang-([\w-]+)/.exec(cls)?.[1]
      || (dataLang || 'plaintext')
    const codeText = String(children || '').trim()

    if (inline || !className) {
      const isPureMath = typeof children === 'string' && /\$(.|\n)*\$/.test(String(children))
      if (isPureMath) return <span>{children}</span>
      return <code className={className} {...rest}>{children}</code>
    }

    if (language === 'mermaid') {
      return <MermaidRenderer code={codeText} />
    }

    return <CodeRenderer code={codeText} language={language} theme={theme} codeTheme={codeTheme || 'github-dark'} />
  }, [theme, codeTheme])

  const Pre = useCallback(({ children, ...props }: { children?: React.ReactNode }) => {
    if (React.isValidElement(children)) return children
    return <pre {...props}>{children}</pre>
  }, [])

  const components = useMemo(() => ({ code: Code, pre: Pre }), [Code, Pre])

  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
      {content}
    </ReactMarkdown>
  )
})
