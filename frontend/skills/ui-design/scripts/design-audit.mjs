#!/usr/bin/env node
// Design audit of a rendered page: the things a design director circles in red, measured.
//
// Usage: node design-audit.mjs <url> [options]      (run with --help for options)
//
// Needs `playwright` resolvable from the current working directory (npm i -D playwright),
// or from wherever this script lives. It complements an accessibility scan (axe), it does not
// replace one, and it does not judge taste: it finds inconsistency and breakage so your review
// time goes to the design itself.

import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HELP = `Usage: node design-audit.mjs <url> [options]

Options:
  --viewport <WxH>   Viewport (default 1280x800). Run again at 390x844 for mobile checks.
  --dark             Emulate prefers-color-scheme: dark.
  --json <file>      Also write the raw measurements as JSON.
  --strict           Exit 1 if any FAIL is found (for CI).
  --timeout <ms>     Navigation timeout (default 30000).
  -h, --help         Show this help.

What it reports:
  FAIL  horizontal overflow, text clipped by its container, text overlapping text,
        distorted images, fonts falling back to a system face
  WARN  too many type sizes / families / weights, heading widows (a lone last word),
        long lines, off-scale spacing, too many radii / shadows / colours,
        small tap targets (mobile), blurry (upscaled) images, competing filled buttons
        on the first screen, heading-outline problems
  INFO  inventories you should glance at: type scale, palette, radii, shadows, outline

Exit codes: 0 done (or no FAIL with --strict), 1 FAIL found with --strict, 2 usage or runtime error.`

function parseArgs(argv) {
  const o = { url: undefined, viewport: '1280x800', dark: false, json: undefined, strict: false, timeout: 30000 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0) }
    else if (a === '--dark') o.dark = true
    else if (a === '--strict') o.strict = true
    else if (a === '--viewport') o.viewport = argv[++i]
    else if (a === '--json') o.json = argv[++i]
    else if (a === '--timeout') o.timeout = Number(argv[++i])
    else if (a.startsWith('-')) fail(`Unknown option ${a}`)
    else if (!o.url) o.url = a
    else fail(`Unexpected argument ${a}`)
  }
  if (!o.url) fail('Missing <url>.')
  if (!/^\d+x\d+$/.test(o.viewport)) fail('--viewport must look like 1280x800.')
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

// Everything below runs inside the page.
function measure() {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const mobile = vw < 600
  const short = (t, n = 48) => { const s = String(t || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }
  const visible = (el) => {
    // closed <details>, content-visibility and hidden ancestors
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return false
    // screen-reader-only content
    if (cs.position === 'absolute' && (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)')) return false
    return true
  }
  const describe = (el) => {
    const tag = el.tagName.toLowerCase()
    const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.')
    return `${tag}${cls ? '.' + cls : ''} "${short(el.innerText || el.getAttribute('aria-label') || el.alt || '', 40)}"`
  }
  const px = (v) => parseFloat(v) || 0
  const all = [...document.body.querySelectorAll('*')].filter((el) => !el.closest('script,style,noscript,template,head'))
  const vis = all.filter(visible)
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()
  const textEls = vis.filter((el) => ownText(el).length > 0 && !el.closest('svg'))

  // ---- typography inventory
  const tally = (arr) => { const m = new Map(); for (const [k, ex] of arr) { const e = m.get(k) || { n: 0, ex }; e.n++; m.set(k, e) } return [...m.entries()].sort((a, b) => b[1].n - a[1].n) }
  const sizes = tally(textEls.map((el) => [Math.round(px(getComputedStyle(el).fontSize) * 2) / 2, describe(el)]))
  const families = tally(textEls.map((el) => [getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim(), '']))
  const weights = tally(textEls.map((el) => [getComputedStyle(el).fontWeight, '']))

  // fonts that never loaded fall back silently
  const fallback = []; const undeclared = []
  const faces = [...document.fonts]
  for (const [fam] of families) {
    if (/^(ui-|system-ui|-apple-system|BlinkMacSystemFont|sans-serif|serif|monospace|Arial|Helvetica|Times|Courier|Georgia|Menlo|Consolas|Segoe)/i.test(fam)) continue
    const mine = faces.filter((f) => f.family.replace(/["']/g, '').trim() === fam)
    if (!mine.length) undeclared.push(fam)
    else if (!mine.some((f) => f.status === 'loaded')) fallback.push(fam)
  }

  // ---- line length and heading widows
  const longLines = []
  for (const el of vis.filter((e) => /^(P|LI|DD|BLOCKQUOTE|FIGCAPTION|TD)$/.test(e.tagName))) {
    const text = (el.innerText || '').trim()
    if (text.length < 140) continue
    const range = document.createRange(); range.selectNodeContents(el)
    const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)))
    const lines = Math.max(1, tops.size)
    const cpl = Math.round(text.length / lines)
    if (cpl > 90) longLines.push({ el: describe(el), cpl })
  }
  const widows = []
  const isBlock = (el) => !/^inline/.test(getComputedStyle(el).display) || /^inline-(block|flex|grid)$/.test(getComputedStyle(el).display) && false
  const headingish = vis.filter((el) => isBlock(el) && (/^H[1-4]$/.test(el.tagName) || (px(getComputedStyle(el).fontSize) >= 28 && ownText(el).length > 0)))
  for (const el of headingish) {
    if (headingish.some((other) => other !== el && el.contains(other))) continue
    const words = []
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const re = /\S+/g; let m
      while ((m = re.exec(node.textContent))) {
        const r = document.createRange(); r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length)
        const rect = r.getBoundingClientRect(); if (rect.width) words.push({ w: m[0], top: Math.round(rect.top) })
      }
    }
    if (words.length < 4) continue
    const lines = []; for (const w of words) { const l = lines.find((x) => Math.abs(x.top - w.top) < 6); if (l) l.words.push(w.w); else lines.push({ top: w.top, words: [w.w] }) }
    lines.sort((a, b) => a.top - b.top)
    const last = lines[lines.length - 1]
    if (lines.length > 1 && last.words.length === 1 && last.words[0].length < 14) widows.push({ el: describe(el), word: last.words[0] })
  }

  // ---- clipping, truncation, overlap, overflow
  const clipped = []; const truncated = []
  for (const el of vis) {
    const cs = getComputedStyle(el)
    const clipsX = /hidden|clip/.test(cs.overflowX); const clipsY = /hidden|clip/.test(cs.overflowY)
    if (!clipsX && !clipsY) continue
    const over = (clipsX && el.scrollWidth > el.clientWidth + 1) || (clipsY && el.scrollHeight > el.clientHeight + 1)
    if (!over) continue
    if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp) { truncated.push(describe(el)); continue }
    if (!ownText(el)) continue // containers that crop decoration or images are fine
    clipped.push(describe(el))
  }
  // text-to-text overlap, using the rendered text runs (inline elements wrap into several boxes).
  // Decorative hero fragments are usually aria-hidden but still seen, so they are checked; only
  // overlaps inside one small decorative group (an avatar stack) are treated as intended.
  const runs = []
  for (const el of textEls) {
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue
      const r = document.createRange(); r.selectNodeContents(node)
      // crop each run to its line-height: tight display leading is not an overlap
      const lh = px(getComputedStyle(el).lineHeight)
      for (const rect of r.getClientRects()) {
        if (rect.width <= 2 || rect.height <= 2) continue
        const cut = lh && rect.height > lh ? (rect.height - lh) / 2 : 0
        runs.push({ el, r: { left: rect.left, right: rect.right, top: rect.top + cut, bottom: rect.bottom - cut, width: rect.width, height: rect.height - 2 * cut } })
      }
    }
  }
  const overlaps = []; const seen = new Set()
  for (let i = 0; i < runs.length && overlaps.length < 12; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i], b = runs[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
      const ga = a.el.closest('[aria-hidden="true"]'); const gb = b.el.closest('[aria-hidden="true"]')
      if (ga && ga === gb && ga.getBoundingClientRect().width < 160) continue
      const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      if (x <= 2 || y <= 3) continue
      const smaller = Math.min(a.r.width * a.r.height, b.r.width * b.r.height)
      if (x * y > 0.25 * smaller) {
        const key = `${describe(a.el)}  ×  ${describe(b.el)}`
        if (!seen.has(key)) { seen.add(key); overlaps.push(key) }
      }
    }
  }
  const overflowX = document.documentElement.scrollWidth > vw + 1
  const wide = overflowX ? vis.filter((el) => el.getBoundingClientRect().right > vw + 1).slice(0, 6).map(describe) : []

  // ---- spacing, radii, shadows, colours
  const onScale = (v) => v === 0 || v % 4 === 0 || [1, 2, 6, 10, 14].includes(v)
  const offScale = new Map()
  for (const el of vis) {
    const cs = getComputedStyle(el)
    for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap']) {
      const v = Math.round(px(cs[p]) * 10) / 10
      if (v && !onScale(v)) offScale.set(v, (offScale.get(v) || 0) + 1)
    }
  }
  const radii = tally(vis.map((el) => { const r = px(getComputedStyle(el).borderTopLeftRadius); return r ? [r >= 999 ? 'pill' : `${Math.round(r)}px`, describe(el)] : null }).filter(Boolean))
  // Tailwind composes shadows with transparent placeholder layers; keep only layers that show
  const realShadow = (s) => (s || '').split(/,(?![^(]*\))/).map((l) => l.trim()).filter((l) => l && l !== 'none' && !/rgba\(0, 0, 0, 0\)|transparent/.test(l) && !/^(rgba?\([^)]*\)\s+)?0px 0px 0px 0px/.test(l)).join(', ')
  const shadows = tally(vis.map((el) => { const s = realShadow(getComputedStyle(el).boxShadow); return s ? [s.replace(/\s+/g, ' ').slice(0, 90), describe(el)] : null }).filter(Boolean))
  const norm = (c) => c.replace(/\s+/g, '')
  const textColors = tally(textEls.map((el) => [norm(getComputedStyle(el).color), '']))
  const bgColors = tally(vis.map((el) => { const c = getComputedStyle(el).backgroundColor; return c && !/rgba\(0,0,0,0\)|transparent/.test(norm(c)) ? [norm(c), ''] : null }).filter(Boolean))

  // ---- tap targets (mobile)
  const smallTargets = []
  if (mobile) {
    for (const el of vis.filter((e) => e.matches('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=switch]'))) {
      if (el.matches('a') && el.closest('p,li') && (el.closest('p,li').innerText || '').trim().length > (el.innerText || '').trim().length + 20) continue // inline link in prose
      const target = el.matches('input[type=radio],input[type=checkbox]') && el.closest('label') ? el.closest('label') : el
      const r = target.getBoundingClientRect()
      if (r.width < 44 || r.height < 44) smallTargets.push({ el: describe(el), w: Math.round(r.width), h: Math.round(r.height) })
    }
  }

  // ---- images
  const distorted = []; const blurry = []
  for (const img of vis.filter((e) => e.tagName === 'IMG')) {
    if (!img.naturalWidth) continue
    const r = img.getBoundingClientRect(); const fit = getComputedStyle(img).objectFit
    const natural = img.naturalWidth / img.naturalHeight; const shown = r.width / r.height
    if ((fit === 'fill' || !fit) && Math.abs(natural - shown) / natural > 0.03) distorted.push(describe(img))
    if (r.width * window.devicePixelRatio > img.naturalWidth * 1.15) blurry.push(`${describe(img)} shown ${Math.round(r.width)}px, file ${img.naturalWidth}px`)
  }

  // ---- first screen: filled buttons competing
  const filled = vis.filter((el) => {
    if (!el.matches('a,button')) return false
    const r = el.getBoundingClientRect(); if (r.top > vh || r.bottom < 0) return false
    const bg = getComputedStyle(el).backgroundColor; const m = bg.match(/rgba?\(([^)]+)\)/)
    if (!m) return false; const parts = m[1].split(',').map(Number); const alpha = parts.length > 3 ? parts[3] : 1
    return alpha > 0.6 && (el.innerText || '').trim().length > 0
  }).map((el) => ({ el: describe(el), bg: getComputedStyle(el).backgroundColor }))

  // ---- headings outline
  const outline = vis.filter((el) => /^H[1-6]$/.test(el.tagName)).map((el) => ({ level: Number(el.tagName[1]), size: Math.round(px(getComputedStyle(el).fontSize)), text: short(el.innerText, 60) }))
  const outlineIssues = []
  const h1s = outline.filter((h) => h.level === 1).length
  if (h1s !== 1) outlineIssues.push(`${h1s} h1 elements (expected 1)`)
  for (let i = 1; i < outline.length; i++) if (outline[i].level > outline[i - 1].level + 1) outlineIssues.push(`skips from h${outline[i - 1].level} to h${outline[i].level} at "${outline[i].text}"`)

  // ---- small text: reviewers read tiny letter-spaced labels as low contrast
  const tiny = []; const small = []
  for (const el of textEls) {
    const size = px(getComputedStyle(el).fontSize)
    if (size < 11) tiny.push(`${size}px ${describe(el)}`)
    else if (size < 12 && !el.closest('[aria-hidden="true"]')) small.push(`${size}px ${describe(el)}`)
  }

  // ---- two-tone headings: a heading containing a run in a different colour
  let twoTone = 0; const twoToneList = []
  for (const h of vis.filter((e) => /^H[1-3]$/.test(e.tagName) || (e.matches('p,div') && px(getComputedStyle(e).fontSize) >= 32 && ownText(e)))) {
    const base = getComputedStyle(h).color
    const other = [...h.querySelectorAll('span,em,strong')].find((s) => getComputedStyle(s).color !== base && (s.innerText || '').trim().length >= 6)
    if (other) { twoTone++; twoToneList.push(short(h.innerText, 40)) }
  }

  // ---- mobile navigation: a header that shows links on desktop but none on a phone
  let mobileNavMissing = false
  if (mobile) {
    const header = document.querySelector('header')
    if (header) {
      const links = [...header.querySelectorAll('a[href]')].filter(visible)
      const toggle = [...header.querySelectorAll('button,summary,[role=button]')].filter(visible).some((b) => /menu|navigation|nav/i.test((b.getAttribute('aria-label') || '') + ' ' + (b.innerText || '') + ' ' + (b.getAttribute('aria-controls') || '')) || b.hasAttribute('aria-expanded') || b.tagName === 'SUMMARY')
      if (links.length <= 2 && !toggle) mobileNavMissing = true
    }
  }

  // ---- input placeholders cut off by their field
  const clippedPlaceholders = []
  const ctx2 = document.createElement('canvas').getContext('2d')
  for (const input of vis.filter((e) => e.matches('input[placeholder],textarea[placeholder]'))) {
    const cs = getComputedStyle(input); ctx2.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    const room = input.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight)
    if (input.tagName === 'INPUT' && ctx2.measureText(input.placeholder).width > room + 1) clippedPlaceholders.push(`"${short(input.placeholder, 40)}"`)
  }

  return {
    tiny, small, twoTone, twoToneList, mobileNavMissing, clippedPlaceholders,
    viewport: { w: vw, h: vh }, screens: Math.round((document.documentElement.scrollHeight / vh) * 10) / 10,
    sizes, families, weights, fallback, undeclared, longLines, widows, clipped, truncated, overlaps, overflowX, wide,
    offScale: [...offScale.entries()].sort((a, b) => b[1] - a[1]), radii, shadows, textColors, bgColors,
    smallTargets, distorted, blurry, filled, outline, outlineIssues,
  }
}

function report(m, opts) {
  const out = []; const issues = []
  const add = (level, msg) => issues.push({ level, msg })
  const mobile = m.viewport.w < 600

  if (m.overflowX) add('FAIL', `page scrolls horizontally; wider than the viewport: ${m.wide.join('; ')}`)
  for (const c of m.clipped.slice(0, 6)) add('FAIL', `text clipped by its container: ${c}`)
  for (const o of m.overlaps.slice(0, 6)) add('FAIL', `text overlaps text (check if intended): ${o}`)
  for (const d of m.distorted) add('FAIL', `image distorted (aspect ratio changed, use object-cover): ${d}`)
  for (const f of m.fallback) add('FAIL', `font "${f}" is not loaded; text is rendering in a fallback face`)
  for (const f of m.undeclared) add('WARN', `font "${f}" has no @font-face; it only renders where it is installed locally`)

  const sizeLimit = mobile ? 9 : 10
  if (m.sizes.length > sizeLimit) add('WARN', `${m.sizes.length} distinct font sizes (aim for ${mobile ? '6-8' : '6-9'}); merge near neighbours`)
  if (m.families.length > 3) add('WARN', `${m.families.length} font families: ${m.families.map(([f]) => f).join(', ')}`)
  if (m.weights.length > 4) add('WARN', `${m.weights.length} font weights: ${m.weights.map(([w]) => w).join(', ')}`)
  for (const w of m.widows.slice(0, 8)) add('WARN', `heading ends with a lone word "${w.word}": ${w.el} (text-wrap: balance, or rewrite)`)
  for (const l of m.longLines.slice(0, 5)) add('WARN', `about ${l.cpl} characters per line (keep body under ~75): ${l.el}`)
  const off = m.offScale.filter(([, n]) => n >= 2)
  if (off.length) add('WARN', `off-scale spacing values (px × uses): ${off.slice(0, 8).map(([v, n]) => `${v}×${n}`).join(', ')}`)
  if (m.radii.length > 6) add('WARN', `${m.radii.length} different corner radii; use a 3-5 step radius scale`)
  if (m.shadows.length > 4) add('WARN', `${m.shadows.length} different shadows; use 2-3 elevation levels`)
  if (m.textColors.length > 12) add('WARN', `${m.textColors.length} distinct text colours; tokens are drifting`)
  for (const t of m.smallTargets.slice(0, 8)) add('WARN', `tap target ${t.w}×${t.h}px (aim for 44×44): ${t.el}`)
  for (const b of m.blurry.slice(0, 5)) add('WARN', `image upscaled, will look soft: ${b}`)
  const bgs = new Set(m.filled.map((f) => f.bg))
  if (m.filled.length > 3 || bgs.size > 2) add('WARN', `${m.filled.length} filled buttons in ${bgs.size} colours on the first screen; one primary action should win`)
  for (const o of m.outlineIssues) add('WARN', `heading outline: ${o}`)
  if (m.tiny.length) add('WARN', `${m.tiny.length} texts under 11px (reviewers read them as illegible): ${m.tiny.slice(0, 3).join('; ')}`)
  if (m.small.length > 3) add('WARN', `${m.small.length} readable texts under 12px outside product fragments: ${m.small.slice(0, 3).join('; ')}`)
  if (m.twoTone > 3) add('WARN', `two-tone treatment on ${m.twoTone} headings (keep it to the hero and at most two more): ${m.twoToneList.slice(0, 5).join(' | ')}`)
  if (m.mobileNavMissing) add('WARN', 'the header shows no navigation on mobile and has no menu button')
  for (const c of m.clippedPlaceholders) add('WARN', `input placeholder does not fit its field: ${c}`)
  if (m.truncated.length) add('INFO', `${m.truncated.length} truncated texts (ellipsis/line-clamp); make sure the full value is reachable`)

  out.push(`Design audit: ${opts.url}`)
  out.push(`Viewport ${m.viewport.w}x${m.viewport.h}, ${opts.dark ? 'dark' : 'light'} scheme; page is ${m.screens} screens tall`)
  out.push('')
  const order = { FAIL: 0, WARN: 1, INFO: 2 }
  issues.sort((a, b) => order[a.level] - order[b.level])
  out.push(issues.length ? `Findings (${issues.filter((i) => i.level === 'FAIL').length} FAIL, ${issues.filter((i) => i.level === 'WARN').length} WARN)` : 'Findings: none')
  for (const i of issues) out.push(`  ${i.level.padEnd(4)}  ${i.msg}`)
  out.push('')
  out.push('Inventories (review these by eye)')
  out.push(`  type sizes: ${m.sizes.map(([s, e]) => `${s}px×${e.n}`).join(', ')}`)
  out.push(`  largest:   ${m.sizes.slice().sort((a, b) => b[0] - a[0]).slice(0, 3).map(([s, e]) => `${s}px ${e.ex}`).join(' | ')}`)
  out.push(`  families:  ${m.families.map(([f, e]) => `${f}×${e.n}`).join(', ')}`)
  out.push(`  weights:   ${m.weights.map(([w, e]) => `${w}×${e.n}`).join(', ')}`)
  out.push(`  radii:     ${m.radii.map(([r, e]) => `${r}×${e.n}`).join(', ') || 'none'}`)
  out.push(`  shadows:   ${m.shadows.length}${m.shadows.length ? ' (' + m.shadows.slice(0, 3).map(([s, e]) => `${e.n}× ${s}`).join(' | ') + ')' : ''}`)
  out.push(`  colours:   ${m.textColors.length} text, ${m.bgColors.length} background`)
  out.push(`  ratio:     largest type ${Math.max(...m.sizes.map(([s]) => s))}px to most-used ${m.sizes[0] ? m.sizes[0][0] : '?'}px`)
  out.push('  outline:')
  for (const h of m.outline.slice(0, 24)) out.push(`    ${'  '.repeat(h.level - 1)}h${h.level} ${h.size}px  ${h.text}`)
  return { text: out.join('\n'), fails: issues.filter((i) => i.level === 'FAIL').length }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const require = createRequire(import.meta.url)
  const { chromium } = require(resolveDependency('playwright'))
  const [w, h] = opts.viewport.split('x').map(Number)
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: opts.dark ? 'dark' : 'light', reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(opts.url, { waitUntil: 'networkidle', timeout: opts.timeout }).catch(() => page.waitForTimeout(1500))
    await page.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager' }) })
    await page.evaluate(() => document.fonts.ready)
    // scroll through so lazy content renders, then come back
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) } window.scrollTo(0, 0) })
    await page.evaluate(() => Promise.race([Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r })))), new Promise((r) => setTimeout(r, 4000))]))
    await page.waitForTimeout(300)
    const m = await page.evaluate(measure)
    const { text, fails } = report(m, opts)
    console.log(text)
    if (opts.json) writeFileSync(opts.json, JSON.stringify(m, null, 2))
    await browser.close()
    process.exit(opts.strict && fails ? 1 : 0)
  } catch (err) {
    await browser.close()
    console.error(`Audit failed: ${err.message}`)
    process.exit(2)
  }
}

main()
