---
name: react-components
description: Design, build, refactor and review React components in a Next.js App Router + TypeScript codebase. Use this whenever the task involves writing or changing a component, page, layout or custom hook; deciding between Server and Client Components or where to put "use client"; designing a props API; splitting up a large component; fixing prop drilling, stale state, effect bugs or needless re-renders; or typing components in TypeScript. Use it even when the request is just "add a card / modal / table / form to this page", because the component decisions are where most of the quality comes from.
---

# React components (Next.js App Router + TypeScript)

A component is good when the next person can use it without reading its source: it renders on the
server unless it truly needs the browser, its props read like a native element's, its state lives
in one obvious place, and it has no effects that exist only to keep two pieces of state in sync.

## 1. Read the project before writing

Conventions in the repo outrank the defaults in this skill, because a consistent codebase is worth
more than a locally "better" component. Before writing, check:

- `package.json`: the `next`, `react` and `typescript` versions, the styling approach, and whether a
  component library is present (shadcn/ui, Radix, Base UI, React Aria, MUI).
- `next.config.*`: is `reactCompiler` on? Is `cacheComponents` on? Both change what good code looks like.
- Two or three existing components close to what you are building: file naming, export style,
  how `className` is merged, where types live, how variants are expressed.
- `node_modules/next/dist/docs/`: recent Next.js versions ship their documentation inside the
  package. When an API is version-sensitive (caching, `params`, images, navigation), read the
  relevant page there instead of relying on memory. It matches the installed version exactly.

Reuse an existing component or primitive before creating a new one. Search for it first.

## 2. Server or client?

Every component is a Server Component until a file says `'use client'`. Stay on the server by
default: server components ship no JavaScript, can read data directly, and keep secrets off the
client.

Add `'use client'` only when the component needs one of these:

- state or lifecycle (`useState`, `useReducer`, `useEffect`, `useRef` to a DOM node)
- event handlers (`onClick`, `onChange`, `onSubmit` with client logic)
- browser-only APIs (`window`, `localStorage`, `IntersectionObserver`, media queries)
- a hook from a library that needs any of the above

`'use client'` marks a boundary, and everything that file imports joins the client bundle. So push
the boundary down to the smallest interactive leaf. A page with one "like" button should have a
client `LikeButton`, with the page itself left on the server.

Rules that prevent most boundary bugs:

- **Pass server content through client components as `children`** (or another `ReactNode` prop).
  A client component cannot import a server component, but it can render one it receives.
- **Props that cross the boundary must be serializable**: plain data, JSX, and Server Functions.
  Ordinary functions and class instances cannot cross, so an inline `onClick` passed from a
  server component to a client one is an error.
- **Providers are client components that take `children`**. Put them as deep as they can go, and
  the tree under them stays server-rendered.
- **Fetch on the server** in an `async` component and pass data down. Reach for client-side
  fetching only for data that changes in response to client interaction without a navigation.
- Mark modules that must never reach the browser with `import 'server-only'`.

For worked examples of each rule, read `references/server-client.md`.

## 3. Design the props API

Model the API on the platform. People already know how a `<button>` works.

- **Extend the element you render.** `ComponentProps<'button'>` plus your own props, then spread
  the rest onto the element. This gives `disabled`, `aria-*`, `data-*`, `onClick` and `type` for
  free and stops you from reinventing them one by one.
- **Accept and merge `className`**, last, so callers can adjust layout (margins, width) without a
  new prop. Use the project's `cn()` helper if it has one.
- **`ref` is a regular prop in React 19.** Do not add `forwardRef` in new React 19 code; keep it
  only where the project is still on 18.
- **Prefer composition to configuration.** Three booleans that change what renders
  (`showIcon`, `showFooter`, `compact`) are a sign the component wants `children` or named slots.
  Config props multiply states; composition lets the caller assemble exactly what they need.
- **Make impossible states unrepresentable.** If `href` and `onClick` are mutually exclusive, or a
  `variant` requires another prop, express it as a discriminated union rather than two optionals.
- **Controlled or uncontrolled, never half of each.** Follow the native naming:
  `value` + `onValueChange` (controlled), `defaultValue` (uncontrolled). Support both when the
  component is a reusable input.
- **Name by purpose, not appearance**: `variant="destructive"` over `color="red"`.
- Give boolean props a `false` default so they can be passed bare: `<Button loading>`.

```tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'destructive'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-variant={variant}
      className={cn(buttonStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
```

Composition patterns (slots, compound components, `asChild`, generic list components) are in
`references/patterns.md`.

## 4. Put state in the right place

Work down this list and stop at the first one that fits. Each step down adds cost.

1. **Derive it.** If it can be computed from props or other state, compute it during render.
   No `useState`, no effect. Filtered lists, totals, "is form valid" and "selected item" (store the
   id, look up the item) all belong here.
2. **The URL.** Filters, sort order, pagination, the active tab, an open detail panel: anything
   the user would expect to survive a refresh or be shareable. Read `searchParams` on the server
   (it is a Promise in current Next.js; `await` it) and update with `<Link>` or `router.replace`.
3. **Local `useState`**, in the lowest component that needs it.
4. **Lift it** to the closest common parent, only once two components need it.
5. **`useReducer`** when several values change together or the next state depends on the event
   type. One reducer beats five `useState`s that must stay consistent.
6. **Context** for values many distant components read and that change rarely (theme, locale,
   current user). Context re-renders every consumer on change, so it is a poor fit for fast-moving
   state.
7. **An external store** only when the project already uses one or the above genuinely fall short.

Server data is not client state. Do not copy fetched data into `useState`; render it from props,
and refresh it by revalidating on the server.

To reset a component's state when its identity changes, give it a `key`
(`<Profile key={userId} />`) rather than writing an effect that clears state.

## 5. Effects are a last resort

`useEffect` synchronises React with something outside React: a subscription, a browser API, a
non-React widget. Most other uses are bugs waiting for a second render. Before writing one, check
whether the job is really one of these:

| You want to...                               | Do this instead                                        |
| -------------------------------------------- | ------------------------------------------------------ |
| Compute a value from props/state             | Calculate it during render                             |
| Respond to a user action                     | Put the logic in the event handler                     |
| Reset state when a prop changes              | Use `key`                                              |
| Fetch data for the page                      | Fetch in a Server Component                            |
| Submit a form                                | A Server Function via `action`, with `useActionState`  |
| Tell the parent something changed            | Call the parent's callback in the same event handler   |
| Subscribe to an external store               | `useSyncExternalStore`                                 |

When an effect is right, give it a cleanup, keep its dependency array honest (never silence the
lint rule), and guard against races when it does async work. If the effect needs the latest value
of something without re-running when it changes, use `useEffectEvent` (React 19.2+).

## 6. Async UI

- Wrap anything that waits on data in `<Suspense>` with a fallback that matches the final layout,
  so the page streams and nothing jumps when content arrives. Place boundaries around independent
  regions, so one slow query does not hold back the rest.
- Use `loading.tsx` for a route-level fallback and `error.tsx` (a client component) for a
  route-level error boundary.
- Start independent fetches together (`Promise.all`, or start promises and `await` later) to avoid
  request waterfalls.
- Mutations: Server Functions with `useActionState` for pending and error state, `useOptimistic`
  for instant feedback, `useTransition` to keep the UI responsive during non-urgent updates.
- A client component can unwrap a promise passed from the server with `use(promise)` under a
  Suspense boundary.

## 7. Memoization

If the project has the React Compiler enabled (`reactCompiler: true` in `next.config`), write
plain code and let the compiler memoize. Adding `useMemo`, `useCallback` and `memo` by hand there
is noise.

Without the compiler, memoize after measuring, for one of three reasons: an expensive
calculation, a prop passed to a `memo`-wrapped child, or a dependency of an effect. The cheaper
fixes usually come first: move state down, pass content as `children`, split the component.

## 8. TypeScript

- Type props with a `type` alias (or `interface` if that is the project style). Skip `React.FC`:
  it adds nothing and hides generics.
- `ReactNode` for anything renderable; `ReactElement` only when you need to clone or inspect it.
- Derive types instead of repeating them: `ComponentProps<typeof Button>`, `typeof options[number]`,
  `as const` arrays for union values.
- Type event handlers from the element: `ChangeEvent<HTMLInputElement>`, or let inference do it by
  writing the handler inline.
- No `any`. Use `unknown` and narrow, and validate data that enters from outside (forms, URL,
  `fetch`) with the project's schema library.
- In current Next.js, `params` and `searchParams` are Promises. Type and `await` them; use the
  generated `PageProps<'/route'>` / `LayoutProps<'/route'>` helpers when the project has them.

## 9. Structure and naming

Follow the project. Where it has no opinion:

- One exported component per file, named exports, file name matching the project's case style.
- Colocate what changes together: the component, its sub-parts, its hook, its test.
- Keep reusable primitives (`components/ui/`) separate from feature components that know about
  the domain (`app/(dashboard)/_components/` or `features/billing/`).
- Split a component when it has more than one reason to change, when a part needs to be client-side
  but the rest does not, or when a chunk of JSX needs a name to be understood. Size alone is not a
  reason.
- Extract a custom hook when stateful logic is reused, or when naming it makes the component
  easier to read. A hook that wraps one `useState` adds indirection without value.
- Never define a component inside another component's body: it remounts on every render and
  loses its state.

## 10. Every component has more than one state

Before calling a component finished, make sure it handles what real data does to it: loading,
empty, error, a single item, hundreds of items, very long text, missing optional fields, a
disabled or read-only mode. Then check keyboard use and the accessible name. The `ui-design` and
`accessibility` skills in this plugin cover those in depth.

## Finish

- Run the project's typecheck and lint, and fix what they report.
- Re-read the diff for any `'use client'` that could move lower or be removed.
- Render it. For UI work, run the app and look at the result rather than assuming.
- Say what you built, which decisions were judgment calls (boundary placement, state location),
  and anything left out on purpose.

## Reference files

- `references/server-client.md` - boundary placement, passing server content into client
  components, providers, serialization, data fetching and Server Functions, with examples.
- `references/patterns.md` - slots, compound components, `asChild`/polymorphism, controlled and
  uncontrolled inputs, generic components, discriminated-union props, custom hooks.
- `references/review-checklist.md` - what to look for when reviewing someone else's component.
