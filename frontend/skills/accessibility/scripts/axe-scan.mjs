#!/usr/bin/env node
// Automated accessibility scan of a URL with axe-core, driven by Playwright.
//
// Usage: node axe-scan.mjs <url> [options]      (run with --help for options)
//
// Needs `playwright` and `axe-core` resolvable from the current working directory
// (npm i -D playwright axe-core), or from wherever this script lives.
//
// An automated scan finds roughly a third of real accessibility problems. Zero
// violations here does not mean the page is accessible: follow up with a keyboard
// pass and an accessibility-tree review.

import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const HELP = `Usage: node axe-scan.mjs <url> [options]

Options:
  --viewport <WxH>       Viewport size (default 1280x800). Try 390x844 for mobile.
  --dark                 Emulate prefers-color-scheme: dark.
  --reduced-motion       Emulate prefers-reduced-motion: reduce.
  --wait-for <selector>  Wait for this selector before scanning.
  --click <selector>     Click this element before scanning, to reach a state
                         (open a menu or dialog, submit an empty form). Repeatable.
  --include <selector>   Scan only inside this selector. Repeatable.
  --exclude <selector>   Skip this selector (e.g. a third-party embed). Repeatable.
  --tags <list>          Comma-separated axe tags
                         (default wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa,best-practice).
  --fail-on <impact>     Exit 1 if any violation is at or above this impact:
                         minor | moderate | serious | critical (default minor).
  --max-nodes <n>        Elements listed per rule (default 5).
  --json <file>          Also write the full axe results as JSON.
  --timeout <ms>         Navigation timeout (default 30000).
  -h, --help             Show this help.

Exit codes: 0 no violations at or above --fail-on, 1 violations found, 2 usage or runtime error.`

const IMPACTS = ['minor', 'moderate', 'serious', 'critical']

function parseArgs(argv) {
  const opts = {
    url: undefined,
    viewport: '1280x800',
    dark: false,
    reducedMotion: false,
    waitFor: undefined,
    click: [],
    include: [],
    exclude: [],
    tags: 'wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa,best-practice',
    failOn: 'minor',
    maxNodes: 5,
    json: undefined,
    timeout: 30000,
  }
  const takesValue = {
    '--viewport': 'viewport',
    '--wait-for': 'waitFor',
    '--click': 'click',
    '--include': 'include',
    '--exclude': 'exclude',
    '--tags': 'tags',
    '--fail-on': 'failOn',
    '--max-nodes': 'maxNodes',
    '--json': 'json',
    '--timeout': 'timeout',
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') {
      console.log(HELP)
      process.exit(0)
    } else if (arg === '--dark') {
      opts.dark = true
    } else if (arg === '--reduced-motion') {
      opts.reducedMotion = true
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
  if (!/^\d+x\d+$/.test(opts.viewport)) fail('--viewport must look like 1280x800')
  if (!IMPACTS.includes(opts.failOn)) fail(`--fail-on must be one of: ${IMPACTS.join(', ')}`)
  opts.maxNodes = Number(opts.maxNodes)
  opts.timeout = Number(opts.timeout)
  if (!Number.isInteger(opts.maxNodes) || opts.maxNodes < 1) fail('--max-nodes must be a positive integer')
  if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) fail('--timeout must be a positive number')
  return opts
}

function fail(message) {
  console.error(`${message}\n\n${HELP}`)
  process.exit(2)
}

// Resolve a dependency from the project being scanned first, then from this script.
function resolveDependency(name) {
  const bases = [path.join(process.cwd(), 'noop.js'), import.meta.url]
  for (const base of bases) {
    try {
      return createRequire(base).resolve(name)
    } catch {
      // try the next base
    }
  }
  console.error(
    `Cannot find "${name}". Install it in the project being scanned:\n\n  npm i -D playwright axe-core\n`,
  )
  process.exit(2)
}

function truncate(text, max) {
  const flat = String(text).replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

function wcagCriteria(tags) {
  // axe tags success criteria as wcag111, wcag143, wcag258 ...
  return tags
    .filter((tag) => /^wcag\d{3,4}$/.test(tag))
    .map((tag) => {
      const digits = tag.slice(4)
      return `${digits[0]}.${digits[1]}.${digits.slice(2)}`
    })
}

function printRule(rule, maxNodes) {
  const criteria = wcagCriteria(rule.tags)
  const where = criteria.length ? `WCAG ${criteria.join(', ')}` : 'best practice'
  console.log(`\n  ${rule.id}  (${where})`)
  console.log(`    ${rule.help}`)
  console.log(`    ${rule.helpUrl}`)
  for (const node of rule.nodes.slice(0, maxNodes)) {
    console.log(`    - ${node.target.flat().join(' ')}`)
    console.log(`      ${truncate(node.html, 160)}`)
    if (node.failureSummary) {
      const summary = node.failureSummary
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/^Fix (any|all) of the following:?$/.test(line))
      for (const line of summary.slice(0, 3)) console.log(`      > ${truncate(line, 200)}`)
    }
  }
  if (rule.nodes.length > maxNodes) {
    console.log(`    ... and ${rule.nodes.length - maxNodes} more element(s)`)
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const require = createRequire(import.meta.url)
  const { chromium } = require(resolveDependency('playwright'))
  const axeSource = readFileSync(resolveDependency('axe-core/axe.min.js'), 'utf8')
  const [width, height] = opts.viewport.split('x').map(Number)

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: opts.dark ? 'dark' : 'light',
      reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
      bypassCSP: true,
    })
    const page = await context.newPage()
    page.setDefaultTimeout(opts.timeout)

    await page.goto(opts.url, { waitUntil: 'load', timeout: opts.timeout })
    // Let client rendering settle, without failing on pages that never go idle.
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    if (opts.waitFor) await page.waitForSelector(opts.waitFor)
    for (const selector of opts.click) {
      await page.click(selector)
      await page.waitForTimeout(400)
    }

    await page.evaluate(axeSource)
    const results = await page.evaluate(
      async ({ include, exclude, tags }) => {
        const context = {}
        if (include.length) context.include = include.map((selector) => [selector])
        if (exclude.length) context.exclude = exclude.map((selector) => [selector])
        return await window.axe.run(Object.keys(context).length ? context : document, {
          runOnly: { type: 'tag', values: tags },
          resultTypes: ['violations', 'incomplete'],
        })
      },
      {
        include: opts.include,
        exclude: opts.exclude,
        tags: opts.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      },
    )

    if (opts.json) {
      writeFileSync(opts.json, JSON.stringify(results, null, 2))
    }

    const title = await page.title()
    console.log(`Accessibility scan: ${opts.url}`)
    console.log(`Title: ${title || '(none)'}`)
    console.log(
      `Viewport ${opts.viewport}, ${opts.dark ? 'dark' : 'light'} scheme, axe-core ${results.testEngine.version}`,
    )

    const violations = results.violations
    const elementCount = violations.reduce((sum, rule) => sum + rule.nodes.length, 0)

    if (violations.length === 0) {
      console.log('\nNo automated violations found.')
    } else {
      console.log(`\n${violations.length} rule(s) violated across ${elementCount} element(s).`)
      for (const impact of [...IMPACTS].reverse()) {
        const rules = violations.filter((rule) => (rule.impact ?? 'minor') === impact)
        if (rules.length === 0) continue
        console.log(`\n${impact.toUpperCase()} (${rules.length})`)
        for (const rule of rules) printRule(rule, opts.maxNodes)
      }
    }

    if (results.incomplete.length) {
      console.log(`\nNEEDS MANUAL REVIEW (${results.incomplete.length}) - axe could not decide:`)
      for (const rule of results.incomplete) {
        console.log(`  ${rule.id}: ${rule.help} (${rule.nodes.length} element(s))`)
      }
    }

    console.log(
      '\nAutomated checks cover only part of WCAG. Also do a keyboard pass and review the accessibility tree.',
    )
    if (opts.json) console.log(`Full results written to ${opts.json}`)

    const threshold = IMPACTS.indexOf(opts.failOn)
    const failing = violations.some((rule) => IMPACTS.indexOf(rule.impact ?? 'minor') >= threshold)
    process.exitCode = failing ? 1 : 0
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(`Scan failed: ${error.message}`)
  process.exit(2)
})
