# React rendering performance

Re-rendering is how React works, and most re-renders are cheap. Optimise rendering only when a
measurement shows it is the problem: an interaction with a long rendering phase, or visible lag
while typing, dragging or scrolling.

## Contents

1. Find what is slow
2. Structural fixes first
3. The React Compiler
4. Manual memoization
5. Keeping interactions responsive
6. Long lists
7. Context
8. Hydration cost
9. Things that look like optimisations and are not

## 1. Find what is slow

- **React DevTools Profiler**: record the slow interaction. The flame graph shows which
  components rendered and how long each took; "Why did this render?" names the changed prop,
  state or hook. Start from the widest bars.
- **Chrome DevTools Performance panel**: record with CPU throttling. Look for long tasks around
  the interaction, and whether time goes to scripting (React rendering, handlers) or to
  rendering and painting (style, layout).
- **The measurement script** with `--interact <selector>` splits a click into input delay,
  handler time and rendering time.
- Profile a production build (`next build --profile` enables the Profiler in production);
  development mode double-invokes renders and effects and is much slower.

Two different problems look alike:

- **One slow component**: a single render does expensive work (a big computation, thousands of
  elements). Fix the work.
- **Too many components**: a small state change re-renders a large tree. Fix the structure.

## 2. Structural fixes first

These remove re-renders without memoization and usually make the code simpler.

**Move state down.** State at the top of a page re-renders the page on every change.

```tsx
// Before: typing re-renders ExpensiveTree
function Page() {
  const [query, setQuery] = useState('')
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveTree />
    </>
  )
}

// After: only SearchBox re-renders
function Page() {
  return (
    <>
      <SearchBox />
      <ExpensiveTree />
    </>
  )
}
```

**Pass content as children.** Elements created by a parent that did not re-render keep their
identity, so React skips them.

```tsx
function ScrollTracker({ children }: { children: ReactNode }) {
  const [y, setY] = useState(0)
  // ...subscribe to scroll...
  return <div data-scrolled={y > 0}>{children}</div> // children do not re-render when y changes
}
```

**Derive instead of syncing.** State copied from props with an effect renders twice and can
drift out of date. Compute it during render.

**Keep high-frequency values out of React state.** Pointer position, scroll offset and
animation progress change every frame. Use a ref and write to the DOM or a CSS variable
directly, or use CSS (`position: sticky`, scroll-driven animations, `:hover`).

**Split components along change boundaries.** The part that changes often becomes its own
component so the rest stays still.

**Server Components do not re-render on the client at all.** Anything moved out of a client
component is removed from this problem entirely.

## 3. The React Compiler

With `reactCompiler: true` in `next.config` (and `babel-plugin-react-compiler` installed), the
compiler memoizes components and values automatically at build time.

- Write plain code. Do not add `useMemo`, `useCallback` or `memo`; existing ones can stay but
  new ones are noise.
- The compiler relies on the Rules of React: components and hooks must be pure, props and
  state must not be mutated, hooks must not be called conditionally. Code that breaks the rules
  is skipped rather than miscompiled, so a component that is unexpectedly slow may have been
  skipped. The `eslint-plugin-react-hooks` rules report these cases.
- It does not fix structural problems: a context that changes every render, state held too
  high, or a list of ten thousand rows.
- Check the project's config before assuming either way.

## 4. Manual memoization

Without the compiler, memoize for a measured reason.

- `memo(Component)` skips re-rendering when props are shallowly equal. It only helps if the
  props really are stable: an inline object, array or function prop defeats it.
- `useMemo` for an expensive calculation (measure it: over about a millisecond), or to keep an
  object's identity stable for a memoized child or an effect dependency.
- `useCallback` only for a function passed to a memoized child or used as an effect dependency.

```tsx
const Row = memo(function Row({ item, onSelect }: RowProps) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>
})

function List({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const onSelect = useCallback((id: string) => setSelected(id), [])
  return (
    <ul>
      {items.map((item) => (
        <Row key={item.id} item={item} onSelect={onSelect} />
      ))}
    </ul>
  )
}
```

Memoization has a cost (comparison, memory, and code that is harder to change). Remove any
that does not pay for itself.

## 5. Keeping interactions responsive

Not all updates are equally urgent. Typing must show immediately; the filtered results can
follow.

```tsx
'use client'

import { useDeferredValue, useMemo, useState } from 'react'

export function FilterableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const isStale = query !== deferredQuery

  const visible = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(deferredQuery.toLowerCase())),
    [items, deferredQuery],
  )

  return (
    <>
      <label htmlFor="filter">Filter</label>
      <input id="filter" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul aria-busy={isStale} className={isStale ? 'opacity-60 transition-opacity' : undefined}>
        {visible.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </>
  )
}
```

- `useDeferredValue(value)`: React renders with the old value first, then re-renders with the
  new one in the background, abandoning that work if the value changes again.
- `useTransition`: wrap a state update that causes heavy rendering or navigation
  (`startTransition(() => setTab(next))`). The UI stays interactive and `isPending` drives a
  pending indicator.
- `useOptimistic`: show the expected result immediately while a Server Function runs.
- Debounce network requests triggered by typing. Do not debounce the input itself.

Transitions keep the page responsive; they do not make the render cheaper. If the deferred
render takes seconds, reduce the work as well.

## 6. Long lists

In order of preference:

1. **Show less.** Paginate or use "load more", with filtering and sorting on the server.
2. **`content-visibility: auto`** on rows or sections with `contain-intrinsic-size`. The
   browser skips layout and paint for off-screen items while keeping them in the DOM, so
   find-in-page and accessibility still work.
3. **Virtualize** (`@tanstack/react-virtual` or the project's library) when thousands of rows
   must be scrollable in one view. Only visible rows are in the DOM.

Virtualization costs: find-in-page does not see unrendered rows, screen readers need
`aria-rowcount` / `aria-setsize`, focus can be lost when a row scrolls out, and row heights
need measuring. Do not virtualize a list of fifty items.

Also: stable `key`s, no index keys on reorderable lists, and no inline component definitions
inside the map.

## 7. Context

Every consumer of a context re-renders when its value changes.

- Give the provider a stable value. An object literal created during render is new every time:
  memoize it, or let the compiler do so.
- Split contexts by how often they change: a rarely changing `user` and a frequently changing
  `notifications` should not share one.
- Separate state and dispatch into two contexts so components that only dispatch do not
  re-render on state changes.
- For frequently changing shared state, use a store with selectors (`useSyncExternalStore`, or
  the project's state library) so components subscribe to the slice they read.
- Keep providers low in the tree, around the subtree that needs them.

## 8. Hydration cost

On first load, React hydrates every Client Component: it downloads, parses and executes their
code and attaches handlers. This is main-thread work during load and is a common cause of high
TBT and poor early INP.

- Fewer and smaller Client Components. A page that is mostly static content should be mostly
  Server Components.
- Lazy-load client components that are not visible at first (`next/dynamic`).
- Do not pass large data structures as props to Client Components; they are serialised into
  the HTML and parsed again.
- Suspense boundaries let React hydrate regions independently and prioritise the one the user
  interacts with.
- Fix hydration mismatches: a mismatch makes React discard and re-render that subtree on the
  client.

## 9. Things that look like optimisations and are not

- Wrapping everything in `memo` / `useMemo` / `useCallback` without measuring.
- `memo` on a component that receives `children` or inline objects (the props change every
  time anyway).
- Replacing state with refs to avoid renders, then finding the UI does not update.
- Debouncing an input's own value.
- Moving code into a client-side `useEffect` fetch to "make the page load faster": the HTML
  arrives sooner and the content later.
- Virtualizing short lists.
- Micro-optimising a render that takes 2 ms while a 400 kB library loads on the same page.
