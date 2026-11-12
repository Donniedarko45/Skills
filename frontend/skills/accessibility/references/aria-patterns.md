# Widget patterns

Roles, states and keyboard behaviour for common widgets, following the WAI-ARIA Authoring
Practices. Prefer a headless library component (Radix, Base UI, React Aria) where the project
has one: these patterns are what such libraries implement. Use this file to hand-build the
simple ones, to review custom code, and to check that a library component is wired correctly.

## Contents

1. Disclosure (show/hide)
2. Accordion
3. Modal dialog
4. Tabs
5. Menu button (actions menu)
6. Site navigation (not a menu)
7. Combobox / autocomplete
8. Listbox / custom select
9. Tooltip
10. Toast and status messages
11. Switch
12. Sortable data table
13. Carousel
14. Visually hidden text and skip link
15. Roving tabindex helper

## 1. Disclosure (show/hide)

A button that toggles a region. The simplest pattern and the base of several others.

- Trigger: `<button aria-expanded={open} aria-controls={panelId}>`.
- Panel: any element with that `id`. Remove it from the DOM or use the `hidden` attribute when
  closed, so its contents are not focusable.
- Keyboard: Enter/Space toggle (free with `<button>`).

```tsx
'use client'
import { useId, useState, type ReactNode } from 'react'

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        {summary}
      </button>
      <div id={panelId} hidden={!open}>
        {children}
      </div>
    </div>
  )
}
```

Native `<details>`/`<summary>` gives this with no JavaScript and is a good default.

## 2. Accordion

A set of disclosures with headings.

- Each header is a heading element containing a button: `<h3><button aria-expanded aria-controls>`.
- Each panel: `role="region"` with `aria-labelledby` pointing at its button (skip the region
  role when there are many panels, to avoid landmark clutter).
- Keyboard: Enter/Space toggle. Optional: Down/Up arrows move between headers, Home/End jump to
  first/last.
- Decide whether one or many panels can be open, and do not force-close a panel the user is
  reading without reason.

## 3. Modal dialog

- Container: `role="dialog"` and `aria-modal="true"` (both implied by `<dialog>` opened with
  `showModal()`), `aria-labelledby` pointing at the title, `aria-describedby` at the description
  when there is one.
- On open: focus moves inside, to the first meaningful control, or to the title/container
  (`tabIndex={-1}`) when the content is long and should be read from the top. For destructive
  confirmations, focus the least destructive action.
- While open: Tab and Shift+Tab cycle within the dialog; content behind is inert and hidden
  from assistive technology; background scroll is locked.
- Escape closes. A visible close button exists.
- On close: focus returns to the element that opened it.
- Use `role="alertdialog"` when the dialog interrupts with something that must be answered.

Native `<dialog>` handles focus trapping, inertness, Escape and the top layer:

```tsx
'use client'
import { useEffect, useRef, type ReactNode } from 'react'

type ModalProps = { open: boolean; onClose: () => void; title: string; children: ReactNode }

export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title" className="backdrop:bg-black/50">
      <h2 id="modal-title">{title}</h2>
      {children}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </dialog>
  )
}
```

`showModal()` restores focus to the previously focused element on close. Generate the title id
with `useId` when more than one modal can exist. A non-modal panel (a popover, a non-blocking
drawer) must not trap focus or set `aria-modal`.

## 4. Tabs

- Container: `role="tablist"` with `aria-label` or `aria-labelledby`;
  `aria-orientation="vertical"` if vertical.
- Each tab: `<button role="tab" aria-selected aria-controls={panelId} id={tabId}>`. Only the
  selected tab has `tabIndex={0}`; the others have `tabIndex={-1}`.
- Each panel: `role="tabpanel" aria-labelledby={tabId}`, with `tabIndex={0}` if it contains no
  focusable content.
- Keyboard: Left/Right (Up/Down when vertical) move between tabs and wrap; Home/End go to
  first/last; Tab moves from the selected tab into the panel.
- Activation: selecting on focus is fine when panels render instantly; require Enter/Space
  when switching is slow or triggers a fetch.

If the "tabs" navigate between URLs, they are links: use a `<nav>` with links and
`aria-current="page"` instead of tab roles.

## 5. Menu button (actions menu)

For a list of actions ("Edit, Duplicate, Delete"), not for navigation.

- Trigger: `<button aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}>`.
- Popup: `role="menu"`; items are `role="menuitem"` (or `menuitemcheckbox` / `menuitemradio`),
  with `role="separator"` between groups.
- Opening moves focus to the first item (or the last, when opened with Up arrow).
- Keyboard: Down/Up move and wrap; Home/End; typing a letter jumps to a matching item;
  Enter/Space activates and closes; Escape closes and returns focus to the trigger; Tab closes.
- Items are not in the Tab order; the menu manages focus with roving tabindex or
  `aria-activedescendant`.
- Disabled items stay focusable with `aria-disabled="true"`.

This is a lot to get right. Use the library's `DropdownMenu`.

## 6. Site navigation (not a menu)

Navigation is a list of links, not `role="menu"`.

```tsx
<nav aria-label="Main">
  <ul>
    <li>
      <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
        Home
      </Link>
    </li>
    <li>
      <button type="button" aria-expanded={open} aria-controls="products-submenu">
        Products
      </button>
      <ul id="products-submenu" hidden={!open}>
        <li><Link href="/products/analytics">Analytics</Link></li>
      </ul>
    </li>
  </ul>
</nav>
```

- Dropdown sections are disclosures (section 1): a button with `aria-expanded`, links in normal
  Tab order, Escape closes.
- A mobile nav drawer is a modal dialog (section 3) containing the same `<nav>`.
- Mark the current page with `aria-current="page"` and style from that attribute.
- Do not open submenus on hover only; hover must have a keyboard and touch equivalent.

## 7. Combobox / autocomplete

An input with a popup list of suggestions.

- Input: `role="combobox"`, `aria-expanded`, `aria-controls={listId}`,
  `aria-autocomplete="list"`, and `aria-activedescendant={activeOptionId}` while an option is
  highlighted. DOM focus stays on the input the whole time.
- Popup: `role="listbox"`; options are `role="option"` with `aria-selected` and unique `id`s.
- Keyboard: Down/Up move the highlight (Down opens the list when closed); Enter selects;
  Escape closes the list, and clears the input if already closed; Home/End move the text cursor.
- Announce the result count in a `role="status"` region ("5 results"), and the empty state.
- The input still needs a visible label.

Hard to build correctly, especially with async results. Use the library component, or a native
`<input list>` with `<datalist>` for simple cases.

## 8. Listbox / custom select

Use a native `<select>` unless the design truly cannot be met: it is accessible, works on every
device and gets the platform picker on mobile.

If custom:

- Trigger: `<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls>`
  showing the current value, with a label.
- Popup: `role="listbox"`, options `role="option"` with `aria-selected`.
- Keyboard: Down/Up move; Home/End; type-ahead; Enter/Space select; Escape closes and returns
  focus to the trigger.
- Multi-select: `aria-multiselectable="true"`; Space toggles the focused option.

## 9. Tooltip

- For supplementary text only. Never put essential information or interactive content in a
  tooltip; if it has links or buttons, it is a popover or dialog.
- Trigger: a focusable element with `aria-describedby={tooltipId}`. Tooltip: `role="tooltip"`.
- Shows on hover **and** on keyboard focus; hides on Escape, on blur and on pointer leave; stays
  visible while the pointer is over the tooltip itself.
- An icon-only button's name comes from `aria-label`, not from its tooltip.
- Touch devices have no hover: make sure nothing is available only by tooltip.

## 10. Toast and status messages

```tsx
// Rendered once, near the root, and always present in the DOM
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {message}
</div>
```

- `role="status"` (polite) waits for the screen reader to finish; use it for confirmations and
  counts. `role="alert"` (assertive) interrupts; reserve it for errors needing immediate
  attention.
- The live region must be mounted before the message is set. A region inserted together with
  its text is often not announced.
- Do not move focus to a toast. If it contains an action (Undo), provide a keyboard route to it
  and keep the same action available elsewhere.
- Do not auto-dismiss in under about 5 seconds; pause the timer on hover and focus; errors stay
  until dismissed.
- Search and filter results: announce "12 results" in a status region after the update.

## 11. Switch

- `<button role="switch" aria-checked={on}>` with a visible label (or `aria-labelledby`), or a
  native `<input type="checkbox" role="switch">` with a `<label>`.
- Keyboard: Space toggles (Enter too for the button version).
- The label stays the same in both states ("Email notifications"), and the state is conveyed by
  `aria-checked`. Do not swap the label between "On" and "Off".
- A switch takes effect immediately. If the change applies on form submit, use a checkbox.
- The on and off states must be distinguishable without colour (thumb position, an icon).

## 12. Sortable data table

- Use a real `<table>` with `<caption>`, `<th scope="col">` and `<th scope="row">`.
- A sortable column header contains a button: `<th aria-sort="ascending"><button>Name</button></th>`.
  Set `aria-sort` (`ascending` / `descending`) only on the currently sorted column and omit it
  elsewhere.
- Announce the change ("Sorted by name, ascending") in a status region.
- Row actions get distinct names: `aria-label={`Edit ${row.name}`}`.
- Row selection uses a checkbox in the first cell with a label naming the row, and a
  "select all" checkbox in the header.
- Pagination is a `<nav aria-label="Pagination">` with `aria-current="page"` on the current page.

An interactive grid with arrow-key cell navigation (`role="grid"`) is a different, much heavier
pattern. Use it only for spreadsheet-like editing, and use a library.

## 13. Carousel

- Container: `<section aria-roledescription="carousel" aria-label="Featured products">`.
- Each slide: `role="group" aria-roledescription="slide" aria-label="2 of 5"`.
- Previous and Next are buttons with names. Slide pickers are buttons with names such as
  "Slide 2", with `aria-current="true"` (or `aria-disabled`) on the active one.
- Auto-rotation needs a visible pause button, stops on hover and on keyboard focus, and is off
  for users who prefer reduced motion.
- Slides that are off-screen must not be focusable (`inert` or `hidden`).
- Consider whether a carousel is needed: a horizontally scrollable list (`overflow-x-auto` with
  `scroll-snap`) is simpler and natively accessible.

## 14. Visually hidden text and skip link

Tailwind's `sr-only` hides content visually while keeping it for assistive technology.
`display: none`, `visibility: hidden` and the `hidden` attribute hide it from everyone.

```tsx
<button type="button">
  <TrashIcon aria-hidden />
  <span className="sr-only">Delete invoice 1042</span>
</button>
```

Skip link, first in the body:

```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:ring-2 focus:ring-ring"
>
  Skip to main content
</a>
...
<main id="main" tabIndex={-1}>
```

`tabIndex={-1}` on `<main>` lets the browser move focus there when the skip link is used.

## 15. Roving tabindex helper

For composites where one item is tabbable and arrows move focus (tabs, toolbars, radio-like
groups).

```tsx
import type { KeyboardEvent } from 'react'

export function onRovingKeyDown(
  event: KeyboardEvent<HTMLElement>,
  { orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' } = {},
) {
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[data-roving-item]:not([disabled])'),
  )
  const index = items.indexOf(document.activeElement as HTMLElement)
  if (index === -1) return

  const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
  const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'

  let target: number | undefined
  if (event.key === next) target = (index + 1) % items.length
  else if (event.key === prev) target = (index - 1 + items.length) % items.length
  else if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = items.length - 1
  if (target === undefined) return

  event.preventDefault()
  items[target]?.focus()
}
```

Put `onKeyDown={onRovingKeyDown}` on the container, mark each item with `data-roving-item`, and
give the active item `tabIndex={0}` and the rest `tabIndex={-1}`. In right-to-left layouts,
swap the horizontal arrow directions.
