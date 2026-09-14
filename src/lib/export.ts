import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PDF_PAGE_WIDTH_PX = 794
const PDF_PAGE_HEIGHT_PX = 1123
const PDF_PAGE_PADDING_PX = 52
const PDF_CONTENT_HEIGHT_PX = PDF_PAGE_HEIGHT_PX - PDF_PAGE_PADDING_PX * 2
const PDF_ATOMIC_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, table, figure, img, .code-container, .shiki-block, .katex-display, .mermaid-block'
const PDF_HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6'

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

export async function exportPDF(sourceElement: HTMLElement, fileName = 'scribble-export.pdf'): Promise<void> {
  const { host, document: exportDocument, background } = createPDFDocument(sourceElement)
  document.body.appendChild(host)

  try {
    await waitForExportAssets(exportDocument)
    for (const paragraph of exportDocument.querySelectorAll<HTMLElement>('p')) paragraph.style.textIndent = getComputedStyle(paragraph).textIndent
    preparePDFPagination(exportDocument)
    const pageCount = Math.max(1, Math.ceil(exportDocument.scrollHeight / PDF_CONTENT_HEIGHT_PX))
    exportDocument.style.height = `${pageCount * PDF_CONTENT_HEIGHT_PX}px`
    const scale = Math.max(1.25, Math.min(2, 28000 / exportDocument.scrollHeight))
    const canvas = await html2canvas(exportDocument, { backgroundColor: background, scale, useCORS: true, logging: false, windowWidth: PDF_PAGE_WIDTH_PX })
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const canvasPageHeight = Math.round(PDF_PAGE_HEIGHT_PX * scale)
    const canvasContentHeight = Math.round(PDF_CONTENT_HEIGHT_PX * scale)
    const canvasPagePadding = Math.round(PDF_PAGE_PADDING_PX * scale)

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      if (pageIndex > 0) pdf.addPage()
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = canvas.width
      pageCanvas.height = canvasPageHeight
      const context = pageCanvas.getContext('2d')
      if (!context) throw new Error('Could not create the PDF page canvas.')
      context.fillStyle = background
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      const sourceY = pageIndex * canvasContentHeight
      const sourceHeight = Math.min(canvasContentHeight, canvas.height - sourceY)
      if (sourceHeight > 0) context.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, canvasPagePadding, canvas.width, sourceHeight)
      pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
    }

    const origin = exportDocument.getBoundingClientRect()
    for (const anchor of exportDocument.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      if (!/^(https?:|mailto:)/i.test(anchor.href)) continue
      for (const rect of anchor.getClientRects()) {
        const top = rect.top - origin.top
        const page = Math.floor(top / PDF_CONTENT_HEIGHT_PX)
        pdf.setPage(page + 1)
        pdf.link((rect.left - origin.left) * pdfWidth / PDF_PAGE_WIDTH_PX, (top % PDF_CONTENT_HEIGHT_PX + PDF_PAGE_PADDING_PX) * pdfHeight / PDF_PAGE_HEIGHT_PX, rect.width * pdfWidth / PDF_PAGE_WIDTH_PX, rect.height * pdfHeight / PDF_PAGE_HEIGHT_PX, { url: anchor.href })
      }
    }
    pdf.save(fileName)
  } finally {
    host.remove()
  }
}

function createPDFDocument(sourceElement: HTMLElement): { host: HTMLDivElement; document: HTMLDivElement; background: string } {
  const computed = window.getComputedStyle(sourceElement)
  const background = resolveColor(computed.backgroundColor, '#ffffff')
  const foreground = resolveColor(computed.color, '#111827')
  const host = document.createElement('div')
  const exportDocument = sourceElement.cloneNode(true) as HTMLDivElement
  host.className = 'scribble-export-host'
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${PDF_PAGE_WIDTH_PX}px;pointer-events:none;z-index:-1;`
  exportDocument.classList.add('scribble-pdf-document')
  exportDocument.removeAttribute('id')
  exportDocument.querySelectorAll('.copy-btn').forEach((button) => button.remove())
  exportDocument.style.boxSizing = 'border-box'
  exportDocument.style.width = `${PDF_PAGE_WIDTH_PX}px`
  exportDocument.style.height = 'auto'
  exportDocument.style.minHeight = `${PDF_CONTENT_HEIGHT_PX}px`
  exportDocument.style.overflow = 'visible'
  exportDocument.style.padding = `0 ${PDF_PAGE_PADDING_PX}px`
  exportDocument.style.backgroundColor = background
  exportDocument.style.color = foreground

  const style = document.createElement('style')
  style.textContent = `
    .scribble-pdf-document, .scribble-pdf-document * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .scribble-pdf-document :not(.typeset-background) > img { display: block; max-width: 100% !important; max-height: ${PDF_CONTENT_HEIGHT_PX - 48}px; object-fit: contain; break-inside: avoid; }
    .scribble-pdf-document figure, .scribble-pdf-document table, .scribble-pdf-document blockquote, .scribble-pdf-document .code-container, .scribble-pdf-document .shiki-block, .scribble-pdf-document .katex-display, .scribble-pdf-document .mermaid-block { break-inside: avoid; page-break-inside: avoid; }
    .scribble-pdf-document h1, .scribble-pdf-document h2, .scribble-pdf-document h3, .scribble-pdf-document h4, .scribble-pdf-document h5, .scribble-pdf-document h6 { break-after: avoid-page; page-break-after: avoid; }
    .scribble-pdf-document .code-container { overflow: hidden; }
    .scribble-pdf-document pre { overflow: hidden !important; white-space: pre-wrap !important; overflow-wrap: anywhere; }
    .scribble-pdf-spacer { display: block; width: 100%; margin: 0; padding: 0; border: 0; }
  `
  host.append(style, exportDocument)
  return { host, document: exportDocument, background }
}

function preparePDFPagination(exportDocument: HTMLElement): void {
  for (const image of exportDocument.querySelectorAll<HTMLImageElement>('img')) {
    if (image.closest('.typeset-background') || !image.naturalHeight) continue
    const maximumWidth = (PDF_CONTENT_HEIGHT_PX - 48) * image.naturalWidth / image.naturalHeight
    if (image.getBoundingClientRect().width > maximumWidth) image.style.width = `${maximumWidth}px`
  }
  const blocks = Array.from(exportDocument.querySelectorAll<HTMLElement>(PDF_ATOMIC_SELECTOR)).filter((element) => !element.parentElement?.closest(PDF_ATOMIC_SELECTOR) && !element.closest('.typeset-background'))
  for (const block of blocks) {
    if (block.matches(PDF_HEADING_SELECTOR)) {
      const opening = block.nextElementSibling
      if (opening instanceof HTMLElement) {
        const openingHeight = opening.getBoundingClientRect().height
        const height = opening.getBoundingClientRect().top - block.getBoundingClientRect().top + Math.min(openingHeight, PDF_CONTENT_HEIGHT_PX * .5)
        insertPDFPageSpacer(exportDocument, block, height)
      }
    }
    const image = block.matches('img') ? block as HTMLImageElement : block.querySelector<HTMLImageElement>('img')
    const top = block.getBoundingClientRect().top - exportDocument.getBoundingClientRect().top
    const remaining = PDF_CONTENT_HEIGHT_PX - top % PDF_CONTENT_HEIGHT_PX
    const height = block.getBoundingClientRect().height
    if (image && remaining > PDF_CONTENT_HEIGHT_PX * .3 && height > remaining && remaining / height >= .65) {
      image.style.maxHeight = `${Math.max(1, image.getBoundingClientRect().height - (height - remaining) - 8)}px`
      image.style.width = 'auto'
    }
    insertPDFPageSpacer(exportDocument, block, block.getBoundingClientRect().height)
  }
}

function insertPDFPageSpacer(exportDocument: HTMLElement, block: HTMLElement, blockHeight: number): void {
  if (blockHeight > PDF_CONTENT_HEIGHT_PX) return
  const top = block.getBoundingClientRect().top - exportDocument.getBoundingClientRect().top
  const pageOffset = ((top % PDF_CONTENT_HEIGHT_PX) + PDF_CONTENT_HEIGHT_PX) % PDF_CONTENT_HEIGHT_PX
  const remainingHeight = PDF_CONTENT_HEIGHT_PX - pageOffset
  if (pageOffset < 1 || blockHeight <= remainingHeight + 1) return
  const spacer = document.createElement('div')
  spacer.className = 'scribble-pdf-spacer'
  spacer.style.height = `${remainingHeight}px`
  block.before(spacer)
}

async function waitForExportAssets(exportDocument: HTMLElement): Promise<void> {
  if (document.fonts) await document.fonts.ready
  await Promise.all(Array.from(exportDocument.querySelectorAll('img')).map((image) => waitForImage(image)))
  const layer = exportDocument.querySelector<HTMLElement>('.typeset-background > div')
  const imageURL = layer?.style.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1]
  if (imageURL) { const image = new Image(); image.src = imageURL; await waitForImage(image) }
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete) return
  await new Promise<void>((resolve) => {
    const finish = (): void => resolve()
    image.addEventListener('load', finish, { once: true })
    image.addEventListener('error', finish, { once: true })
    window.setTimeout(finish, 8000)
  })
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
