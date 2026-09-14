import printStyles from './typeset/print.css?inline'

export function exportToMarkdown(markdown: string, fileName = 'scribble-export.md'): void {
  triggerDownload(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), fileName)
}

export function createStandaloneHTML(sourceElement: HTMLElement): string {
  const clone = sourceElement.cloneNode(true) as HTMLElement
  const computed = window.getComputedStyle(sourceElement)
  const background = resolveColor(computed.backgroundColor, '#ffffff')
  const foreground = resolveColor(computed.color, '#111827')
  const styles = collectDocumentStyles()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <base href="${escapeAttribute(window.location.href)}">
  <title>Scribble Export</title>
  ${styles}
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/katex.min.css">
  <style>
    :root { color-scheme: ${isDarkColor(background) ? 'dark' : 'light'}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { min-height: 100%; margin: 0; background: ${background}; color: ${foreground}; }
    body { font-family: system-ui, sans-serif; }
    .preview-wrapper { box-sizing: border-box; min-height: 100vh; padding: clamp(24px, 5vw, 64px); overflow-x: auto; }
  </style>
</head>
<body>
${clone.outerHTML}
<script>
  document.addEventListener('click', async function (event) {
    var target = event.target instanceof Element ? event.target.closest('.copy-btn') : null;
    if (!target) return;
    event.preventDefault();
    var container = target.closest('.code-container');
    var code = container ? container.querySelector('pre, code') : null;
    var text = code && code.textContent ? code.textContent : '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      var label = target.querySelector('span');
      if (label) { var previous = label.textContent; label.textContent = 'Copied'; setTimeout(function () { label.textContent = previous; }, 1500); }
    } catch (error) { console.error('Clipboard copy failed:', error); }
  });
</script>
</body>
</html>`
}

export function exportToHTML(sourceElement: HTMLElement, fileName = 'scribble-export.html'): void {
  triggerDownload(new Blob([createStandaloneHTML(sourceElement)], { type: 'text/html;charset=utf-8' }), fileName)
}

export function createPrintHTML(sourceElement: HTMLElement, fileName = 'scribble-export.pdf'): string {
  const html = createStandaloneHTML(sourceElement)
  return html.replace(/<script>[\s\S]*?<\/script>/g, '').replace('<title>Scribble Export</title>', `<title>${escapeAttribute(fileName.replace(/\.pdf$/i, ''))}</title>`).replace('</head>', `<style>${printStyles}</style></head>`)
}

export async function exportPDF(sourceElement: HTMLElement, fileName = 'scribble-export.pdf'): Promise<void> {
  document.querySelector('.scribble-print-frame')?.remove()
  const frame = document.createElement('iframe')
  frame.className = 'scribble-print-frame'
  frame.title = 'PDF print document'
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;'
  try {
    const loaded = new Promise<void>((resolve) => { frame.onload = (): void => resolve() })
    frame.srcdoc = createPrintHTML(sourceElement, fileName)
    document.body.appendChild(frame)
    await loaded
    const printWindow = frame.contentWindow
    const printDocument = frame.contentDocument
    if (!printWindow || !printDocument) throw new Error('The PDF print document could not be opened.')
    await waitForPrintAssets(printDocument)
    printWindow.addEventListener('afterprint', () => window.setTimeout(() => frame.remove(), 0), { once: true })
    printWindow.focus()
    printWindow.print()
  } catch (error) {
    frame.remove()
    throw error
  }
}

async function waitForPrintAssets(printDocument: Document): Promise<void> {
  const images = Array.from(printDocument.images)
  const layer = printDocument.querySelector<HTMLElement>('.typeset-background > div')
  const imageURL = layer?.style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
  if (imageURL) { const image = new Image(); image.src = imageURL; images.push(image) }
  let timer: number | undefined
  try {
    const ready = Promise.all([printDocument.fonts.ready, ...images.map((image) => image.decode())])
    await Promise.race([ready, new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error('Images or fonts are still loading. Try exporting again once they have loaded.')), 15000) })])
  } catch (error) {
    if (error instanceof DOMException) throw new Error('An image could not be loaded for PDF export. Check the document images and try again.')
    throw error
  } finally { window.clearTimeout(timer) }
}

function collectDocumentStyles(): string {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      return `<style>${Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n')}</style>`
    } catch {
      return sheet.ownerNode instanceof HTMLElement ? sheet.ownerNode.outerHTML : ''
    }
  }).join('\n')
}

function resolveColor(value: string, fallback: string): string {
  return !value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' ? fallback : value
}

function isDarkColor(value: string): boolean {
  const match = value.match(/[\d.]+/g)?.map(Number)
  if (!match || match.length < 3) return false
  return match[0] * 0.299 + match[1] * 0.587 + match[2] * 0.114 < 128
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
