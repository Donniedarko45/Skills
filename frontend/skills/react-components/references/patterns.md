# Component patterns

Reach for a pattern when the simple version starts to hurt. A component with two props does not
need any of these.

## Contents

1. Slots instead of boolean props
2. Compound components
3. `asChild` and polymorphism
4. Controlled and uncontrolled
5. Discriminated-union props
6. Generic components
7. Custom hooks
8. State machines with `useReducer`
9. Lists, keys and virtualization

## 1. Slots instead of boolean props

Config props grow without limit, and each one doubles the states to test.

```tsx
// Hard to extend: every new need is another prop
<Card title="Revenue" showIcon iconName="chart" showFooter footerText="Updated 2m ago" compact />
```

```tsx
// Composable: the caller assembles what it needs
<Card>
  <CardHeader>
    <ChartIcon aria-hidden />
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>Updated 2m ago</CardFooter>
</Card>
```

Named slots work when there are a fixed few regions:

```tsx
type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  )
}
```

Slots also keep server content on the server: the slot value can be a Server Component even when
the component receiving it is a client one.

## 2. Compound components

Use when several parts share implicit state (tabs, accordion, menu). The parent owns the state
and exposes it through context; the parts read it.

```tsx
'use client'

import { createContext, use, useId, useState, type ReactNode } from 'react'

type TabsContextValue = { value: string; setValue: (v: string) => void; baseId: string }
const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = use(TabsContext)
  if (!ctx) throw new Error('Tabs parts must be rendered inside <Tabs>')
  return ctx
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue)
  const baseId = useId()
  return <TabsContext value={{ value, setValue, baseId }}>{children}</TabsContext>
}

export function TabList({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="tablist" aria-label={label}>
      {children}
    </div>
  )
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const tabs = useTabs()
  const selected = tabs.value === value
  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${tabs.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => tabs.setValue(value)}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const tabs = useTabs()
  if (tabs.value !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${tabs.baseId}-panel-${value}`}
      aria-labelledby={`${tabs.baseId}-tab-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
```

This example omits arrow-key navigation, which real tabs need. For widgets with non-trivial
keyboard behaviour (tabs, menus, comboboxes, dialogs), build on a headless library the project
already uses instead of hand-rolling; see the `accessibility` skill.

`<Context value>` as a provider and `use(Context)` are React 19. On React 18 use
`<Context.Provider>` and `useContext`.

## 3. `asChild` and polymorphism

Sometimes a component's styling and behaviour should apply to a different element: a button that
is really a link. Two approaches:

**`asChild`** (Radix-style): the component merges its props onto its single child.

```tsx
<Button asChild>
  <Link href="/pricing">See pricing</Link>
</Button>
```

Implement it with the project's `Slot` utility (`@radix-ui/react-slot` or equivalent). It keeps
types simple, because the child keeps its own props.

**`as` prop**: `<Text as="h2">`. Fine for text and layout primitives with a small fixed set of
elements. Typing a fully generic `as` prop is costly and slows the type checker; restrict it to a
union (`as?: 'p' | 'span' | 'h1' | 'h2' | 'h3'`).

Pick whichever the codebase already uses. Never render a `<button>` inside an `<a>` or the
reverse; nested interactive elements break keyboard and screen-reader behaviour.

## 4. Controlled and uncontrolled

A reusable input should work both ways. A small hook hides the difference:

```tsx
import { useCallback, useState } from 'react'

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}) {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [current, setValue] as const
}
```

```tsx
type ToggleProps = {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
} & Omit<ComponentProps<'button'>, 'onChange'>

export function Toggle({ pressed, defaultPressed = false, onPressedChange, ...props }: ToggleProps) {
  const [isPressed, setPressed] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })
  return (
    <button type="button" aria-pressed={isPressed} onClick={() => setPressed(!isPressed)} {...props} />
  )
}
```

For plain forms submitted with a Server Function, uncontrolled inputs with `name` and
`defaultValue` are usually enough. Control an input only when the UI must react on every
keystroke.

## 5. Discriminated-union props

Let the compiler reject combinations that make no sense.

```tsx
type LinkButton = { href: string; onClick?: never }
type ActionButton = { href?: never; onClick: () => void }
type Props = (LinkButton | ActionButton) & { children: ReactNode }

export function CardAction({ href, onClick, children }: Props) {
  return href !== undefined ? (
    <Link href={href}>{children}</Link>
  ) : (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}
```

The same idea models async state without contradictory flags:

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

`isLoading`, `isError` and `data` as three separate fields allow eight combinations, most of
them meaningless. The union allows four, all valid, and narrowing gives `data` its type for free.

## 6. Generic components

When a component works over a collection, make the item type a parameter so callers keep their
types in `render` and `onSelect`.

```tsx
type SelectListProps<T> = {
  items: readonly T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onSelect: (item: T) => void
  emptyState?: ReactNode
}

export function SelectList<T>({ items, getKey, renderItem, onSelect, emptyState }: SelectListProps<T>) {
  if (items.length === 0) return <>{emptyState}</>
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>
          <button type="button" onClick={() => onSelect(item)}>
            {renderItem(item)}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

Functions as props mean this component and its caller are both client code. For a
display-only list, a Server Component that maps over the data is simpler.

## 7. Custom hooks

Extract a hook when the same stateful logic appears twice, or when a name makes a component
readable. Rules of thumb:

- Name it for what it gives the caller (`useDebouncedValue`, `useMediaQuery`), not how it works.
- Return a tuple for one value and its setter, an object when there are more than two things.
- Keep hooks free of JSX. A hook that returns elements is a component.
- A hook that touches browser APIs must be safe during server render: read the API in an effect
  or through `useSyncExternalStore` with a server snapshot.

```tsx
import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string, serverFallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  )
}
```

Prefer CSS (media and container queries) to this hook for layout. Use the hook only when
behaviour, not appearance, changes with the viewport.

## 8. State machines with `useReducer`

When "what happens next" depends on "what state are we in", write that down as a reducer. It
makes illegal transitions impossible and gives each change a name.

```tsx
type State =
  | { status: 'editing'; draft: string }
  | { status: 'saving'; draft: string }
  | { status: 'saved'; value: string }
  | { status: 'failed'; draft: string; error: string }

type Action =
  | { type: 'change'; draft: string }
  | { type: 'submit' }
  | { type: 'resolve'; value: string }
  | { type: 'reject'; error: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'change':
      return state.status === 'saving' ? state : { status: 'editing', draft: action.draft }
    case 'submit':
      return state.status === 'editing' || state.status === 'failed'
        ? { status: 'saving', draft: state.draft }
        : state
    case 'resolve':
      return { status: 'saved', value: action.value }
    case 'reject':
      return state.status === 'saving'
        ? { status: 'failed', draft: state.draft, error: action.error }
        : state
  }
}
```

## 9. Lists, keys and virtualization

- Keys identify items across renders. Use a stable id from the data. An array index is only safe
  for a list that never reorders, filters or inserts.
- Do not generate keys during render (`key={Math.random()}`, `key={crypto.randomUUID()}`): every
  render remounts every row.
- Beyond a few hundred rows of non-trivial DOM, paginate on the server first. Virtualize
  (`@tanstack/react-virtual` or the project's choice) when the user truly needs one long scroll.
- Virtualized lists need explicit handling for keyboard navigation, focus retention and
  screen-reader row counts (`aria-rowcount`, `aria-setsize`).
