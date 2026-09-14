import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'
import { PDFDocument, PDFName } from 'pdf-lib'

const config = { url: process.env.SCRIBBLE_TEST_URL || 'http://localhost:5173', browser: process.env.SCRIBBLE_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe', output: resolve(import.meta.dirname, '../node_modules/.tmp/typeset-tests') }
await mkdir(config.output, { recursive: true })
const browser = await puppeteer.launch({ executablePath: config.browser, headless: true })
try {
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().includes('localhost:5173') && !request.url().includes('127.0.0.1:5173')) void request.abort(); else void request.continue() })
  await page.setViewport({ width: 1440, height: 1000 })
  await page.goto(config.url)
  await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#789'; ctx.fillRect(0, 0, 600, 400); ctx.fillStyle = '#234'; ctx.fillRect(30, 30, 540, 340)
    const image = canvas.toDataURL()
    const prose = 'A document should make sustained reading comfortable. Its hierarchy establishes where an idea begins, while the paragraph rhythm carries the argument forward.'
    localStorage.setItem('scribble-data', JSON.stringify({ content: `# A study in document rhythm\n\n## Reading and structure\n\n${prose}\n\n${prose}\n\n[Read the source](https://example.com)\n\n- A readable list\n\n  A loose list paragraph.\n\n> A quotation with its own rhythm.\n\n![A neutral figure](/vite.svg)![[|70%]]\n\n## Further observations\n\n${prose}\n\n${Array(12).fill(prose).join('\n\n')}\n\n| A | B |\n|---|---|\n| One | Two |\n\n$E=mc^2$\n\n\`\`\`js\nconst value = 1\n\`\`\``, theme: 'GitHub Dark', settings: { presentation: { style: 'editorial', paragraphs: 'indented', background: { image, opacity: .15, dimming: .2, fit: 'cover', position: 'center' } } } }))
  })
  await page.reload()
  await page.waitForSelector('.preview-wrapper[data-typeset="editorial"] .katex')
  const styles = await page.evaluate(() => {
    const doc = document.querySelector('.preview-wrapper'); const ps = doc.querySelectorAll(':scope > p'); const h2 = doc.querySelector('h2'); const link = doc.querySelector('a')
    return { first: getComputedStyle(ps[0]).textIndent, second: getComputedStyle(ps[1]).textIndent, list: getComputedStyle(doc.querySelector('li p')).textIndent, quote: getComputedStyle(doc.querySelector('blockquote p')).textIndent, denoter: getComputedStyle(h2, '::before').width, link: getComputedStyle(link).color, underline: getComputedStyle(link).textDecorationLine, textOpacity: getComputedStyle(ps[0]).opacity, imageOpacity: getComputedStyle(doc.querySelector('.typeset-background > div')).opacity, width: doc.querySelector('p img').style.width, table: !!doc.querySelector('table'), overflow: doc.scrollWidth > doc.clientWidth }
  })
  assert.equal(styles.first, '0px'); assert.equal(styles.second, '23.2px'); assert.equal(styles.list, '0px'); assert.equal(styles.quote, '0px'); assert.notEqual(styles.denoter, '0px'); assert.equal(styles.link, 'rgb(101, 181, 255)'); assert.equal(styles.underline, 'underline'); assert.equal(styles.textOpacity, '1'); assert.equal(styles.imageOpacity, '0.15'); assert.equal(styles.width, '70%'); assert.ok(styles.table); assert.equal(styles.overflow, false)
  await new Promise(resolve => setTimeout(resolve, 1800))
  await page.screenshot({ path: resolve(config.output, 'preview.png') })
  const html = await page.evaluate(async () => (await import('/src/lib/export.ts')).createStandaloneHTML(document.querySelector('.preview-wrapper')))
  await writeFile(resolve(config.output, 'document.html'), html)
  const exported = await browser.newPage(); await exported.setRequestInterception(true); exported.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().includes('localhost:5173') && !request.url().includes('127.0.0.1:5173')) void request.abort(); else void request.continue() }); await exported.setViewport({ width: 900, height: 1000 }); await exported.setContent(html, { waitUntil: 'networkidle0' })
  assert.equal(await exported.$eval('.preview-wrapper > p + p', element => getComputedStyle(element).textIndent), '23.2px')
  await exported.screenshot({ path: resolve(config.output, 'html.png') })
  await exported.close()
  await page.bringToFront()
  const cdp = await page.createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: config.output })
  console.log('Exporting PDF')
  await page.evaluate(async () => (await import('/src/lib/export.ts')).exportPDF(document.querySelector('.preview-wrapper'), 'document.pdf'))
  const pdf = await PDFDocument.load(await readFile(resolve(config.output, 'document.pdf')))
  assert.ok(pdf.getPageCount() >= 2 && pdf.getPageCount() <= 3)
  assert.ok(pdf.getPages().some(page => page.node.get(PDFName.of('Annots'))))
  const parsed = await page.evaluate(async () => {
    const { parsePresentation } = await import('/src/lib/typeset/settings.ts')
    return parsePresentation({ style: 'invalid', background: { image: 'javascript:alert(1)', opacity: 9, dimming: -1 } })
  })
  assert.equal(parsed.style, 'classic'); assert.equal(parsed.background.image, ''); assert.equal(parsed.background.opacity, 1); assert.equal(parsed.background.dimming, 0)
  await page.click('.document-style-picker summary')
  await page.select('.document-style-options select', 'classic')
  await page.waitForSelector('.preview-wrapper[data-typeset="classic"]')
  await page.select('.document-style-options select', 'editorial')
  await page.select('.document-style-options label:nth-child(2) select', 'block')
  assert.equal(await page.$eval('.preview-wrapper > p + p', element => getComputedStyle(element).textIndent), '0px')
  await new Promise(resolve => setTimeout(resolve, 500))
  await page.reload(); await page.waitForSelector('.preview-wrapper[data-typeset="editorial"]')
  assert.equal(await page.$eval('.preview-wrapper > p + p', element => getComputedStyle(element).textIndent), '0px')
  await page.setViewport({ width: 1100, height: 800 })
  assert.equal(await page.$eval('.preview-wrapper', element => element.scrollWidth > element.clientWidth), false)
  console.log('Typeset browser checks passed:', styles, config.output)
} finally { await browser.close() }
