# Core Web Vitals: diagnosis

## Contents

1. LCP
2. TTFB
3. CLS
4. INP
5. Field measurement
6. Performance budgets
7. Symptom to cause

## 1. LCP

LCP is the render time of the largest image or text block visible in the viewport without
scrolling. It is the sum of four phases. Find the dominant one before changing anything; the
measurement script prints the breakdown.

```
navigation start
   |-- TTFB ------------------| first byte of HTML arrives
   |-- resource load delay ---| browser starts fetching the LCP resource
   |-- resource load time ----| LCP resource finishes downloading
   |-- element render delay --| LCP element is painted
```

A healthy split is roughly 40% TTFB, under 10% load delay, 40% load time, under 10% render
delay. Large delay phases are wasted time and the cheapest to remove.

### Resource load delay is large

The browser learned about the LCP resource late.

- The image is added by client JavaScript (rendered after hydration, in a carousel library, by
  a client fetch). Server-render it.
- The image is a CSS `background-image`. Use an `<img>` (`next/image`) positioned behind the
  content instead.
- The image has `loading="lazy"` (the `next/image` default). Set `loading="eager"` on the LCP
  image.
- The image is competing with other requests. Add `fetchPriority="high"`.
- It is discovered through a chain (CSS imports a font that... , or a script injects it). Make
  it a plain element in the HTML, or preload it.

A responsive page may have different LCP elements on mobile and desktop (a hero image on
desktop, a heading on mobile). Measure both profiles.

### Resource load time is large

The file is too big or the connection too slow.

- Serve the size that is displayed. A 3000 px image in a 400 px slot wastes most of its bytes.
  `next/image` with a correct `sizes` picks the right width.
- Modern formats: AVIF or WebP (`images.formats` in `next.config`).
- Photos rarely need quality above 75.
- Self-host or use a CDN close to users; a third-party origin adds DNS, TCP and TLS time
  (`<link rel="preconnect">` helps when a third-party origin is unavoidable).
- Long cache lifetimes for static assets.

### Element render delay is large

The resource is there but the browser cannot paint.

- Render-blocking CSS or synchronous scripts in `<head>`. Reduce CSS, move scripts to
  `next/script`.
- The element is rendered by client JavaScript after a large bundle downloads and runs. Move
  it to a Server Component.
- The element is hidden until JavaScript runs (an entrance animation from `opacity: 0`, an
  A/B testing snippet that hides the body). Remove the hide.
- Web font blocking text paint. `next/font` uses `font-display: swap` with a matched fallback.
- Long tasks on the main thread just before paint.

### Text LCP

When the LCP element is a heading or paragraph there is no resource phase. The time is TTFB
plus render delay, so the causes are the server, render-blocking resources and fonts.

## 2. TTFB

Everything else waits for the first byte.

- **Prerender and cache.** A page that does not depend on the request can be built once and
  served from a CDN. Find out why a route is dynamic (reading cookies, headers, search params,
  or uncached data) and whether the dynamic part can be isolated.
- **Stream.** With `<Suspense>` around slow regions, the server sends the shell immediately
  and the slow parts when ready. TTFB then no longer includes the slowest query.
- **Parallelise server work.** Sequential `await`s for independent data add up; start them
  together.
- **Cache data** that is expensive and does not change per request.
- **Move the server closer** to the data and the user; avoid a serverless function in one
  region calling a database in another.
- **Redirects** each cost a round trip. Link to the final URL.
- Cold starts, heavy middleware/proxy logic and large cookies all add to TTFB.

In current Next.js with `cacheComponents` enabled, a route is prerendered into a static shell
by default; data marked with `'use cache'` joins the shell, and anything that reads request
data or must be fresh has to sit under `<Suspense>` and streams in. Without `cacheComponents`,
the older model applies (per-`fetch` caching and route segment config). These APIs change
between versions: read `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
or `02-guides/caching-without-cache-components.md` for the installed version.

## 3. CLS

CLS is the largest burst of unexpected layout shifts during the page's life (a burst is shifts
less than 1 s apart, within a 5 s window). Each shift scores the fraction of the viewport
affected times the distance moved.

| What moved                                   | Likely cause                              | Fix                                                        |
| -------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Content below an image                       | image without dimensions                  | `width`/`height`, `fill` in a sized box, or `aspect-ratio` |
| Whole page moves down                        | banner or bar inserted at the top         | reserve its space, or overlay it (`position: fixed`)       |
| Text reflows shortly after first paint       | web font swap with a mismatched fallback  | `next/font`; `size-adjust` on the fallback                 |
| A region jumps when data arrives             | no placeholder, or a smaller one          | skeleton with the final dimensions; `min-height`           |
| Content shifts after hydration               | server and client render different markup | make the first client render match the server              |
| Shifts around an ad or embed                 | unsized iframe                            | fixed-size container                                       |
| Shift during an animation                    | animating layout properties               | animate `transform`/`opacity`                              |
| Shift when a scrollbar appears               | content crossing the overflow threshold   | `scrollbar-gutter: stable`                                 |

Notes:

- Shifts within 500 ms of a discrete user input are excluded, so user-triggered expansion is
  fine. Shifts caused by a slow response to input (data arriving 2 s after the click) count.
- Lab runs only see shifts during load. Field CLS also includes shifts while scrolling and
  after navigation in a single-page app, so field CLS is often worse than lab CLS. Scroll the
  page and interact with it when investigating.
- `content-visibility: auto` needs `contain-intrinsic-size`, or it causes shifts itself.

## 4. INP

INP is, roughly, the worst interaction latency on the page (the 98th percentile when there are
many interactions). One interaction's latency:

```
user input
   |-- input delay ---------| main thread was busy; handlers could not start
   |-- processing time -----| event handlers run
   |-- presentation delay --| style, layout, paint of the resulting frame
next paint
```

### Input delay is large

Something else was running when the user acted.

- At load: hydration and script evaluation. Ship less JavaScript; lazy-load non-critical
  components; defer third-party scripts.
- Later: timers, polling, analytics callbacks, expensive `scroll`/`resize`/`mousemove`
  listeners, a previous interaction still rendering.
- Break long tasks so the browser can respond between chunks.

```ts
async function yieldToMain() {
  if ('scheduler' in globalThis && 'yield' in scheduler) return scheduler.yield()
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

async function processAll(items: Item[]) {
  for (const [index, item] of items.entries()) {
    handleItem(item)
    if (index % 50 === 49) await yieldToMain()
  }
}
```

### Processing time is large

The handlers do too much.

- Do only what is needed for the next frame; defer the rest (after a yield, in
  `requestIdleCallback`, or in a web worker for pure computation).
- Do not call `flushSync` or read layout after writing styles inside handlers.
- For typing: update the input value urgently, and derive the expensive view from a deferred
  value.

```tsx
const [query, setQuery] = useState('')
const deferredQuery = useDeferredValue(query)
const results = useMemo(() => filter(items, deferredQuery), [items, deferredQuery])
```

### Presentation delay is large

The frame is expensive to produce.

- Too many components re-render: see `react-rendering.md`.
- The DOM is large (thousands of nodes): paginate, virtualize, or use `content-visibility`.
- The update forces layout of the whole page: contain it (`contain: layout`), avoid changing
  properties on ancestors of large subtrees.
- Heavy `backdrop-filter`, large box shadows and filters on big areas make paint slow.

### What a good interaction looks like

Within the first frame after input (about 100 ms at most), something visibly changes: a
pressed state, a spinner, the optimistic result. Slow work continues after that frame and does
not block the next input.

## 5. Field measurement

Lab tests cannot produce real INP, and they miss real devices and networks. Collect vitals
from users.

```tsx
// app/_components/web-vitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0]

// Defined outside the component so its identity is stable; a new function each render
// would cause metrics to be reported again.
function report(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    path: window.location.pathname,
  })
  if (navigator.sendBeacon) navigator.sendBeacon('/api/vitals', body)
  else fetch('/api/vitals', { body, method: 'POST', keepalive: true })
}

export function WebVitals() {
  useReportWebVitals(report)
  return null
}
```

Render `<WebVitals />` once in the root layout. Keep the client component this small so the
layout stays a Server Component.

- Aggregate at the 75th percentile, split by page (route pattern, not raw URL) and by device
  class.
- The `web-vitals` library's attribution build adds the LCP element, the shifted elements and
  the slow interaction's target to each report, which turns a number into a lead.
- The Chrome UX Report (shown in PageSpeed Insights and Search Console) gives 28-day field
  data for public pages with enough traffic, with no code.
- Many hosting platforms and analytics products collect vitals already; check before adding a
  new endpoint.

## 6. Performance budgets

A budget turns "do not get slower" into something a build can check. Reasonable starting
points for a content or marketing page on mobile:

| Budget                                   | Starting point            |
| ---------------------------------------- | ------------------------- |
| LCP (lab, mobile profile)                | under 2.5 s               |
| CLS                                      | under 0.1                 |
| TBT (lab)                                | under 200 ms              |
| JavaScript transferred on first load     | under about 200 kB        |
| LCP image                                | under about 150 kB        |
| Web fonts                                | 1-2 files, under 100 kB   |
| Third-party scripts                      | each one justified        |

App-like pages (dashboards, editors) carry more JavaScript; set the budget from the current
measured value and ratchet it down. Enforce in CI with Lighthouse CI or by comparing the
measurement script's JSON output against stored thresholds.

## 7. Symptom to cause

| Symptom                                              | Look at                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Blank screen for a long time, then everything        | TTFB; blocking data fetch with no Suspense; render-blocking scripts   |
| Text appears, hero image much later                  | LCP image lazy, unsized, low priority, or client-rendered             |
| Page looks ready but taps do nothing for a while     | hydration cost; too much client JavaScript; long tasks (TBT)          |
| Typing in a search box lags                          | every keystroke re-renders a large tree; no deferral; unvirtualized list |
| Content jumps as the page loads                      | unsized media, late banners, font swap, mismatched skeletons          |
| Fast on desktop, slow on phones                      | JavaScript execution cost; oversized images; test with CPU throttling |
| Fast on repeat visits, slow on first                 | bundle and image weight; missing prerendering or CDN caching          |
| Slow navigation between pages inside the app         | missing `loading.tsx`/Suspense; no prefetch; uncached dynamic routes  |
| Good lab scores, poor field scores                   | real devices are slower; INP and scroll-time CLS are invisible in lab; third-party scripts vary |
