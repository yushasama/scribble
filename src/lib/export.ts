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

  // Collect all existing stylesheets and inline styles from the document
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((el: Element) => (el as HTMLElement).outerHTML)
    .join('\n');

  // Ensure KaTeX CSS is available in the standalone export (production builds often use
  // external CSS assets that won't be bundled alongside the exported HTML file). We include
  // the CDN stylesheet unconditionally to guarantee fonts and layout render correctly.
  const katexCdnCss = "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/katex.min.css\">";

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
  ${katexCdnCss}
  <style>
    :root { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      background: ${bgColor};
      color: ${textColor};
      font-family: system-ui, sans-serif;
      margin: 0;
    }
    .preview-wrapper { padding: 20px; overflow-x: auto; }

    /* Sleek horizontal scrollbar styling */
    .preview-wrapper,
    .preview-wrapper pre,
    .preview-wrapper .shiki {
      scrollbar-width: thin; /* Firefox */
      scrollbar-color: var(--code-accent, var(--theme-accent, #7aa2f7)) transparent;
    }
    .preview-wrapper::-webkit-scrollbar { height: 10px; width: 10px; }
    .preview-wrapper::-webkit-scrollbar-thumb {
      background-color: var(--code-accent, var(--theme-accent, #7aa2f7));
      border-radius: 8px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .preview-wrapper::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body>
${clone.outerHTML}
<script>
  (function(){
    function getCodeFromButton(btn){
      var container = btn.closest ? btn.closest('.code-container') : null;
      if(!container) return '';
      var pre = container.querySelector('pre');
      if(pre && pre.textContent) return pre.textContent;
      var code = container.querySelector('code');
      return code && code.textContent ? code.textContent : '';
    }
    function fallbackCopy(text){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly','');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(ta);
    }
    function copyText(text){
      if(!text) return;
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).catch(function(){ fallbackCopy(text); });
      } else {
        fallbackCopy(text);
      }
    }
    document.addEventListener('click', function(e){
      var target = e.target;
      if(!(target instanceof Element)) return;
      var btn = target.closest ? target.closest('.copy-btn') : null;
      if(btn){
        e.preventDefault();
        var text = getCodeFromButton(btn);
        copyText(text);
      }
    });

    // Click-to-activate horizontal scroll lock inside code blocks; disabled on mobile
    (function(){
      var isMobile = (function(){ try { return window.innerWidth < 768; } catch(_) { return false; } })();
      var scrollLock = new WeakMap();
      document.addEventListener('click', function(e){
        var el = e.target instanceof Element ? e.target.closest('.code-container') : null;
        if(!el) return;
        if(isMobile) return;
        var pre = el.querySelector('pre.shiki');
        if(!pre) return;
        var hasOverflow = pre.scrollWidth > pre.clientWidth;
        scrollLock.set(el, !!hasOverflow);
      });
      document.addEventListener('wheel', function(e){
        var el = e.target instanceof Element ? e.target.closest('.code-container') : null;
        if(!el) return;
        if(isMobile) return;
        if(!scrollLock.get(el)) return;
        var pre = el.querySelector('pre.shiki');
        if(!pre) return;
        e.preventDefault();
        var dx = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        pre.scrollTo({ left: pre.scrollLeft + dx, behavior: 'smooth' });
      }, { passive: false });
    })();
  })();
</script>
</body>
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
