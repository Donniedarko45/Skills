# Server and Client Components

Worked examples for the boundary rules in `SKILL.md`. Next.js APIs here move between versions;
when something does not match the installed version, read
`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

## Contents

1. Push the boundary to the leaf
2. Pass server content through a client component
3. Providers
4. What can cross the boundary
5. Fetching data
6. Streaming with Suspense
7. Mutations with Server Functions
8. Browser-only code and hydration mismatches
9. Common errors and what they mean

## 1. Push the boundary to the leaf

Before: the whole page ships to the client because of one interactive control.

```tsx
// app/products/[id]/page.tsx
'use client' // everything below is now client code
```

After: the page stays on the server and only the control is client code.

```tsx
// app/products/[id]/page.tsx  (Server Component)
import { getProduct } from '@/lib/products'
import { AddToCart } from './add-to-cart'

export default async function ProductPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params
  const product = await getProduct(id)

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <AddToCart productId={product.id} />
    </article>
  )
}
```

```tsx
// app/products/[id]/add-to-cart.tsx
'use client'

import { useState } from 'react'

export function AddToCart({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1)
  // ...
}
```

Pass the client component the minimum it needs (`productId`), because every prop is serialized
into the page payload.

## 2. Pass server content through a client component

A client component cannot import a Server Component. It can render one it receives as a prop,
because the server has already rendered it.

```tsx
// components/collapsible.tsx
'use client'

import { useState, type ReactNode } from 'react'

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {title}
      </button>
      {open ? <div>{children}</div> : null}
    </section>
  )
}
```

```tsx
// app/orders/page.tsx  (Server Component)
import { Collapsible } from '@/components/collapsible'
import { OrderHistory } from './order-history' // async Server Component

export default function OrdersPage() {
  return (
    <Collapsible title="Order history">
      <OrderHistory />
    </Collapsible>
  )
}
```

This is the single most useful pattern for keeping bundles small: interactive shells (tabs,
dialogs, accordions, carousels) wrap server-rendered content.

## 3. Providers

Context needs a client component. Make the provider a thin client wrapper that takes `children`,
and render it from a server layout.

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>
}
```

```tsx
// app/layout.tsx  (Server Component)
import { Providers } from './providers'

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Everything inside `children` is still server-rendered. Place a provider around the smallest
subtree that needs it: a provider for one dashboard section belongs in that section's layout.

## 4. What can cross the boundary

| Prop type                                   | Server to client |
| ------------------------------------------- | ---------------- |
| string, number, boolean, null, undefined    | yes              |
| plain objects and arrays of the above       | yes              |
| JSX (`ReactNode`)                           | yes              |
| a Promise (unwrap with `use`)               | yes              |
| a Server Function (`'use server'`)          | yes              |
| `Date`, `Map`, `Set`, typed arrays, BigInt  | yes in React 19  |
| an ordinary function or event handler       | no               |
| a class instance, a component function      | no               |

To give a client component behaviour from the server, pass a Server Function. To give it
behaviour that runs in the browser, define that behaviour inside the client component.

Send only the fields the client renders. Passing a whole database row leaks columns into the
HTML payload and inflates it.

## 5. Fetching data

Fetch in the Server Component that needs the data. Start independent requests together.

```tsx
export default async function Dashboard() {
  const [user, projects] = await Promise.all([getUser(), getProjects()])
  return <DashboardView user={user} projects={projects} />
}
```

When several components need the same data in one request, wrap the fetcher in React's `cache()`
so it runs once, rather than fetching in a parent and drilling the result down.

```ts
import 'server-only'
import { cache } from 'react'

export const getUser = cache(async () => {
  // runs once per request, however many components call it
})
```

Do not call your own Route Handlers from Server Components. Call the underlying function
directly; the extra HTTP hop only adds latency.

Caching differs by version and configuration:

- With `cacheComponents: true`, add the `'use cache'` directive to an async function or component,
  set a lifetime with `cacheLife()`, tag with `cacheTag()`, and wrap anything that reads request
  data (`cookies()`, `headers()`, `searchParams`) or must be fresh in `<Suspense>`. Route segment
  config (`export const revalidate`, `dynamic`, `fetchCache`) is removed in this mode.
- Cache the **data function**, not a component that also reads cookies or headers, so per-user
  output never lands in a shared cache.
- Invalidate by tag when data changes: `updateTag(tag)` inside a Server Action gives
  read-your-own-writes (the next request waits for fresh data); `revalidateTag(tag, 'max')` serves
  stale data while refreshing in the background; `revalidateTag(tag, { expire: 0 })` expires
  immediately from Route Handlers and webhooks. The one-argument `revalidateTag(tag)` is
  deprecated in Next.js 16.
- The default `'use cache'` store is per server instance. With several instances, configure a
  shared `cacheHandlers` store or invalidation reaches only the instance that handled the write.
- Without `cacheComponents`, the older model applies (`fetch` cache options, route segment config).

Read `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` (or
`02-guides/caching-without-cache-components.md`) before writing caching code.

## 6. Streaming with Suspense

Wrap each independently loading region. The static parts render immediately, and each region
streams in when its data is ready.

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </>
  )
}
```

Make each skeleton the same size as the content it stands in for, or the layout shifts when the
content lands.

To let a client component consume server data without blocking the page, pass the promise and
unwrap it with `use`:

```tsx
// server
<Suspense fallback={<Spinner />}>
  <Comments commentsPromise={getComments(postId)} />
</Suspense>
```

```tsx
// client
'use client'
import { use } from 'react'

export function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise)
  return <ul>{comments.map((c) => <li key={c.id}>{c.body}</li>)}</ul>
}
```

## 7. Mutations with Server Functions

```ts
// app/projects/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1).max(80) })

export type FormState = { errors?: { name?: string[] }; message?: string }

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession() // authorize inside every action
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  await db.project.create({ data: { ...parsed.data, ownerId: session.userId } })
  revalidatePath('/projects')
  return { message: 'Project created' }
}
```

```tsx
// app/projects/new-project-form.tsx
'use client'

import { useActionState } from 'react'
import { createProject, type FormState } from './actions'

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createProject, {})

  return (
    <form action={formAction}>
      <label htmlFor="name">Project name</label>
      <input
        id="name"
        name="name"
        required
        aria-invalid={state.errors?.name ? true : undefined}
        aria-describedby={state.errors?.name ? 'name-error' : undefined}
      />
      {state.errors?.name ? <p id="name-error">{state.errors.name[0]}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? 'Creating...' : 'Create project'}
      </button>
      <p role="status">{state.message}</p>
    </form>
  )
}
```

A Server Function is a public HTTP endpoint. Validate its input and check authorization inside
it every time, whatever the page that renders the form already checked.

## 8. Browser-only code and hydration mismatches

Client components still render on the server for the initial HTML. Reading `window`,
`localStorage`, the current time, or a random value during render makes the server HTML differ
from the client's first render.

- Read browser state in an event handler or effect, or with `useSyncExternalStore` and a server
  snapshot.
- For a widget that cannot render on the server at all, load it with `next/dynamic` and
  `{ ssr: false }` from inside a client component, and give it a sized placeholder.
- For values that legitimately differ (a formatted local time), render a stable placeholder on
  the server, or set `suppressHydrationWarning` on that one element.

## 9. Common errors and what they mean

| Error                                                                  | Cause and fix                                                                 |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| "You're importing a component that needs `useState`..."                | A hook is used in a server file. Move the stateful part into a client leaf.   |
| "Event handlers cannot be passed to Client Component props"            | A server component passes a function. Move the handler into the client file.  |
| "Functions cannot be passed directly to Client Components"             | Same cause. Pass data or a Server Function instead.                           |
| "Only plain objects can be passed to Client Components"                | A class instance or ORM model crossed the boundary. Map it to a plain object. |
| Hydration mismatch                                                     | Render output depends on browser state, time or randomness. See section 8.    |
| "async/await is not yet supported in Client Components"                | An `async` client component. Fetch on the server or use `use(promise)`.       |
| Uncached data accessed outside `<Suspense>` (Cache Components)         | Wrap the component in `<Suspense>` or cache it with `'use cache'`.            |
