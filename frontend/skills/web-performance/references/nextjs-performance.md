# Next.js performance techniques

Written against Next.js 16 with the App Router. APIs and defaults change between versions:
confirm against the documentation bundled with the installed version in
`node_modules/next/dist/docs/` (for example `01-app/03-api-reference/02-components/image.md`),
and check `package.json` for the major version before applying anything here.

## Contents

1. Images
2. Fonts
3. Third-party scripts
4. Lazy loading
5. Bundle analysis
6. Config options that affect bundle size
7. Data fetching, streaming and caching
8. Navigation and prefetching
9. Checklist

## 1. Images

```tsx
import Image from 'next/image'
import hero from './hero.jpg' // static import: width, height and blur placeholder are inferred

// The LCP image: eager, high priority, sized
<Image
  src={hero}
  alt="Dashboard showing weekly revenue"
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="eager"
  fetchPriority="high"
  placeholder="blur"
/>

// Everything else: lazy by default
<Image src={product.imageUrl} alt={product.name} width={400} height={300} sizes="(max-width: 640px) 50vw, 25vw" />

// Fill a sized parent
<div className="relative aspect-video">
  <Image src={post.cover} alt="" fill sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" />
</div>
```

- **`sizes` is the most commonly missed prop.** It tells the browser how wide the image will be
  so it can pick from the generated `srcset`. Without it, a `fill` image is treated as full
  viewport width and a fixed-size image only gets 1x/2x variants. Write it to match the layout:
  one media condition per breakpoint where the image's width changes.
- **One LCP image per page** gets `loading="eager"` and `fetchPriority="high"`. In Next.js 16+
  the `preload` prop inserts a `<link rel="preload">` in the head and replaces the deprecated
  `priority` prop; the docs recommend `loading="eager"` or `fetchPriority="high"` in most
  cases. On Next.js 15 and earlier, use `priority`.
- Do not mark several images as high priority: priority is relative, and they compete.
- Remote images need `images.remotePatterns` in `next.config`, and explicit `width`/`height`
  or `fill`.
- Allow AVIF: `images: { formats: ['image/avif', 'image/webp'] }`. AVIF is smaller but slower
  to encode on first request.
- `quality` defaults to 75. In Next.js 16, values must be listed in `images.qualities`.
- SVG icons and logos do not need optimisation; inline them or use `<img>`/`unoptimized`.
- Animated GIFs are not optimised and are very heavy. Use a muted, looping `<video>` instead.
- For art direction (different crops per breakpoint), use `getImageProps()` with `<picture>`.
- Decorative images take `alt=""`.

Video: do not autoplay large files above the fold; set `preload="none"` or `"metadata"` and a
`poster` image, and give the element dimensions.

## 2. Fonts

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans-family' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

- `next/font` downloads the font at build time and serves it from the app's origin, so there
  is no request to a font CDN, and it generates a fallback with adjusted metrics so the swap
  does not shift layout.
- Use a variable font (one file for all weights). Otherwise list only the weights in use.
- `subsets` limits the glyphs shipped; include only the scripts the product needs.
- Limit families: one for UI, optionally one for display or code.
- For a licensed or custom font use `next/font/local` with `.woff2` files.
- Icon fonts are a poor trade: a large file for a few glyphs, and no accessibility. Use SVG.
- Do not load fonts with `<link>` to a third-party stylesheet or `@import` in CSS; both block
  rendering and add connections.

## 3. Third-party scripts

```tsx
import Script from 'next/script'

// Needed soon after the page is interactive (default strategy)
<Script src="https://example.com/analytics.js" strategy="afterInteractive" />

// Not needed until the browser is idle: chat widgets, social embeds, heatmaps
<Script src="https://example.com/chat.js" strategy="lazyOnload" />
```

- `beforeInteractive` is for the rare script that must run before hydration (bot detection,
  consent managers). It blocks; avoid it otherwise.
- Load a script only in the layout or page that needs it, not globally.
- `@next/third-parties` provides tuned components for common services (Google Tag Manager,
  Google Analytics, YouTube and Maps embeds).
- Replace heavy embeds with a facade: show a static thumbnail and load the real player, map or
  chat widget on click.
- Audit regularly. For each third-party script, know who asked for it, what it costs (the
  measurement script lists third-party bytes) and whether it is still used.

## 4. Lazy loading

Split out client code that is not needed for the first paint.

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const RevenueChart = dynamic(() => import('./revenue-chart'), {
  loading: () => <div className="h-72 rounded-lg bg-muted motion-safe:animate-pulse" />,
})

// Browser-only widget: skip server rendering. `ssr: false` is only allowed in Client Components.
const MapView = dynamic(() => import('./map-view'), {
  ssr: false,
  loading: () => <div className="aspect-video rounded-lg bg-muted" />,
})

export function Reports() {
  const [showMap, setShowMap] = useState(false)
  return (
    <>
      <RevenueChart />
      <button type="button" onClick={() => setShowMap(true)}>
        Show map
      </button>
      {showMap ? <MapView /> : null}
    </>
  )
}
```

- Good candidates: modals and drawers, charts, rich-text and code editors, maps, emoji
  pickers, anything behind a click, tab or scroll.
- Poor candidates: anything visible at first paint (it would load later than it does now), and
  small components (a network request costs more than the bytes saved).
- Give the `loading` placeholder the final dimensions, or lazy loading creates layout shift.
- Server Components are already code-split and send no component JavaScript; `dynamic` matters
  for Client Components.
- Load a library on demand inside the handler that needs it:

  ```ts
  async function exportCsv(rows: Row[]) {
    const { unparse } = await import('papaparse')
    download(unparse(rows))
  }
  ```

- Warm up an import on intent (hover or focus on the trigger) so the click feels instant:
  `onPointerEnter={() => void import('./heavy-dialog')}`.

## 5. Bundle analysis

**Turbopack** (default in Next.js 16), version 16.1 and later:

```bash
npx next analyze            # interactive treemap with import chains, per route, client and server
npx next analyze --output   # write to .next/diagnostics/analyze for sharing or diffing
```

**Webpack** builds:

```bash
npm i -D @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
module.exports = withBundleAnalyzer({})
```

```bash
ANALYZE=true npm run build
```

What to look for, on the client bundles of the slow route:

- The biggest rectangles. Is each needed on the client? At first load?
- A library present in the client bundle whose output is static (markdown, syntax
  highlighting, date formatting): move that work to a Server Component.
- The same library twice in different versions (`npm ls <package>`; dedupe or align versions).
- A whole library where one function is used.
- Locale data, polyfills and icon sets shipped in full.
- Shared chunks loaded by every route that contain code only one route needs: usually a
  heavy import in the root layout or a shared provider.

Follow the import chain upward from a large module to the `'use client'` file that pulled it
in; the fix is usually there.

`next build` output also prints per-route first-load JavaScript; watch it in pull requests.

## 6. Config options that affect bundle size

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Automatic memoization; removes most hand-written useMemo/useCallback.
  // Requires babel-plugin-react-compiler to be installed.
  reactCompiler: true,

  experimental: {
    // Import only the used modules from packages with many exports.
    // Many popular libraries are already optimised by default; add the ones that are not.
    optimizePackageImports: ['@acme/icons', '@acme/ui'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'images.example.com' }],
  },
}

export default nextConfig
```

- `serverExternalPackages` keeps listed packages out of the server bundle (native modules,
  packages that break when bundled). It affects server build size and cold starts, not the
  client.
- Keep `browserslist` modern. Targeting very old browsers adds transforms and polyfills.
- Remove unused dependencies and dead feature flags; tree-shaking cannot drop code with side
  effects.

## 7. Data fetching, streaming and caching

Sequential (slow):

```tsx
const user = await getUser()
const orders = await getOrders() // waits for getUser although it does not depend on it
```

Parallel:

```tsx
const [user, orders] = await Promise.all([getUser(), getOrders()])
```

Streaming: the shell and fast content paint first, the slow region arrives when ready.

```tsx
export default function Page() {
  return (
    <>
      <PageHeader />
      <Suspense fallback={<OrdersSkeleton />}>
        <Orders />
      </Suspense>
    </>
  )
}
```

- A route-level `loading.tsx` wraps the page in Suspense automatically and makes navigation
  feel instant.
- A fetch high in the tree blocks everything below it. Move the `await` into the component
  that needs the data and give it its own boundary.
- When a child needs data that depends on a parent's result, start the child's fetch as soon as
  its input is known rather than after the parent finishes rendering.
- Deduplicate within a request by wrapping the fetcher in React's `cache()`.
- Do not fetch your own Route Handlers from Server Components; call the function directly.
- Client-side fetching (SWR, TanStack Query) is for data that changes after load without a
  navigation. Seed it from the server where possible to avoid a spinner on first paint.

Caching depends on version and configuration:

- **`cacheComponents: true`** (Next.js 16): routes prerender to a static shell. Cache a function
  or component with the `'use cache'` directive plus `cacheLife()` and `cacheTag()`. Anything
  that reads `cookies()`, `headers()`, `searchParams`, or uncached data must be inside
  `<Suspense>` and streams at request time; an error at build time tells you when it is not.
- **Without it**: caching is controlled per `fetch` and by route segment config.

Read `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and
`09-revalidating.md` before writing caching code, and prefer the project's existing pattern.

## 8. Navigation and prefetching

- `<Link>` prefetches routes as they enter the viewport, so navigation is near-instant. Keep
  it on for primary navigation. Turn it off (`prefetch={false}`) for long lists of links to
  expensive pages.
- Layouts persist across navigation and do not re-render; put shared chrome there.
- Give every dynamic route a `loading.tsx` or Suspense boundary so a navigation shows
  feedback immediately.
- Use `useLinkStatus` or a transition to show pending state on slow navigations.
- Avoid full-page reloads (`<a>` to an internal route, `window.location`) inside the app.

## 9. Checklist

- [ ] Measured on a production build with CPU and network throttling.
- [ ] LCP element identified; it is server-rendered, eager-loaded, high priority and correctly sized.
- [ ] Every `next/image` that is not fixed-size has an accurate `sizes`.
- [ ] No images or embeds without reserved dimensions.
- [ ] Fonts through `next/font`; one or two families; variable or minimal weights.
- [ ] `'use client'` boundaries are at the leaves; heavy rendering libraries run on the server.
- [ ] Below-the-fold and on-demand client code is lazy-loaded with sized placeholders.
- [ ] Bundle analysed; no duplicate or wholesale-imported libraries.
- [ ] Third-party scripts load through `next/script` with a deferred strategy, and each is justified.
- [ ] Independent data fetches run in parallel; slow regions stream behind Suspense.
- [ ] Routes that can be static are prerendered; cacheable data is cached.
- [ ] Long lists are paginated or virtualized.
- [ ] Field data is being collected, and results are compared at the 75th percentile.
