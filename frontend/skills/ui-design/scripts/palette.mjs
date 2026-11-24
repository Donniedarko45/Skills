#!/usr/bin/env node
// Measure the palette of reference images (screenshots, mood-board shots, photos) so a design
// can be built from their real colours instead of guesses.
//
// Usage: node palette.mjs <image> [more images...] [--colors <n>]
//
// Prints, per image and for all images together: the dominant colours with their share of the
// pixels, as hex and as OKLCH (ready for CSS tokens), and a suggested role for each
// (canvas, surface, ink, muted, accent, tint). Needs `playwright` resolvable from the current
// working directory (npm i -D playwright) or from wherever this script lives.

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HELP = `Usage: node palette.mjs <image> [more images...] [--colors <n>]

  --colors <n>   Colours per image (default 8).
  -h, --help     Show this help.`

function resolveDependency(name) {
  for (const base of [path.join(process.cwd(), 'noop.js'), import.meta.url]) {
    try { return createRequire(base).resolve(name) } catch { /* next */ }
  }
  console.error(`Cannot find "${name}". Install it in the project:\n\n  npm i -D ${name}\n`)
  process.exit(2)
}

function parseArgs(argv) {
  const o = { images: [], k: 8 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0) }
    else if (a === '--colors') o.k = Number(argv[++i]) || 8
    else o.images.push(a)
  }
  if (!o.images.length) { console.error(HELP); process.exit(2) }
  return o
}

// sRGB 0-255 -> OKLCH
function toOklch([r, g, b]) {
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.sqrt(A * A + Bb * Bb)
  let H = (Math.atan2(Bb, A) * 180) / Math.PI; if (H < 0) H += 360
  return { L, C, H }
}
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const fmt = ({ L, C, H }) => `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${C < 0.01 ? 0 : Math.round(H)})`

function kmeans(pixels, k) {
  // deterministic init: spread over sorted lightness
  const sorted = pixels.slice().sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]))
  let centers = Array.from({ length: k }, (_, i) => sorted[Math.floor(((i + 0.5) / k) * sorted.length)].slice())
  let assign = new Array(pixels.length).fill(0)
  for (let iter = 0; iter < 14; iter++) {
    for (let p = 0; p < pixels.length; p++) {
      let best = 0, bd = Infinity
      for (let c = 0; c < k; c++) {
        const d = (pixels[p][0] - centers[c][0]) ** 2 + (pixels[p][1] - centers[c][1]) ** 2 + (pixels[p][2] - centers[c][2]) ** 2
        if (d < bd) { bd = d; best = c }
      }
      assign[p] = best
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0])
    for (let p = 0; p < pixels.length; p++) { const s = sums[assign[p]]; s[0] += pixels[p][0]; s[1] += pixels[p][1]; s[2] += pixels[p][2]; s[3]++ }
    centers = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centers[i]))
  }
  const counts = new Array(k).fill(0); for (const a of assign) counts[a]++
  return centers.map((c, i) => ({ rgb: c, share: counts[i] / pixels.length })).filter((c) => c.share > 0.004).sort((a, b) => b.share - a.share)
}

function roles(colors) {
  const withLch = colors.map((c) => ({ ...c, lch: toOklch(c.rgb) }))
  const out = new Map()
  const light = withLch.filter((c) => c.lch.L > 0.9).sort((a, b) => b.share - a.share)
  if (light[0]) out.set(light[0], 'canvas')
  if (light[1]) out.set(light[1], 'surface/tray')
  const dark = withLch.filter((c) => c.lch.L < 0.35)
  const darkest = dark.slice().sort((a, b) => a.lch.L - b.lch.L)[0]
  const biggestDark = dark.slice().sort((a, b) => b.share - a.share)[0]
  if (darkest) out.set(darkest, 'ink')
  if (biggestDark && biggestDark !== darkest && biggestDark.share > 0.05) out.set(biggestDark, 'deep band')
  const mid = withLch.filter((c) => c.lch.L >= 0.45 && c.lch.L <= 0.75 && c.lch.C < 0.04)
  if (mid[0]) out.set(mid[0], 'muted text')
  const chroma = withLch.filter((c) => c.lch.C >= 0.06 && !out.has(c)).sort((a, b) => b.lch.C - a.lch.C)
  if (chroma[0]) out.set(chroma[0], 'accent')
  for (const c of withLch.filter((x) => x.lch.C >= 0.025 && x.lch.L > 0.8 && !out.has(x))) out.set(c, 'tint')
  return withLch.map((c) => ({ ...c, role: out.get(c) || '' }))
}

async function main() {
  const o = parseArgs(process.argv.slice(2))
  const require = createRequire(import.meta.url)
  const { chromium } = require(resolveDependency('playwright'))
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const everything = []
  for (const file of o.images) {
    const ext = path.extname(file).slice(1).toLowerCase().replace('jpg', 'jpeg')
    const data = `data:image/${ext || 'png'};base64,${readFileSync(file).toString('base64')}`
    const pixels = await page.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode()
      const w = 160, h = Math.max(1, Math.round((img.height / img.width) * 160))
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h)
      const d = ctx.getImageData(0, 0, w, h).data; const px = []
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) px.push([d[i], d[i + 1], d[i + 2]])
      return px
    }, data)
    everything.push(...pixels)
    print(path.basename(file), roles(kmeans(pixels, o.k)))
  }
  if (o.images.length > 1) print('ALL IMAGES', roles(kmeans(everything, o.k + 2)))
  await browser.close()
}

function print(title, colors) {
  console.log(`\n${title}`)
  for (const c of colors) console.log(`  ${(c.share * 100).toFixed(1).padStart(5)}%  ${hex(c.rgb)}  ${fmt(c.lch).padEnd(24)} ${c.role}`)
}

main().catch((e) => { console.error(e.message); process.exit(2) })
