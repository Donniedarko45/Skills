---
name: web-performance
description: Diagnose and fix frontend performance in React/Next.js apps - Core Web Vitals (LCP, INP, CLS), slow page loads, large JavaScript bundles, slow or janky interactions, layout shift, image, font and third-party script loading, hydration cost, and unnecessary re-renders. Use this whenever the user says a page or site is slow, laggy, janky or heavy; mentions Lighthouse, PageSpeed, Core Web Vitals, LCP, INP, CLS, TTFB, bundle size, or performance budgets; asks to optimise, speed up or audit a page; or when adding something likely to hurt performance (a hero image, a large library, a third-party script, a long list, a web font). Measure before changing anything.
---

# Web performance

Performance work is measurement work. Guessing produces changes that feel productive and move
nothing; the fix that matters is usually one specific thing (an unoptimised hero image, one
heavy library in a client component, a request waterfall), and only measurement shows which.

## The loop

1. **Measure** the page as users get it: a production build, throttled like a mid-range phone.
2. **Find the bottleneck**: which metric is failing, and which part of it is slow.
3. **Fix the biggest cause** only.
4. **Measure again** on the same setup. Keep the change if the number moved; revert it if not.
5. Repeat until the targets are met, then stop. Optimisation has a cost in complexity.

Never report an improvement that was not measured. State the before and after numbers, and how
they were taken.

## What to measure

The Core Web Vitals, assessed at the 75th percentile of real users:

| Metric  | Measures                                      | Good     | Poor     |
| ------- | --------------------------------------------- | -------- | -------- |
| **LCP** | when the largest above-the-fold element paints | ≤ 2.5 s  | > 4.0 s  |
| **INP** | slowest typical response to an interaction     | ≤ 200 ms | > 500 ms |
| **CLS** | how much visible content shifts unexpectedly   | ≤ 0.1    | > 0.25   |

Supporting metrics that explain the three above: TTFB (server response, good ≤ 0.8 s), FCP
(first paint, good ≤ 1.8 s), TBT (main-thread blocking during load, a lab proxy for INP), and
JavaScript transferred.

**Lab and field data answer different questions.** Lab runs (this skill's script, Lighthouse)
are repeatable and show causes; use them to diagnose and to compare before and after. Field
data (Chrome UX Report / PageSpeed Insights, or the app's own reporting through
`useReportWebVitals` or the `web-vitals` library) shows what users actually experience; use it
to decide whether there is a problem and whether it is fixed. If the user has field data, ask
for it or look at it first.

### Taking a lab measurement

Always against a production build. The dev server is unminified, uncached and several times
slower; its numbers mean nothing.

```bash
npm run build && npm run start        # next build && next start

node <this-skill-dir>/scripts/measure-vitals.mjs http://localhost:3000/
node <this-skill-dir>/scripts/measure-vitals.mjs http://localhost:3000/products --interact "button[data-filter]"
node <this-skill-dir>/scripts/measure-vitals.mjs http://localhost:3000/ --desktop --json before.json
```

The script loads the page several times in headless Chromium (mobile profile by default: 4x
CPU slowdown, slow 4G) and reports median LCP, CLS, FCP, TTFB and TBT; the LCP element with a
breakdown of where its time went; the largest layout shifts and what moved; long tasks; page
weight by resource type; the largest and render-blocking resources; and, with `--interact`,
the response time of a click split into input delay, handler time and rendering. It needs
`playwright` in the project (`npm i -D playwright`). Run with `--help` for options.

Save the output of the first run. It is the baseline every later change is compared against.

Lighthouse (`npx lighthouse <url> --view`) and the Chrome DevTools Performance panel give the
same picture with more detail when a browser is available.

## Fixing LCP

First identify the LCP element (the script prints it) and which of its four phases dominates:

| Phase               | Meaning                                              | Typical fixes                                                                  |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| TTFB                | server took long to respond                          | cache or prerender the route, stream with Suspense, fix slow queries, use a CDN |
| Resource load delay | browser found the LCP resource late                  | make it discoverable in HTML, eager-load, high fetch priority, preload          |
| Resource load time  | the resource itself is big or slow                   | right size, modern format, `sizes`, CDN, compression                            |
| Render delay        | resource ready but paint blocked                     | less render-blocking CSS/JS, do not render LCP content on the client only       |

For an image LCP in Next.js:

- Use `next/image`. Give the LCP image `loading="eager"` and `fetchPriority="high"` (or
  `preload` in Next.js 16+; the older `priority` prop is deprecated there). Every other image
  stays lazy, which is the default.
- Set `sizes` to match the rendered width (`sizes="(max-width: 768px) 100vw, 50vw"`). Without
  it, a `fill` or responsive image downloads a far larger file than needed.
- Do not use a CSS `background-image` for the hero: the browser cannot discover it until the
  CSS is parsed.
- The image must be in the server-rendered HTML. An image that appears only after hydration or
  a client fetch cannot be fast.

For a text LCP: fonts and render-blocking resources are the cause. Use `next/font`, keep CSS
small, and make sure the text is server-rendered rather than waiting on client data.

More detail, including TTFB and caching, in `references/core-web-vitals.md`.

## Fixing CLS

The script lists each shift and the elements that moved. The cause is almost always content
arriving without space reserved for it.

- Images and video: always give `width` and `height` (or `fill` inside a sized container, or a
  CSS `aspect-ratio`). `next/image` enforces this.
- Reserve space for anything that loads late: ads, embeds, banners, async data. Give the
  container a `min-height` or aspect ratio, and make skeletons the same size as the content.
- Never insert content above existing content after load (cookie banners, announcement bars);
  overlay it or reserve its slot.
- Fonts: `next/font` generates a size-matched fallback so text does not reflow on swap.
- Animate with `transform` and `opacity`. Animating `height`, `width`, `top` or `margin` shifts
  layout.
- Suspense fallbacks must match the size of what replaces them.
- Shifts within 500 ms of a user action do not count, so expanding a section on click is fine.

## Fixing INP

INP is the delay between an interaction and the next paint: input delay (main thread busy with
something else) + event handlers + rendering. The script's `--interact` output shows which
part dominates.

- **Input delay high**: too much JavaScript running at load or in the background. Ship less
  (see bundles below), defer third-party scripts, break up long tasks.
- **Handlers slow**: do the minimum synchronously, then yield. Update the UI first (close the
  menu, show the pending state), and move heavy work after a yield
  (`await scheduler.yield()` where supported, with a `setTimeout` fallback), into a transition,
  or into a web worker.
- **Rendering slow**: the update re-renders too much or touches too much DOM.
  - Mark non-urgent updates with `useTransition` / `startTransition`, and use `useDeferredValue`
    for expensive derived UI (filtering a big list while typing).
  - Keep state close to where it is used so a keystroke does not re-render the page.
  - Virtualize or paginate long lists; a large DOM makes every style and layout pass slower.
  - `content-visibility: auto` with `contain-intrinsic-size` on long off-screen sections.
  - Avoid layout thrashing: do not interleave DOM reads (`offsetHeight`,
    `getBoundingClientRect`) with writes in a loop.
- Debounce input-driven network requests, never the input's own visual update.

Give immediate feedback on every interaction, even when the work is slow: a pressed state,
a spinner, an optimistic update (`useOptimistic`).

React rendering diagnosis is covered in `references/react-rendering.md`.

## Shipping less JavaScript

JavaScript is the usual root cause of poor INP and a frequent cause of slow LCP.

1. **Look at what is shipped.** With Turbopack (the default bundler in Next.js 16+), run
   `npx next analyze` (16.1+) to explore bundles and import chains. With Webpack, use
   `@next/bundle-analyzer` (`ANALYZE=true npm run build`). Find the largest modules in the
   client bundles of the slow route and ask of each: is it needed on the client, and at load?
2. **Keep work on the server.** Server Components ship no JavaScript. Move data formatting,
   markdown rendering, syntax highlighting and date handling out of client components. Check
   each `'use client'`: everything a client file imports ships to the browser, so push the
   directive down to the smallest interactive leaf.
3. **Lazy-load what is not needed at first paint**: modals, drawers, charts, rich-text editors,
   maps, anything below the fold or behind a click. Use `next/dynamic` (or `React.lazy` with
   `Suspense`) and a sized placeholder. Import heavy libraries inside the event handler that
   needs them: `const { default: confetti } = await import('canvas-confetti')`.
4. **Fix imports.** Import the function, not the library (`date-fns/format`, not all of
   `lodash`). For packages with many exports (icon sets, component libraries), add them to
   `experimental.optimizePackageImports` in `next.config` if they are not already optimised
   automatically. Avoid barrel files that re-export a whole feature folder into client code.
5. **Replace or remove.** A smaller library, a platform API (`Intl`, `<dialog>`, CSS
   animations, `URLSearchParams`), or no dependency at all.
6. **Third-party scripts** (analytics, chat, tag managers) load through `next/script` with
   `strategy="lazyOnload"` or `afterInteractive`, never as a blocking tag in `<head>`.
   Question every one: they are often the largest cost on the page and nobody owns them.

Next.js specifics are in `references/nextjs-performance.md`. Before using a version-sensitive
API (caching, images, config keys), read the matching page in `node_modules/next/dist/docs/`,
which documents the installed version.

## Server and data

- Fetch in Server Components, in parallel (`Promise.all`), not in a chain of `await`s and not
  in `useEffect`.
- Wrap slow, independent regions in `<Suspense>` so the shell and fast content stream first.
- Cache what can be cached and prerender what can be prerendered. The caching model differs
  between Next.js versions and depends on whether `cacheComponents` is enabled; read the docs
  for the installed version before writing caching code.
- Send the client only the fields it renders. Large props serialised into the page payload
  cost download and parse time.
- `<Link>` prefetches routes in the viewport; keep it for primary navigation.

## Reporting

```markdown
## Performance: <page>

**Setup:** production build, mobile profile (4x CPU, slow 4G), median of 3 runs.

| Metric | Before | After | Target |
| ------ | ------ | ----- | ------ |
| LCP    | 4.1 s  | 2.2 s | ≤ 2.5 s |
| CLS    | 0.21   | 0.02  | ≤ 0.1  |
| TBT    | 890 ms | 310 ms| ≤ 200 ms |
| JS transferred | 612 kB | 344 kB | - |

### What was wrong
1. <cause, with evidence from the measurement>

### What changed
1. <change> - <file> - <measured effect>

### Not done / next
- <remaining issue, expected gain, why deferred>
```

Say when numbers are lab-only and that field data should confirm them. If a change did not
move the metric, say so and remove it.

## Reference files

- `references/core-web-vitals.md` - diagnosis tree for LCP, INP and CLS, TTFB and caching,
  field measurement with `useReportWebVitals`, performance budgets.
- `references/nextjs-performance.md` - `next/image`, `next/font`, `next/script`, dynamic
  imports, bundle analysis, config options, with code.
- `references/react-rendering.md` - finding and fixing unnecessary re-renders, the React
  Compiler, transitions, deferred values, list virtualization.
- `scripts/measure-vitals.mjs` - the lab measurement script described above.
