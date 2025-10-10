import { useState, useEffect, useRef } from 'react';

interface ShikiResult {
  html: string;
  loading: boolean;
  error: string | null;
}

let worker: Worker | null = null;
let workerReady = false;
let messageId = 0;
const pendingRequests = new Map<number, (result: { type: string; html?: string; error?: string }) => void>();
const htmlCache = new Map<string, string>();

// Initialize worker once
function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./shiki.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { type, id } = e.data;

      if (type === 'ready') {
        workerReady = true;
      }

      if (type === 'result' || type === 'error') {
        const resolver = pendingRequests.get(id);
        if (resolver) {
          resolver(e.data);
          pendingRequests.delete(id);
        }
      }
    };
    
    worker.onerror = (error) => {
      console.error('❌ Worker error:', error);
    };

    // Initialize worker immediately
    worker.postMessage({ type: 'init', id: messageId++ });
  }

  return worker;
}

// Pre-initialize worker on module load
getWorker();

export function useShiki(
  code: string,
  language: string,
  theme: string = 'github-dark'
): ShikiResult {
  const [result, setResult] = useState<ShikiResult>({ html: '', loading: true, error: null });
  const lastKeyRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!code.trim()) {
      setResult({ html: '', loading: false, error: null });
      return;
    }

    let cancelled = false;

    const key = `${language}:${(theme || '').toLowerCase().replace(/\s+/g, '-')}:${code}`;

    // Serve from cache immediately and avoid re-highlighting if unchanged
    if (htmlCache.has(key)) {
      lastKeyRef.current = key;
      setResult({ html: htmlCache.get(key) || '', loading: false, error: null });
      return;
    }

    // If same request as last time and we already have html, skip
    if (lastKeyRef.current === key && result.html) {
      setResult(prev => ({ ...prev, loading: false }));
      return;
    }

    setResult(prev => ({ ...prev, loading: true, error: null }));

    const doHighlight = async () => {
      const worker = getWorker();
      const id = messageId++;

      // Wait for worker (simpler approach)
      let waitCount = 0;
      while (!workerReady && waitCount < 100) { // Increased from 50 to 100 (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
        // Wait for worker
      }

      if (cancelled) return;

      if (!workerReady) {
          console.error('Shiki worker not ready after timeout', { workerReady, waitCount });
        setResult({ html: `<pre><code>${code}</code></pre>`, loading: false, error: 'Worker timeout' });
        return;
      }

      // Shiki worker is ready

      // Debounce to reduce spam while typing/re-rendering
      const post = () => {
        // Normalize theme names (display -> bundled ID) if needed
        const normalizedTheme = (theme || 'github-light')
          .toLowerCase()
          .replace(/\s+/g, '-');

        worker.postMessage({
          type: 'highlight',
          lang: language,
          code,
          theme: normalizedTheme,
          id,
        });
      };

      // 120ms debounce
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(post, 120);

      pendingRequests.set(id, (response) => {
        if (cancelled) return;
        
        if (response.type === 'result') {
          // Shiki highlight successful
          const html = response.html || '';
          htmlCache.set(key, html);
          lastKeyRef.current = key;
          setResult({ html, loading: false, error: null });
        } else if (response.type === 'error') {
          console.error('Shiki highlight failed:', response.error, { language, theme });
          setResult({ html: '', loading: false, error: response.error || 'Unknown error' });
        }
      });
    };

    doHighlight();

    return () => {
      cancelled = true;
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [code, language, theme]);

  return result;
}

// Warm up Shiki on app start
export function warmupShiki() {
  getWorker();
}
