import type { Plugin } from 'unified'
import type { Root, Text, Content, Image } from 'mdast'
import type { Parent } from 'unist'

// Remark plugin to transform Obsidian-style image shorthand:
// - ![[image.png|300]] or ![[image.png|70%]] anywhere in text → mdast image node
// - ![[|300]] immediately after a standard Markdown image applies the size to that image

const RE_GLOBAL = /!\[\[([^|\]]*)(?:\|([\d.]+%?))?\]\]/g
const RE_PATHLESS = /^!\[\[(?:\|([\d.]+%?))\]\]$/
const RE_ALT_SIZE = /^\s*\[\|([\d.]+%?)\]\s*$/

const imageSizeShorthand: Plugin<[], Root> = function () {
  return function transformer(tree: Root): void {
    const walk = (node: Content | Root) => {
      if (!('type' in node)) return

      // Avoid transforming inside code blocks
      if (node.type === 'code' || node.type === 'inlineCode') return

      if ('children' in node && Array.isArray((node as unknown as Parent).children)) {
        const p = node as unknown as Parent
        for (let i = 0; i < p.children.length; i++) {
          const child = p.children[i] as Content
          if (child.type === 'text') {
            const value = (child as Text).value
            // Special case: pathless directive that sizes the immediately previous image
            const pathless = RE_PATHLESS.exec(value)
            if (pathless && p.children[i - 1] && (p.children[i - 1] as Content).type === 'image') {
              const prev = p.children[i - 1] as Image & { data?: { hProperties?: Record<string, unknown> } }
              const width = pathless[1]
              if (width) {
                if (String(width).endsWith('%')) {
                  prev.data = { ...(prev.data || {}), hProperties: { ...(prev.data?.hProperties || {}), style: `width:${width};` } }
                } else {
                  prev.data = { ...(prev.data || {}), hProperties: { ...(prev.data?.hProperties || {}), width: String(width) } }
                }
              }
              // Remove the directive node
              p.children.splice(i, 1)
              i -= 1
              continue
            }

            let match: RegExpExecArray | null
            const parts: Content[] = []

            RE_GLOBAL.lastIndex = 0
            let lastIndex = 0
            while ((match = RE_GLOBAL.exec(value)) !== null) {
              const [full, path, width] = match
              const start = match.index
              const end = start + full.length
              const before = value.slice(lastIndex, start)
              if (before) parts.push({ type: 'text', value: before } as Text)

              const url = String(path || '').trim()
              if (url) {
                const img: Image & { data?: { hProperties?: Record<string, unknown> } } = {
                  type: 'image',
                  url,
                  title: null,
                  alt: ''
                }
                if (width) {
                  if (String(width).endsWith('%')) {
                    img.data = { hProperties: { style: `width:${width};` } }
                  } else {
                    img.data = { hProperties: { width: String(width) } }
                  }
                }
                parts.push(img)
              } else {
                // No path provided: keep original text to avoid creating a broken image
                parts.push({ type: 'text', value: full } as Text)
              }

              lastIndex = end
            }

            const tail = value.slice(lastIndex)
            if (parts.length > 0) {
              if (tail) parts.push({ type: 'text', value: tail } as Text)
              p.children.splice(i, 1, ...parts)
              i += parts.length - 1
              continue
            }
          } else if (child.type === 'image') {
            const imgNode = child as Image & { data?: { hProperties?: Record<string, unknown> } }
            const alt = (imgNode.alt || '').trim()
            const m = RE_ALT_SIZE.exec(alt)
            if (m) {
              const width = m[1]
              if (String(width).endsWith('%')) {
                imgNode.data = { ...(imgNode.data || {}), hProperties: { ...(imgNode.data?.hProperties || {}), style: `width:${width};` } }
              } else {
                imgNode.data = { ...(imgNode.data || {}), hProperties: { ...(imgNode.data?.hProperties || {}), width: String(width) } }
              }
              // Clear the alt to avoid rendering control text
              imgNode.alt = ''
            }
          }
          walk(child)
        }
      }
    }

    walk(tree)
  }
}

export default imageSizeShorthand


