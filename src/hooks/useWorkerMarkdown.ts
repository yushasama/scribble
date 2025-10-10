import { useEffect, useRef, useState } from 'react';

interface WorkerSuccess {
  success: true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hast: any;
}

interface WorkerFailure {
  success: false;
  error: string;
}

type WorkerResponse = WorkerSuccess | WorkerFailure;

export function useWorkerMarkdown(content: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tree, setTree] = useState<any>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Reuse a single worker instance per hook mount
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('../workers/markdown.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    const worker = workerRef.current;

    const onMessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.success) {
        setTree(e.data.hast);
      } else {
        // eslint-disable-next-line no-console
        console.error('Worker parse error:', e.data.error);
      }
    };

    worker.addEventListener('message', onMessage as EventListener);
    worker.postMessage({ text: content });

    return () => {
      worker.removeEventListener('message', onMessage as EventListener);
      // Keep worker alive across renders for responsiveness; terminate only on unmount
    };
  }, [content]);

  // Terminate on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return tree;
}


