import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkSourceMap from '../utils/remarkSourceMap'
import imageSizeShorthand from '../lib/plugins/imageSizeShorthand'

// Worker for off-thread Markdown parsing
self.onmessage = (e: MessageEvent<{ content: string; theme: string }>) => {
  const { content, theme } = e.data
  
  try {
    const processor = unified()
      .use(remarkParse)
      .use(imageSizeShorthand)
      .use(remarkGfm)
      .use(remarkMath, { singleDollarTextMath: true })
      .use(remarkSourceMap)
    
    const tree = processor.parse(content)
    const result = processor.runSync(tree)
    
    postMessage({ 
      success: true, 
      ast: result,
      content,
      theme 
    })
  } catch (error) {
    postMessage({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown parsing error',
      content,
      theme 
    })
  }
}

export {} // Make this a module
