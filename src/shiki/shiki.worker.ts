import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from 'shiki';

let highlighter: Highlighter | null = null;
const cache = new Map<string, string>();

// Initialize Shiki with common languages and themes
async function initializeShiki() {
  if (highlighter) return highlighter;

  highlighter = await createHighlighter({
    themes: [
      // Dark themes
      'github-dark',
      'github-dark-dimmed',
      'github-dark-high-contrast',
      'one-dark-pro',
      'nord',
      'dracula',
      'monokai',
      'night-owl',
      'vitesse-dark',
      'material-theme-darker',
      'material-theme-ocean',
      'material-theme-palenight',
      'min-dark',
      'slack-dark',
      'tokyo-night',
      'vesper',
      // Light themes
      'github-light',
      'github-light-high-contrast',
      'vitesse-light',
      'material-theme-lighter',
      'min-light',
      'slack-ochin',
      'solarized-light',
      // Special themes
      'solarized-dark',
      'rose-pine',
      'rose-pine-dawn',
      'rose-pine-moon',
      'catppuccin-latte',
      'catppuccin-frappe',
      'catppuccin-macchiato',
      'catppuccin-mocha',
      'one-dark-pro',
    ],
    langs: [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'python',
      'rust',
      'go',
      'java',
      'cpp',
      'c',
      'markdown',
      'json',
      'yaml',
      'html',
      'css',
      'bash',
      'sql',
      'verilog',
      'vhdl',
    ],
  });

  return highlighter;
}

// Warm up with sample code
async function warmup() {
  const hl = await initializeShiki();
  const samples: Array<[BundledLanguage, string]> = [
    ['javascript', 'function warm() { return true; }'],
    ['typescript', 'const x: number = 42;'],
    ['python', 'def hello(): pass'],
    ['rust', 'fn main() {}'],
    ['cpp', '#include <iostream>'],
    // HDL warmups
    ['verilog', 'module m; initial begin $display("hi"); end endmodule'],
    ['vhdl', 'entity m is end; architecture a of m is begin null; end;'],
  ];

  for (const [lang, code] of samples) {
    try {
      await hl.codeToHtml(code, { lang, theme: 'github-dark' });
    } catch (e) {
      console.warn(`Warmup failed for ${lang}:`, e);
    }
  }

  console.log('Shiki warmed up');
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, lang, code, theme, id } = e.data;

  if (type === 'init') {
    try {
      await initializeShiki();
      await warmup();
      self.postMessage({ type: 'ready', id });
    } catch (error) {
      self.postMessage({ type: 'error', error: String(error), id });
    }
    return;
  }

  if (type === 'highlight') {
    console.log('Worker received highlight request:', { lang, theme, id, codeLength: code?.length });
    try {
      const cacheKey = `${lang}:${theme}:${code}`;
      
      // Check cache
      if (cache.has(cacheKey)) {
        console.log('Cache hit for:', lang);
        self.postMessage({
          type: 'result',
          html: cache.get(cacheKey),
          lang,
          theme,
          cached: true,
          id,
        });
        return;
      }

      console.log('Highlighting:', lang, 'with', theme);
      const hl = await initializeShiki();
      
      // Check if theme is available
      const availableThemes = hl.getLoadedThemes();
      console.log('Available themes:', availableThemes);
      
      const html = await hl.codeToHtml(code, {
        lang: lang as BundledLanguage,
        theme: theme as BundledTheme,
      });

      console.log('Highlighted successfully:', lang, 'htmlLength:', html.length);

      // Cache result
      cache.set(cacheKey, html);
      
      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }

      self.postMessage({
        type: 'result',
        html,
        lang,
        theme,
        cached: false,
        id,
      });
    } catch (error) {
      console.error('❌ Worker highlight error:', error);
      self.postMessage({
        type: 'error',
        error: String(error),
        lang,
        id,
      });
    }
  }
};
