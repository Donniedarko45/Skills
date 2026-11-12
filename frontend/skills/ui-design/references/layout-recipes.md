# Layout recipes (Tailwind CSS)

Starting points, written with semantic tokens (`bg-background`, `text-muted-foreground`,
`border-border`). Swap in the project's tokens and components. Class names are Tailwind v4;
they also work in v3 unless noted.

## Contents

1. Page container
2. App shell with sidebar
3. Sticky header
4. Responsive card grid
5. Form
6. Data table
7. Stat tiles
8. Hero
9. Empty state
10. Dialog
11. Sidebar + content with container queries
12. Skeletons

## 1. Page container

```tsx
<main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Projects</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everything your team is working on.</p>
    </div>
    <div className="flex shrink-0 gap-2">{/* actions */}</div>
  </header>
  <div className="mt-8 space-y-8">{/* sections */}</div>
</main>
```

Reading-focused pages use a narrower column: `max-w-prose` or `max-w-3xl`.

## 2. App shell with sidebar

Sidebar is fixed on desktop and becomes a drawer on mobile. The content area is the scroll
container, so the sidebar and header stay put.

```tsx
<div className="grid min-h-dvh lg:grid-cols-[16rem_1fr]">
  <aside className="hidden border-r border-border bg-muted/30 lg:block">
    <nav aria-label="Main" className="sticky top-0 flex h-dvh flex-col gap-1 overflow-y-auto p-3">
      {/* nav links; current link gets aria-current="page" */}
    </nav>
  </aside>

  <div className="flex min-w-0 flex-col">
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      {/* mobile menu button (lg:hidden), breadcrumbs, user menu */}
    </header>
    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{/* page */}</main>
  </div>
</div>
```

`min-w-0` on the content column stops wide children (tables, code blocks) from stretching the
grid. On mobile, render the same nav inside a dialog-based drawer so focus is trapped and
Escape closes it.

## 3. Sticky header

```tsx
<header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
    {/* logo, nav, actions */}
  </div>
</header>
```

A sticky header covers anchor targets and focused elements. Add `scroll-pt-16` (header height
plus a little) to `<html>` so in-page links and keyboard focus are not hidden underneath.

## 4. Responsive card grid

No breakpoints: columns appear as space allows.

```tsx
<ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
  {items.map((item) => (
    <li key={item.id} className="flex flex-col rounded-lg border border-border bg-card p-4">
      <h3 className="font-medium">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-auto pt-4">{/* footer pinned to the bottom */}</div>
    </li>
  ))}
</ul>
```

`flex flex-col` with `mt-auto` on the footer keeps footers aligned across cards of different
content length. Use `auto-fit` instead of `auto-fill` if a few cards should stretch to fill the
row.

A fully clickable card: put one real link in the heading and stretch it over the card, so there
is a single focusable link with a good name.

```tsx
<li className="relative rounded-lg border border-border p-4 focus-within:ring-2 focus-within:ring-ring hover:bg-muted/50">
  <h3 className="font-medium">
    <Link href={item.href} className="outline-none after:absolute after:inset-0">
      {item.title}
    </Link>
  </h3>
  ...
</li>
```

## 5. Form

Single column, labels above inputs, grouped by meaning. One column is faster to complete and
works at every width; use two only for short related fields (first/last name, city/postcode).

```tsx
<form className="max-w-xl space-y-8">
  <fieldset className="space-y-4">
    <legend className="text-base font-semibold">Profile</legend>

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <label htmlFor="first" className="text-sm font-medium">First name</label>
        <input id="first" name="first" autoComplete="given-name" className="h-10 rounded-md border border-input bg-background px-3 text-base sm:text-sm" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="last" className="text-sm font-medium">Last name</label>
        <input id="last" name="last" autoComplete="family-name" className="h-10 rounded-md border border-input bg-background px-3 text-base sm:text-sm" />
      </div>
    </div>

    <div className="grid gap-1.5">
      <label htmlFor="email" className="text-sm font-medium">Email</label>
      <input id="email" name="email" type="email" autoComplete="email" aria-describedby="email-hint" className="h-10 rounded-md border border-input bg-background px-3 text-base sm:text-sm" />
      <p id="email-hint" className="text-sm text-muted-foreground">Used for sign-in and receipts.</p>
    </div>
  </fieldset>

  <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
    <button type="button" className="...ghost">Cancel</button>
    <button type="submit" className="...primary">Save changes</button>
  </div>
</form>
```

- `text-base sm:text-sm` on inputs keeps the font at 16px on phones, which prevents iOS zoom.
- Size inputs to their expected content: a postcode field should not span the full width.
- Put the primary action last in the row, on the trailing edge, and label it with the outcome
  ("Save changes", "Create project"), not "Submit".
- Error text goes directly under its field, in the destructive colour, with an icon.

## 6. Data table

```tsx
<div className="overflow-x-auto rounded-lg border border-border">
  <table className="w-full min-w-[40rem] text-sm">
    <caption className="sr-only">Invoices</caption>
    <thead className="bg-muted/50 text-left text-muted-foreground">
      <tr>
        <th scope="col" className="px-4 py-3 font-medium">Invoice</th>
        <th scope="col" className="px-4 py-3 font-medium">Customer</th>
        <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
        <th scope="col" className="px-4 py-3 font-medium">Status</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      {rows.map((row) => (
        <tr key={row.id} className="hover:bg-muted/40">
          <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap">{row.number}</th>
          <td className="max-w-64 truncate px-4 py-3">{row.customer}</td>
          <td className="px-4 py-3 text-right tabular-nums">{row.amount}</td>
          <td className="px-4 py-3">{/* badge with text, not colour alone */}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

- Left-align text, right-align numbers, and use `tabular-nums`.
- The wrapper scrolls horizontally; the page does not.
- Row dividers are enough. Full grid lines and zebra stripes together are too much.
- Keep row height comfortable (about 44-52 px) and consistent.
- On narrow screens with many columns, consider a stacked card list instead
  (`hidden md:table` for the table, `md:hidden` for the cards).

## 7. Stat tiles

```tsx
<dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
  {stats.map((stat) => (
    <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{stat.label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</dd>
      <dd className="mt-1 text-xs text-muted-foreground">{stat.delta} vs last month</dd>
    </div>
  ))}
</dl>
```

The value is the content, so it is the largest and darkest element; the label is small and muted.

## 8. Hero

```tsx
<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
  <div className="max-w-2xl">
    <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
      Ship changes without breaking production
    </h1>
    <p className="mt-6 text-lg leading-relaxed text-pretty text-muted-foreground">
      One sentence that says what the product does and for whom.
    </p>
    <div className="mt-8 flex flex-wrap gap-3">
      <a className="...primary" href="/signup">Start free</a>
      <a className="...ghost" href="/docs">Read the docs</a>
    </div>
  </div>
</section>
```

Left-aligned heroes are easier to read and leave room for a product visual on the right
(`lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center`). Centre the hero only when the copy is
short. If the hero image is the largest element above the fold, load it eagerly with high fetch
priority (see the `web-performance` skill).

## 9. Empty state

```tsx
<div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
  <FolderIcon aria-hidden className="size-10 text-muted-foreground" />
  <h2 className="mt-4 text-base font-semibold">No projects yet</h2>
  <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
    Projects group your deployments and settings. Create one to get started.
  </p>
  <button type="button" className="mt-6 ...primary">New project</button>
</div>
```

Say what would be here, why it is empty, and give the action that fills it. A filtered list with
no matches is a different empty state: offer "Clear filters" instead.

## 10. Dialog

Build on the project's dialog primitive (Radix, Base UI, React Aria or native `<dialog>`). Do
not hand-roll focus trapping.

```tsx
<DialogContent className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg">
  <DialogTitle className="text-lg font-semibold">Delete project?</DialogTitle>
  <DialogDescription className="mt-2 text-sm text-muted-foreground">
    This removes "Acme Web" and its 14 deployments. It cannot be undone.
  </DialogDescription>
  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <DialogClose className="...ghost">Cancel</DialogClose>
    <button type="button" className="...destructive">Delete project</button>
  </div>
</DialogContent>
```

- Widths: about `max-w-sm` for confirmations, `max-w-md`/`max-w-lg` for forms. On small screens,
  go near full width or use a bottom sheet.
- Name the consequence in the title and the action in the button. "Are you sure?" with "OK" tells
  the user nothing.
- `flex-col-reverse` puts the primary action on top on mobile, where it is easiest to reach, and
  on the trailing edge on desktop.
- Long content scrolls inside the dialog body (`max-h-[85dvh] overflow-y-auto`), with the title
  and actions fixed.

## 11. Sidebar + content with container queries

A component that changes layout based on the space it is given, wherever it is placed.

```tsx
<article className="@container rounded-lg border border-border">
  <div className="flex flex-col gap-4 p-4 @md:flex-row @md:items-center">
    <div className="aspect-video w-full rounded-md bg-muted @md:w-48" />
    <div className="min-w-0">
      <h3 className="truncate font-medium">Title</h3>
      <p className="line-clamp-2 text-sm text-muted-foreground">Description</p>
    </div>
  </div>
</article>
```

Container query variants (`@container`, `@md:`) are built into Tailwind v4. Tailwind v3 needs
the `@tailwindcss/container-queries` plugin.

## 12. Skeletons

Match the shape and size of what will load, so nothing moves when it arrives.

```tsx
<div role="status" aria-label="Loading projects" className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
  {Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="rounded-lg border border-border p-4">
      <div className="h-5 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-3 h-4 w-full rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-2 h-4 w-4/5 rounded bg-muted motion-safe:animate-pulse" />
    </div>
  ))}
</div>
```

Show skeletons for content regions and a small inline spinner for actions (a button that is
saving). Avoid a full-page spinner once the page shell can render.
