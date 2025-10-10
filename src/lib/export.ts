/**
 * Unified Export System
 * Markdown, HTML, and PDF export with multiple options
 */

//
// ─── MARKDOWN EXPORT ───────────────────────────────────────────────
//
export function exportToMarkdown(
  markdown: string,
  fileName = "scribble-export.md"
): void {
  const blob = new Blob([markdown], { type: "text/markdown" });
  triggerDownload(blob, fileName);
}

//
// ─── HTML EXPORT ───────────────────────────────────────────────────
//
export function exportToHTML(
  sourceElement: HTMLElement,
  fileName = "scribble-export.html"
): void {
  // Clone content so we can strip interactive controls (copy buttons, etc.)
  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.copy-btn, .copy-button-icon').forEach(el => el.remove());

  // Collect all existing stylesheets and inline styles from the document
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el: Element) => (el as HTMLElement).outerHTML)
    .join('\n');

  const computedStyle = window.getComputedStyle(sourceElement);
  const bgColor = computedStyle.backgroundColor || '#fff';
  const textColor = computedStyle.color || '#000';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Scribble Export</title>
  ${styles}
  <style>
    :root { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      background: ${bgColor};
      color: ${textColor};
      font-family: system-ui, sans-serif;
      margin: 0;
    }
    /* Hide any interactive controls if they survived */
    .copy-btn, .copy-button-icon { display: none !important; }
    .preview-wrapper { padding: 20px; }
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  triggerDownload(blob, fileName);
}

//
// ─── PDF EXPORT (ENHANCED) ─────────────────────────────────────
//
export async function exportToPDF(targetElement?: HTMLElement) {
  console.log("Starting Chrome-native PDF export (preview only)...");

  // Find the preview container (the actual content we want to print)
  const previewElement = (targetElement || document.querySelector(".preview-wrapper")) as HTMLElement;
  if (!previewElement) {
    console.error("No .preview-wrapper element found!");
    return;
  }

  // Wait for all async rendering to complete
  await waitForMathAndMermaid(previewElement);
  
  // Wait for the render completion signal
  console.log("⏳ Waiting for render completion signal...");
  await new Promise<void>((resolve) => {
    const check = (): void => {
      const readyFlag = (window as unknown as { __scribbleRenderReady?: boolean }).__scribbleRenderReady
      if (readyFlag) {
        console.log("✅ Render completion signal received");
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });

  // Grab all stylesheets and styles from the current document
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el: Element) => el.outerHTML)
    .join("\n");

  // Get computed theme colors and CSS variables
  const computed = getComputedStyle(previewElement);
  const bg = computed.backgroundColor || "#fff";
  const fg = computed.color || "#000";
  
  // Get CSS custom properties for proper theme integration
  const rootStyles = getComputedStyle(document.documentElement);
  const themeBg = rootStyles.getPropertyValue('--theme-bg').trim() || bg;
  const themeText = rootStyles.getPropertyValue('--theme-text').trim() || fg;
  const themeAccent = rootStyles.getPropertyValue('--theme-accent').trim() || '#7aa2f7';

  // Create isolated print window with ONLY the preview content
  const win = window.open("", "_blank", "width=1200,height=800");
  if (!win) {
    console.error("Popup blocked — cannot open print window");
    return;
  }

  // Create HTML with all styles included
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Scribble Export</title>
  ${styles}
  <style>
    :root {
      --theme-bg: ${themeBg};
      --theme-text: ${themeText};
      --theme-accent: ${themeAccent};
    }
    html, body, .preview-wrapper {
      margin: 0;
      padding: 0;
      width: 100%;
      height: auto;
      min-height: 100%;
      background: var(--theme-bg, ${bg});
      color: var(--theme-text, ${fg});
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page { 
      margin: 0; 
      size: auto; 
    }
    .preview-wrapper {
      background: var(--theme-bg, ${bg});
      color: var(--theme-text, ${fg});
      width: 100%;
      height: auto;
      min-height: 100%;
      box-sizing: border-box;
      padding: 20px;
    }
    @media print {
      html, body, .preview-wrapper {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100% !important;
        background: var(--theme-bg, ${bg}) !important;
        color: var(--theme-text, ${fg}) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      mjx-container, mjx-math, .MathJax {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        opacity: 1 !important;
        color: var(--theme-text, ${fg}) !important;
        display: block;
      }
      .mermaid, .mermaid svg {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        vector-effect: non-scaling-stroke;
      }
      .mermaid * {
        stroke-width: 1px !important;
      }
      pre, code, .shiki {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        background: inherit !important;
        color: inherit !important;
      }
    }
  </style>
</head>
<body>${previewElement.outerHTML}</body>
</html>`;

  win.document.write(html);

  win.document.close();

  // Give MathJax and Mermaid time to load in the new window
  await new Promise<void>((r: () => void) => setTimeout(r, 400));

  // Re-run Mermaid in the print window to ensure diagrams render
  try {
  const w = win as unknown as { mermaid?: { initialize: (cfg: { startOnLoad: boolean }) => void; run?: () => Promise<void> } };
    if (w.mermaid?.initialize) {
      console.log("🔄 Re-running Mermaid in print window...");
      w.mermaid.initialize({ startOnLoad: true });
      if (w.mermaid.run) await w.mermaid.run();
      console.log("✅ Mermaid re-rendered in print window");
    }
  } catch (error) {
    console.warn("Failed to re-run Mermaid in print window:", error);
  }

  win.focus();
  win.print();
}

//
// ─── DEBUG PREVIEW PRINT ─────────────────────────────────────
//
export async function debugPreviewPrint(): Promise<void> {
  console.log("🔍 Debug: Opening preview content in new window...");
  
  const previewElement = document.querySelector(".preview-wrapper") as HTMLElement;
  if (!previewElement) {
    console.error("No .preview-wrapper element found!");
    return;
  }

  // Wait for render completion signal
  console.log("⏳ Waiting for render completion signal...");
  await new Promise<void>((resolve) => {
    const check = (): void => {
      if ((window as unknown as { __scribbleRenderReady?: boolean }).__scribbleRenderReady) {
        console.log("✅ Render completion signal received");
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });

  const win = window.open("", "_blank", "width=1200,height=800");
  if (!win) {
    console.error("Popup blocked — cannot open debug window");
    return;
  }

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Debug Preview Content</title>
  <style>
    body {
      margin: 20px;
      font-family: system-ui, sans-serif;
      background: #f5f5f5;
    }
    .debug-info {
      background: #e3f2fd;
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="debug-info">
    <strong>Debug Preview Content</strong><br>
    This shows exactly what will be printed to PDF.
  </div>
  ${previewElement.outerHTML}
</body>
</html>`);

  win.document.close();
  console.log("✅ Debug window opened - check if content looks correct");
}

//
// ─── HELPERS ───────────────────────────────────────────────────────
//
function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function waitForMathAndMermaid(element: HTMLElement): Promise<void> {
  const win = window as unknown as Record<string, unknown>;
  if (win.MathJax && typeof (win.MathJax as Record<string, unknown>).typesetPromise === 'function') {
    await (win.MathJax as Record<string, unknown>).typesetPromise as () => Promise<void>;
  }
  
  // Wait for Mermaid to finish rendering
  while (element.querySelector(".mermaid:not(.mermaid-rendered)")) {
    await new Promise((r) => setTimeout(r, 100));
  }
}

// (no other helpers required)
