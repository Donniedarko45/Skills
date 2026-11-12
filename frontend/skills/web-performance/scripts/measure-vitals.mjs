#!/usr/bin/env node
// Lab measurement of Core Web Vitals and page weight for a URL, driven by Playwright.
//
// Usage: node measure-vitals.mjs <url> [options]      (run with --help for options)
//
// Needs `playwright` resolvable from the current working directory (npm i -D playwright)
// or from wherever this script lives.
//
// Measure a production build (next build && next start), never the dev server.
// These are lab numbers from one machine: use them to find causes and compare
// before/after, and use field data (real users, 75th percentile) to judge the result.

import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HELP = `Usage: node measure-vitals.mjs <url> [options]

Options:
  --runs <n>             Page loads to measure; the median is reported (default 3).
  --desktop              Desktop profile: 1350x940, no CPU or network throttling.
                         Default is a mobile profile: 412x823, 4x CPU slowdown, slow 4G.
  --cpu <rate>           CPU slowdown multiplier (1 = none). Overrides the profile.
  --network <profile>    slow4g | fast4g | none. Overrides the profile.
  --viewport <WxH>       Viewport size. Overrides the profile.
  --interact <selector>  After load, click this element and measure how long the page
                         takes to respond (a lab stand-in for INP). Repeatable.
  --settle <ms>          Extra time to wait after load for late shifts and paints (default 3000).
  --json <file>          Also write all runs as JSON.
  --timeout <ms>         Navigation timeout (default 60000).
  -h, --help             Show this help.

Exit codes: 0 measured, 2 usage or runtime error. This script reports; it does not fail on slow pages.`

const NETWORKS = {
  // Same shape as Lighthouse's presets: latency in ms, throughput in bytes per second.
  slow4g: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
  fast4g: { latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 },
  none: null,
}

// [good, poor] thresholds. LCP, INP and CLS are the Core Web Vitals.
const THRESHOLDS = {
  lcp: [2500, 4000],
  cls: [0.1, 0.25],
  inp: [200, 500],
  fcp: [1800, 3000],
  ttfb: [800, 1800],
  tbt: [200, 600],
}

function parseArgs(argv) {
  const opts = {
    url: undefined,
    runs: 3,
    desktop: false,
    cpu: undefined,
    network: undefined,
    viewport: undefined,
    interact: [],
    settle: 3000,
    json: undefined,
    timeout: 60000,
  }
  const takesValue = {
    '--runs': 'runs',
    '--cpu': 'cpu',
    '--network': 'network',
    '--viewport': 'viewport',
    '--interact': 'interact',
    '--settle': 'settle',
    '--json': 'json',
    '--timeout': 'timeout',
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') {
      console.log(HELP)
      process.exit(0)
    } else if (arg === '--desktop') {
      opts.desktop = true
    } else if (arg in takesValue) {
      const value = argv[++i]
      if (value === undefined) fail(`Missing value for ${arg}`)
      const key = takesValue[arg]
      if (Array.isArray(opts[key])) opts[key].push(value)
      else opts[key] = value
    } else if (arg.startsWith('-')) {
      fail(`Unknown option: ${arg}`)
    } else if (opts.url === undefined) {
      opts.url = arg
    } else {
      fail(`Unexpected argument: ${arg}`)
    }
  }
  if (!opts.url) fail('Missing <url>')

  opts.runs = Number(opts.runs)
  opts.settle = Number(opts.settle)
  opts.timeout = Number(opts.timeout)
  if (!Number.isInteger(opts.runs) || opts.runs < 1) fail('--runs must be a positive integer')
  if (!Number.isFinite(opts.settle) || opts.settle < 0) fail('--settle must be zero or more')
  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) fail('--timeout must be a positive number')

  opts.cpu = opts.cpu === undefined ? (opts.desktop ? 1 : 4) : Number(opts.cpu)
  if (!Number.isFinite(opts.cpu) || opts.cpu < 1) fail('--cpu must be 1 or more')

  opts.network ??= opts.desktop ? 'none' : 'slow4g'
  if (!(opts.network in NETWORKS)) fail(`--network must be one of: ${Object.keys(NETWORKS).join(', ')}`)

  opts.viewport ??= opts.desktop ? '1350x940' : '412x823'
  if (!/^\d+x\d+$/.test(opts.viewport)) fail('--viewport must look like 412x823')
  return opts
}

function fail(message) {
  console.error(`${message}\n\n${HELP}`)
  process.exit(2)
}

function loadPlaywright() {
  const bases = [path.join(process.cwd(), 'noop.js'), import.meta.url]
  for (const base of bases) {
    try {
      const require = createRequire(base)
      return require(require.resolve('playwright'))
    } catch {
      // try the next base
    }
  }
  console.error('Cannot find "playwright". Install it in the project being measured:\n\n  npm i -D playwright\n')
  process.exit(2)
}

// Runs in the page before any of its own scripts. Collects performance entries.
function collectorScript() {
  const store = { lcp: null, shifts: [], longTasks: [], events: [] }
  window.__vitals = store

  const describe = (node) => {
    if (!node || node.nodeType !== 1) return null
    let selector = node.tagName.toLowerCase()
    if (node.id) selector += `#${node.id}`
    const classes = typeof node.className === 'string' ? node.className.trim().split(/\s+/).filter(Boolean) : []
    if (classes.length) selector += `.${classes.slice(0, 3).join('.')}`
    return selector
  }

  const observe = (type, callback, extra = {}) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(callback)).observe({
        type,
        buffered: true,
        ...extra,
      })
    } catch {
      // entry type not supported in this browser
    }
  }

  observe('largest-contentful-paint', (entry) => {
    const el = entry.element
    store.lcp = {
      time: entry.startTime,
      size: entry.size,
      url: entry.url || null,
      element: describe(el),
      text: el && !entry.url ? (el.textContent || '').trim().slice(0, 80) : null,
      loading: el?.getAttribute?.('loading') ?? null,
      fetchPriority: el?.getAttribute?.('fetchpriority') ?? null,
      isImage: el?.tagName === 'IMG',
    }
  })

  observe('layout-shift', (entry) => {
    if (entry.hadRecentInput) return
    store.shifts.push({
      time: entry.startTime,
      value: entry.value,
      sources: (entry.sources || []).map((source) => describe(source.node)).filter(Boolean),
    })
  })

  observe('longtask', (entry) => {
    store.longTasks.push({ start: entry.startTime, duration: entry.duration })
  })

  observe(
    'event',
    (entry) => {
      if (!entry.interactionId) return
      store.events.push({
        name: entry.name,
        duration: entry.duration,
        start: entry.startTime,
        inputDelay: entry.processingStart - entry.startTime,
        processing: entry.processingEnd - entry.processingStart,
        interactionId: entry.interactionId,
      })
    },
    { durationThreshold: 16 },
  )
}

// Runs in the page after load. Turns collected entries into metrics.
function readMetrics() {
  const store = window.__vitals
  const nav = performance.getEntriesByType('navigation')[0]
  const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
  const fcp = fcpEntry ? fcpEntry.startTime : null
  const ttfb = nav ? nav.responseStart : null

  // CLS: the largest burst of shifts (max 5s long, gaps under 1s).
  let cls = 0
  let windowValue = 0
  let windowStart = 0
  let previous = 0
  for (const shift of store.shifts) {
    if (windowValue > 0 && shift.time - previous < 1000 && shift.time - windowStart < 5000) {
      windowValue += shift.value
    } else {
      windowValue = shift.value
      windowStart = shift.time
    }
    previous = shift.time
    cls = Math.max(cls, windowValue)
  }

  // TBT: blocking portion (over 50ms) of each long task after first contentful paint.
  const tbt = store.longTasks
    .filter((task) => fcp === null || task.start + task.duration > fcp)
    .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0)
  const longestTask = store.longTasks.reduce((max, task) => Math.max(max, task.duration), 0)

  const resources = performance.getEntriesByType('resource').map((entry) => {
    const pathname = (() => {
      try {
        return new URL(entry.name).pathname
      } catch {
        return entry.name
      }
    })()
    const ext = (pathname.split('.').pop() || '').toLowerCase()
    let kind = 'other'
    if (entry.initiatorType === 'script' || ext === 'js' || ext === 'mjs') kind = 'script'
    else if (ext === 'css' || (entry.initiatorType === 'link' && ext === 'css')) kind = 'style'
    else if (['woff2', 'woff', 'ttf', 'otf'].includes(ext)) kind = 'font'
    else if (
      entry.initiatorType === 'img' ||
      ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico'].includes(ext) ||
      pathname.startsWith('/_next/image')
    )
      kind = 'image'
    else if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') kind = 'fetch'
    return {
      url: entry.name,
      kind,
      transfer: entry.transferSize || 0,
      decoded: entry.decodedBodySize || 0,
      start: entry.startTime,
      requestStart: entry.requestStart,
      end: entry.responseEnd,
      renderBlocking: entry.renderBlockingStatus === 'blocking',
      thirdParty: (() => {
        try {
          return new URL(entry.name).origin !== location.origin
        } catch {
          return false
        }
      })(),
    }
  })

  // LCP breakdown, when the LCP element is a resource we can find in the timeline.
  let lcpParts = null
  if (store.lcp && ttfb !== null) {
    const resource = store.lcp.url ? resources.find((r) => r.url === store.lcp.url) : null
    if (resource) {
      const requestStart = Math.max(ttfb, resource.requestStart || resource.start)
      lcpParts = {
        ttfb,
        loadDelay: Math.max(0, requestStart - ttfb),
        loadDuration: Math.max(0, resource.end - requestStart),
        renderDelay: Math.max(0, store.lcp.time - resource.end),
      }
    } else {
      lcpParts = { ttfb, loadDelay: 0, loadDuration: 0, renderDelay: Math.max(0, store.lcp.time - ttfb) }
    }
  }

  return {
    lcp: store.lcp ? store.lcp.time : null,
    lcpDetail: store.lcp,
    lcpParts,
    cls,
    shifts: store.shifts,
    fcp,
    ttfb,
    tbt,
    longestTask,
    longTaskCount: store.longTasks.length,
    domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
    load: nav ? nav.loadEventEnd : null,
    documentTransfer: nav ? nav.transferSize || 0 : 0,
    domNodes: document.querySelectorAll('*').length,
    resources,
  }
}

// A click produces several events (pointerdown, pointerup, click) that share an interactionId.
// The interaction's latency is its longest event; handler time is summed across its events.
function summarizeInteraction(events) {
  if (events.length === 0) return { duration: null }
  const byId = new Map()
  for (const event of events) {
    const group = byId.get(event.interactionId) ?? []
    group.push(event)
    byId.set(event.interactionId, group)
  }
  let worst = null
  for (const group of byId.values()) {
    const duration = Math.max(...group.map((event) => event.duration))
    if (worst && duration <= worst.duration) continue
    const first = group.reduce((a, b) => (a.start <= b.start ? a : b))
    const processing = group.reduce((sum, event) => sum + event.processing, 0)
    worst = {
      duration,
      names: [...new Set(group.map((event) => event.name))],
      inputDelay: first.inputDelay,
      processing,
      presentation: Math.max(0, duration - first.inputDelay - processing),
    }
  }
  return worst
}

async function measureOnce(browser, opts) {
  const [width, height] = opts.viewport.split('x').map(Number)
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: opts.desktop ? 1 : 2,
    isMobile: !opts.desktop,
    hasTouch: !opts.desktop,
  })
  try {
    const page = await context.newPage()
    await page.addInitScript(collectorScript)

    const cdp = await context.newCDPSession(page)
    const network = NETWORKS[opts.network]
    if (network) {
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', { offline: false, ...network })
    }
    if (opts.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: opts.cpu })

    await page.goto(opts.url, { waitUntil: 'load', timeout: opts.timeout })
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(opts.settle)

    const metrics = await page.evaluate(readMetrics)

    const interactions = []
    for (const selector of opts.interact) {
      const before = await page.evaluate(() => window.__vitals.events.length)
      await page.click(selector, { timeout: 10000 })
      await page.waitForTimeout(1500)
      const events = await page.evaluate((from) => window.__vitals.events.slice(from), before)
      interactions.push({ selector, ...summarizeInteraction(events) })
    }
    metrics.interactions = interactions
    metrics.inp = interactions.reduce(
      (worst, interaction) => (interaction.duration !== null ? Math.max(worst ?? 0, interaction.duration) : worst),
      null,
    )
    return metrics
  } finally {
    await context.close()
  }
}

function median(values) {
  const sorted = values.filter((value) => value !== null && value !== undefined).sort((a, b) => a - b)
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function rate(metric, value) {
  if (value === null) return 'n/a'
  const [good, poor] = THRESHOLDS[metric]
  if (value <= good) return 'good'
  return value <= poor ? 'needs improvement' : 'poor'
}

const ms = (value) => (value === null || value === undefined ? 'n/a' : `${Math.round(value)} ms`)
const kb = (bytes) => `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} kB`
const shorten = (url, max = 90) => {
  let text = url
  try {
    const parsed = new URL(url)
    text = parsed.pathname + parsed.search
    if (parsed.origin !== new URL(globalThis.__targetUrl).origin) text = parsed.host + text
  } catch {
    // keep the raw string
  }
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function report(opts, runs) {
  const rows = [
    ['LCP', 'lcp', ms, 'Largest Contentful Paint'],
    ['CLS', 'cls', (value) => (value === null ? 'n/a' : value.toFixed(3)), 'Cumulative Layout Shift'],
    ['INP*', 'inp', ms, 'slowest measured interaction'],
    ['FCP', 'fcp', ms, 'First Contentful Paint'],
    ['TTFB', 'ttfb', ms, 'Time to First Byte'],
    ['TBT', 'tbt', ms, 'Total Blocking Time'],
  ]
  const profile = opts.desktop ? 'desktop' : 'mobile'
  console.log(`Web Vitals (lab): ${opts.url}`)
  console.log(
    `Profile: ${profile}, viewport ${opts.viewport}, ${opts.cpu > 1 ? `CPU ${opts.cpu}x slowdown` : 'no CPU throttling'}, ${opts.network === 'none' ? 'no network throttling' : `network ${opts.network}`}, ${runs.length} run(s), median reported`,
  )

  console.log('')
  for (const [label, key, format, description] of rows) {
    const values = runs.map((run) => run[key])
    const mid = median(values)
    if (key === 'inp' && mid === null) continue
    const spread =
      runs.length > 1 && mid !== null
        ? `  [${values.map((value) => (value === null ? 'n/a' : format(value).replace(' ms', ''))).join(', ')}]`
        : ''
    console.log(`  ${label.padEnd(5)} ${format(mid).padStart(9)}  ${rate(key, mid).padEnd(18)} ${description}${spread}`)
  }
  if (opts.interact.length === 0) {
    console.log('  INP         n/a  (pass --interact <selector> to measure a click)')
  } else {
    console.log('  * one scripted click per selector; real INP comes from field data across all interactions')
  }

  // Details come from the run whose LCP is the median, so the numbers below are consistent.
  const lcpMedian = median(runs.map((run) => run.lcp))
  const detail =
    runs.reduce(
      (best, run) =>
        run.lcp !== null && (best === null || Math.abs(run.lcp - lcpMedian) < Math.abs(best.lcp - lcpMedian)) ? run : best,
      null,
    ) ?? runs[0]

  console.log('\nLCP element')
  if (detail.lcpDetail) {
    const lcp = detail.lcpDetail
    console.log(`  ${lcp.element ?? '(unknown)'}${lcp.text ? `  "${lcp.text}"` : ''}`)
    if (lcp.url) console.log(`  resource: ${shorten(lcp.url)}`)
    if (lcp.isImage) {
      console.log(`  loading=${lcp.loading ?? '(not set)'}  fetchpriority=${lcp.fetchPriority ?? '(not set)'}`)
      if (lcp.loading === 'lazy') console.log('  ! The LCP image is lazy-loaded. Load it eagerly with high fetch priority.')
      else if (lcp.fetchPriority !== 'high') console.log('  ! The LCP image has no fetchpriority="high".')
    }
    if (detail.lcpParts) {
      const parts = detail.lcpParts
      console.log(
        `  breakdown: TTFB ${ms(parts.ttfb)} + load delay ${ms(parts.loadDelay)} + load time ${ms(parts.loadDuration)} + render delay ${ms(parts.renderDelay)}`,
      )
    }
  } else {
    console.log('  No LCP entry recorded.')
  }

  const shifts = [...detail.shifts].sort((a, b) => b.value - a.value).slice(0, 5)
  if (shifts.length) {
    console.log('\nLargest layout shifts')
    for (const shift of shifts) {
      const sources = shift.sources.length ? shift.sources.join(', ') : '(source unknown)'
      console.log(`  ${shift.value.toFixed(3)} at ${ms(shift.time)}  moved: ${sources}`)
    }
  }

  if (detail.interactions.length) {
    console.log('\nInteractions')
    for (const interaction of detail.interactions) {
      if (interaction.duration === null) {
        console.log(`  ${interaction.selector}: no event timing recorded (under 16 ms, or not an interaction)`)
      } else {
        console.log(
          `  ${interaction.selector}: ${ms(interaction.duration)} = input delay ${ms(interaction.inputDelay)} + event handlers ${ms(interaction.processing)} + rendering ${ms(interaction.presentation)}  (${interaction.names.join(', ')})`,
        )
      }
    }
  }

  console.log('\nMain thread')
  console.log(`  ${detail.longTaskCount} long task(s), longest ${ms(detail.longestTask)}, DOM nodes ${detail.domNodes}`)

  const resources = detail.resources
  const totalTransfer = resources.reduce((sum, r) => sum + r.transfer, 0) + detail.documentTransfer
  console.log(`\nPage weight: ${kb(totalTransfer)} transferred in ${resources.length + 1} request(s)`)
  for (const kind of ['script', 'style', 'image', 'font', 'fetch', 'other']) {
    const group = resources.filter((r) => r.kind === kind)
    if (group.length === 0) continue
    const transfer = group.reduce((sum, r) => sum + r.transfer, 0)
    const decoded = group.reduce((sum, r) => sum + r.decoded, 0)
    const extra = kind === 'script' || kind === 'style' ? ` (${kb(decoded)} uncompressed)` : ''
    console.log(`  ${kind.padEnd(7)} ${String(group.length).padStart(3)} request(s)  ${kb(transfer).padStart(9)}${extra}`)
  }
  const thirdParty = resources.filter((r) => r.thirdParty)
  if (thirdParty.length) {
    console.log(
      `  third-party: ${thirdParty.length} request(s), ${kb(thirdParty.reduce((sum, r) => sum + r.transfer, 0))} (sizes may read 0 without Timing-Allow-Origin)`,
    )
  }

  const largest = [...resources].sort((a, b) => b.transfer - a.transfer).slice(0, 5).filter((r) => r.transfer > 0)
  if (largest.length) {
    console.log('\nLargest resources')
    for (const resource of largest) {
      console.log(`  ${kb(resource.transfer).padStart(9)}  ${resource.kind.padEnd(6)} ${shorten(resource.url)}`)
    }
  }

  const blocking = resources.filter((r) => r.renderBlocking)
  if (blocking.length) {
    console.log('\nRender-blocking resources')
    for (const resource of blocking.slice(0, 8)) {
      console.log(`  ${resource.kind.padEnd(6)} ${shorten(resource.url)}`)
    }
  }

  const devMarkers = /webpack-hmr|turbopack-hmr|hmr-client|hot-reloader|react-refresh|@vite\/client|\/_next\/static\/development\//
  if (resources.some((r) => devMarkers.test(r.url))) {
    console.log('\n! This looks like a development server. Dev builds are unminified and much slower.')
    console.log('  Measure a production build instead: next build && next start')
  }

  console.log('\nLab numbers vary between runs and machines. Compare before/after on the same setup,')
  console.log('and judge real-world results with field data (75th percentile of real users).')
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  globalThis.__targetUrl = opts.url
  const { chromium } = loadPlaywright()
  const browser = await chromium.launch()
  try {
    const runs = []
    for (let i = 0; i < opts.runs; i++) {
      runs.push(await measureOnce(browser, opts))
    }
    report(opts, runs)
    if (opts.json) {
      writeFileSync(opts.json, JSON.stringify({ url: opts.url, options: opts, runs }, null, 2))
      console.log(`\nAll runs written to ${opts.json}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(`Measurement failed: ${error.message}`)
  process.exit(2)
})
