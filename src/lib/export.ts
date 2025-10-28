/**
 * Unified Export System
 * Markdown, HTML, and PDF export with multiple options
 */

import html2pdf from "html2pdf.js";

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
// ─── PDF EXPORT (html2pdf.js, high fidelity) ───────────────────────────
//
/**
 * Exports the rendered preview to PDF with:
 * - exact theme colors
 * - no sliced equations or text
 * - high-DPI rendering
 */
export async function exportPDF(node: HTMLElement): Promise<void> {
  // 1. Wait for math + fonts to finish rendering
  await new Promise((r) => setTimeout(r, 500));
  if (document.fonts) await document.fonts.ready;

  // 1b. Wrap long paragraphs and list items in export-safe containers to avoid mid-paragraph splits
  document.querySelectorAll('p, li').forEach((el) => {
    const parent = el.parentElement;
    const parentHasWrapper = !!(parent && (parent.classList.contains('no-break-wrap') || parent.classList.contains('text-block')));
    if (!parentHasWrapper) {
      const wrapper = document.createElement('div');
      wrapper.className = 'text-block no-break-wrap';
      el.parentNode?.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    }
  });

  // 2. Inject export-specific CSS to prevent mid-slices and preserve colors
  const style = document.createElement("style");
  style.textContent = `
    /* Prevent math, code, or images from being sliced across pages */
    .katex-display, .katex, pre, code, .shiki-block, .code-container, img, figure {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: block;
    }

    /* Full background color on every page */
    html, body, .preview-wrapper {
      background: var(--theme-bg, #0d1117) !important;
      color: var(--theme-text, #e6edf3) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Ensure body fills the page so the bottom isn't white */
    body {
      min-height: 100vh;
    }

    /* Prevent inline text cuts */
    * { box-decoration-break: clone; }

    /* Optional: give big images a bit of top/bottom margin */
    img, figure { margin: 0.5em 0; }

    /* 🧱 Fix phantom gaps between consecutive dark blocks */
    .shiki-block,
    .code-container,
    .katex-display,
    .katex,
    pre,
    code {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }

    /* Force consistent stacking, no margin collapse */
    .shiki-block + *,
    .katex-display + *,
    pre + *,
    code + * {
      margin-top: 0.3rem !important;
    }

    /* Kill html2canvas phantom gaps from overflow or border rounding */
    .preview-wrapper * {
      transform: translateZ(0);
      overflow-anchor: none;
    }

    /* Fix huge gaps before code or math blocks */
    h1, h2, h3, h4, h5, h6, p, li {
      margin-bottom: 0.4rem !important;
    }

    .shiki-block,
    .code-container,
    pre,
    code,
    .katex-display,
    .katex {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      line-height: 1.45 !important;
    }

    /* Smooth spacing after text elements before dark blocks */
    p + .shiki-block,
    p + pre,
    p + .katex-display,
    li + .shiki-block,
    li + pre,
    li + .katex-display,
    h1 + .shiki-block,
    h2 + .shiki-block {
      margin-top: 0.3rem !important;
    }

    /* Ensure html2canvas doesn’t mis-measure dark containers */
    .preview-wrapper * {
      backface-visibility: hidden;
    }

    /* 🧷 Keep full paragraphs and list items together */
    .text-block,
    .no-break-wrap,
    p,
    li {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: block;
    }

    /* 📖 Ensure nice vertical rhythm */
    p, li, .text-block { margin-bottom: 0.6rem !important; }

    /* Default: avoid breaking inside blocks */
    .katex-display, .katex, pre, code, .shiki-block, .code-container, img, figure {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: block;
    }

    /* Allow soft breaks for very tall blocks */
    @media print {
      .tall-block {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }
      /* Optional: heading page-start helpers */
      h2, h3 { page-break-before: auto !important; }
      h2.page-start, h3.page-start { page-break-before: always !important; }
    }
  `;
  document.head.appendChild(style);

  // 3. Ensure KaTeX blocks have real height before rendering
  document.querySelectorAll(".katex-display").forEach((el) => {
    (el as HTMLElement).style.minHeight = `${(el as HTMLElement).getBoundingClientRect().height}px`;
  });

  // 3b. Optional: allow emergency image splitting only if unavoidable (extremely tall images)
  document.querySelectorAll("img").forEach((img) => {
    const h = (img as HTMLElement).getBoundingClientRect().height;
    if (h > 1100) (img as HTMLElement).style.pageBreakInside = "auto";
  });

  // 4. html2pdf configuration
  const opt = {
    margin: 0,
    filename: "scribble-export.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 2.5,
      useCORS: true,
      backgroundColor: null,
      logging: false,
      windowWidth: node.scrollWidth,
      dpi: 192,
      letterRendering: true,
    },
    pagebreak: {
      mode: ["css", "legacy"], // honor our "avoid" rules
      avoid: [
        ".text-block",
        "p",
        "li",
        ".katex-display",
        ".katex",
        "pre",
        "code",
        ".code-container",
        ".shiki-block",
        "img",
        "figure"
      ]
    },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
  } as const;

  // 5. Generate and save the PDF
  // Normalize Shiki/code container spacing before capture
  document.querySelectorAll('.shiki, .code-container').forEach(el => {
    (el as HTMLElement).style.lineHeight = '1.4';
    (el as HTMLElement).style.margin = '0';
    (el as HTMLElement).style.paddingBottom = '0.5em';
  });
  // Normalize heading and paragraph margins to avoid compounded gaps
  document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
    (el as HTMLElement).style.marginTop = '0';
    (el as HTMLElement).style.marginBottom = '0.5rem';
  });
  // Tighten padding on dark blocks
  document.querySelectorAll('.shiki, .code-container, .katex-display').forEach(el => {
    (el as HTMLElement).style.paddingTop = '0.4em';
    (el as HTMLElement).style.paddingBottom = '0.4em';
  });
  // Detect tall/does-not-fit blocks and allow soft page breaks for code/math only
  const PAGE_HEIGHT_PX = Math.round((297 / 25.4) * 96);
  const nodeTop = node.getBoundingClientRect().top + window.scrollY;
  document.querySelectorAll('.shiki-block, .code-container, .katex-display').forEach((el) => {
    const rect = (el as HTMLElement).getBoundingClientRect();
    const h = rect.height;
    const absTop = rect.top + window.scrollY - nodeTop;
    const remainingOnPage = PAGE_HEIGHT_PX - (Math.round(absTop) % PAGE_HEIGHT_PX);
    if (h > PAGE_HEIGHT_PX * 0.65 || h > remainingOnPage - 8) {
      (el as HTMLElement).classList.add('tall-block');
    }
  });
  // Anti-slice compositor stabilization (injected right before capture)
  const antiSliceFix = document.createElement('style');
  antiSliceFix.textContent = `
    /* 🩹 Fix sliced text and faint horizontal seams */
    * { transform: translateZ(0); backface-visibility: hidden; -webkit-font-smoothing: antialiased; }
    body, .preview-wrapper { image-rendering: -webkit-optimize-contrast; text-rendering: geometricPrecision; }
    /* Keep inline text unified within its block to avoid seam lines */
    p, li, h1, h2, h3, h4, h5, h6, div { break-inside: avoid !important; page-break-inside: avoid !important; }
    /* Force block formatting context to prevent margin-collapsing + reclaim empty space */
    .text-block, .no-break-wrap, p, li { contain: layout paint; overflow: visible; }
    html, body { background: var(--theme-bg, #0d1117) !important; }
  `;
  document.head.appendChild(antiSliceFix);
  // Ensure full-height rendering and background coverage
  node.style.minHeight = node.scrollHeight + "px";
  await html2pdf().set(opt).from(node).save();

  // 6. Clean up injected CSS
  style.remove();
  antiSliceFix.remove();
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
