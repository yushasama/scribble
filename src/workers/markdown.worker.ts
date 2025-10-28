import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import imageSizeShorthand from '../lib/plugins/imageSizeShorthand';

// Minimal worker that parses Markdown -> HAST off the main thread
self.onmessage = async (e: MessageEvent<{ text: string }>) => {
  const { text } = e.data;
  try {
    const processor = unified()
      .use(remarkParse)
      .use(imageSizeShorthand)
      .use(remarkGfm)
      .use(remarkMath);

    const mdast = processor.parse(text);
    const hast = await processor.run(mdast);
    // Post back a simple success payload
    (self as unknown as { postMessage: (msg: unknown) => void }).postMessage({ success: true, hast });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    (self as unknown as { postMessage: (msg: unknown) => void }).postMessage({ success: false, error: message });
  }
};


