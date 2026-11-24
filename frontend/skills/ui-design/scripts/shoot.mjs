#!/usr/bin/env node
// Review screenshots of a page: every width, full page cut into readable sections, plus the
// critique views (squint, greyscale, thumbnail) described in references/critique.md.
//
// Usage: node shoot.mjs <url> <outDir> [options]      (run with --help for options)
//
// Needs `playwright` resolvable from the current working directory (npm i -D playwright),
// or from wherever this script lives.

import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HELP = `Usage: node shoot.mjs <url> <outDir> [options]

Options:
  --widths <list>    Comma-separated viewport widths (default 390,1280). Add 768,1440 for a full pass.
  --dark             Also capture every width in dark mode.
  --name <prefix>    File name prefix (default "page").
  --section <px>     Height of each section slice (default 1.6 x viewport height).
  --motion           Keep animations (default: reduced motion, so nothing is captured mid-animation).
  --timeout <ms>     Navigation timeout (default 30000).
  -h, --help         Show this help.

Writes, for each width W (and -dark variants with --dark):
  <name>-W-fold.png         the first screen
  <name>-W-full.png         the whole page
  <name>-W-part-N.png       the page in sections, top to bottom, for close reading
and, for the widest width:
  <name>-squint.png         first screen blurred: does the focal point and hierarchy survive?
  <name>-grey.png           first screen in greyscale: is hierarchy carried by value, not hue?
  <name>-thumb.png          the whole page at 20%: composition, pacing, rhythm of sections`

function parseArgs(argv) {
  const o = { url: undefined, out: undefined, widths: [390, 1280], dark: false, name: 'page', section: 0, motion: false, timeout: 30000 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0) }
    else if (a === '--dark') o.dark = true
    else if (a === '--motion') o.motion = true
    else if (a === '--widths') o.widths = argv[++i].split(',').map(Number).filter(Boolean)
    else if (a === '--name') o.name = argv[++i]
    else if (a === '--section') o.section = Number(argv[++i])
    else if (a === '--timeout') o.timeout = Number(argv[++i])
    else if (a.startsWith('-')) fail(`Unknown option ${a}`)
    else if (!o.url) o.url = a
    else if (!o.out) o.out = a
    else fail(`Unexpected argument ${a}`)
  }
  if (!o.url || !o.out) fail('Need <url> and <outDir>.')
  return o
}

function fail(message) {
  console.error(`${message}\n\n${HELP}`)
  process.exit(2)
}

function resolveDependency(name) {
  for (const base of [path.join(process.cwd(), 'noop.js'), import.meta.url]) {
    try { return createRequire(base).resolve(name) } catch { /* next */ }
  }
  console.error(`Cannot find "${name}". Install it in the project:\n\n  npm i -D ${name}\n`)
  process.exit(2)
}

async function settle(page) {
  await page.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager' }) })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)) } window.scrollTo(0, 0) })
  await page.evaluate(() => Promise.race([Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r })))), new Promise((r) => setTimeout(r, 4000))]))
  await page.waitForTimeout(400)
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  const require = createRequire(import.meta.url)
  const { chromium } = require(resolveDependency('playwright'))
  mkdirSync(o.out, { recursive: true })
  const browser = await chromium.launch()
  const written = []
  const file = (n) => { const p = path.join(o.out, n); written.push(p); return p }
  try {
    const schemes = o.dark ? ['light', 'dark'] : ['light']
    for (const scheme of schemes) {
      for (const w of o.widths) {
        const h = w < 600 ? 844 : w < 1100 ? 1024 : 800
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: o.motion ? 'no-preference' : 'reduce' })
        const page = await ctx.newPage()
        const errors = []
        page.on('pageerror', (e) => errors.push(String(e)))
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
        await page.goto(o.url, { waitUntil: 'networkidle', timeout: o.timeout }).catch(() => page.waitForTimeout(1500))
        await settle(page)
        const tag = `${o.name}-${w}${scheme === 'dark' ? '-dark' : ''}`
        const total = await page.evaluate(() => document.documentElement.scrollHeight)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        await page.screenshot({ path: file(`${tag}-fold.png`) })
        await page.screenshot({ path: file(`${tag}-full.png`), fullPage: true })
        const step = o.section || Math.round(h * 1.6)
        let n = 0
        for (let y = 0; y < total; y += step) {
          n++
          await page.screenshot({ path: file(`${tag}-part-${n}.png`), fullPage: true, clip: { x: 0, y, width: w, height: Math.min(step, total - y) } })
        }
        console.log(`${tag}: ${(total / h).toFixed(1)} screens, ${n} sections${overflow > 0 ? `, OVERFLOWS by ${overflow}px` : ''}${errors.length ? `, ${errors.length} console errors: ${errors.slice(0, 2).join(' | ')}` : ''}`)
        await ctx.close()
      }
    }

    // Critique views at the widest width, light scheme
    const w = Math.max(...o.widths)
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(o.url, { waitUntil: 'networkidle', timeout: o.timeout }).catch(() => page.waitForTimeout(1500))
    await settle(page)
    await page.addStyleTag({ content: 'html{filter:blur(7px)}' })
    await page.screenshot({ path: file(`${o.name}-squint.png`) })
    await page.addStyleTag({ content: 'html{filter:grayscale(1)}' })
    await page.screenshot({ path: file(`${o.name}-grey.png`) })
    await ctx.close()
    const thumb = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 0.2, reducedMotion: 'reduce' })
    const tp = await thumb.newPage()
    await tp.goto(o.url, { waitUntil: 'networkidle', timeout: o.timeout }).catch(() => tp.waitForTimeout(1500))
    await settle(tp)
    await tp.screenshot({ path: file(`${o.name}-thumb.png`), fullPage: true })
    await thumb.close()
    console.log(`wrote ${written.length} files to ${o.out}`)
    await browser.close()
  } catch (err) {
    await browser.close()
    console.error(`Screenshot failed: ${err.message}`)
    process.exit(2)
  }
}

main()
