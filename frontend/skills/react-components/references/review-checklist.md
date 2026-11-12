# Component review checklist

Use when reviewing a component or a diff. Report findings ordered by impact, each with the file
and line, what goes wrong for a user or maintainer, and a concrete fix. Skip style nits the
project's formatter or linter already enforces.

## Correctness

- [ ] No hooks called conditionally, in loops, or after an early return.
- [ ] Effect dependency arrays are complete; no disabled `react-hooks` lint rules.
- [ ] Every effect that subscribes, sets a timer or starts async work has a cleanup or a race
      guard.
- [ ] No state that mirrors a prop or other state (`useState(props.x)` followed by a sync effect).
- [ ] List keys are stable ids, not indexes on a mutable list and not generated during render.
- [ ] No component defined inside another component's body.
- [ ] State updates that depend on the previous value use the updater form.
- [ ] No direct mutation of state, props or objects held in state.
- [ ] Render output does not depend on `window`, time or randomness (hydration mismatch).

## Server and client boundary

- [ ] `'use client'` appears only where state, effects, handlers or browser APIs are used.
- [ ] The boundary sits at the lowest practical component; large static subtrees are not pulled
      into the client bundle by a top-level directive.
- [ ] Props crossing the boundary are serializable and limited to what the client renders.
- [ ] Data is fetched on the server; no `useEffect` + `fetch` for data known at request time.
- [ ] Independent fetches run in parallel.
- [ ] Server Functions validate input and check authorization themselves.
- [ ] Server-only modules (database, secrets) cannot be imported by client files.
- [ ] `params`, `searchParams`, `cookies()` and `headers()` are awaited (current Next.js).

## API design

- [ ] Props extend the underlying element's props and the rest are spread onto it.
- [ ] `className` is accepted and merged; `ref` reaches the DOM node.
- [ ] No cluster of booleans that would be clearer as `children`, slots or a `variant` union.
- [ ] Mutually exclusive props are a discriminated union.
- [ ] Controlled/uncontrolled naming follows `value` / `defaultValue` / `onValueChange`.
- [ ] Defaults are declared in the destructuring, not scattered through the body.

## States and resilience

- [ ] Loading, empty, error and success states all render something deliberate.
- [ ] Long text, missing optional data and large lists do not break the layout.
- [ ] Async regions sit under a `<Suspense>` boundary with a fallback matching the final size.
- [ ] Errors are caught by an error boundary (`error.tsx`) or handled inline.
- [ ] Pending mutations disable or mark the trigger and prevent double submission.

## Accessibility (quick pass; see the `accessibility` skill for depth)

- [ ] Interactive elements are `<button>`, `<a href>` or form controls, not clickable `<div>`s.
- [ ] Every control has an accessible name; icon-only buttons have `aria-label`.
- [ ] Focus is visible, and focus moves sensibly when content appears or disappears.
- [ ] Form inputs have labels, and errors are tied to inputs with `aria-describedby`.

## Performance (quick pass; see the `web-performance` skill for depth)

- [ ] No heavy library imported into a client component when the work could run on the server.
- [ ] No hand-written `useMemo`/`useCallback` where the React Compiler is enabled; without the
      compiler, memoization is justified by a measured cost.
- [ ] Images use `next/image` with correct `sizes`; fonts use `next/font`.
- [ ] Large below-the-fold or rarely used client code is loaded lazily.

## TypeScript

- [ ] No `any`, no non-null assertions hiding a real possibility of `undefined`.
- [ ] External data is validated before it is trusted.
- [ ] Types are derived (`ComponentProps<typeof X>`, `typeof values[number]`) instead of duplicated.
