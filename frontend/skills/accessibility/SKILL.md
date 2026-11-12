---
name: accessibility
description: Build accessible React/Next.js UI and audit existing UI against WCAG 2.2 AA - semantic HTML, keyboard operation, focus management, ARIA, forms, colour contrast, screen-reader behaviour and reduced motion. Use this whenever the user mentions accessibility, a11y, WCAG, ARIA, screen readers, keyboard navigation, focus, contrast, or an accessibility audit or compliance; and also whenever building or changing any interactive widget (dialog, modal, drawer, dropdown, menu, tabs, accordion, combobox, autocomplete, tooltip, toast, carousel, custom select or checkbox), any form, or site navigation, even if accessibility was not mentioned, because these are where accessibility breaks.
---

# Accessibility

Accessible UI is UI that works for people using a keyboard, a screen reader, voice control,
zoom, or a phone in sunlight. Most of it comes free from using the right HTML element. ARIA
exists to fill the gaps HTML leaves, and wrong ARIA is worse than none, because it tells
assistive technology something untrue.

Target WCAG 2.2 level AA unless the project states otherwise.

## The order of operations

Work through these in order when building. Each layer depends on the one before it.

### 1. Use the element that already does the job

| Need                              | Use                                                        |
| --------------------------------- | ---------------------------------------------------------- |
| Go somewhere                      | `<a href>` (in Next.js, `<Link>`)                          |
| Do something                      | `<button type="button">`                                   |
| Submit a form                     | `<button type="submit">` inside `<form>`                   |
| Text entry, choice, toggle        | `<input>`, `<select>`, `<textarea>` with a `<label>`       |
| Page regions                      | `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`       |
| Headings                          | `<h1>`-`<h6>`, in order, one `<h1>` per page               |
| Lists, tables                     | `<ul>`/`<ol>`, `<table>` with `<th scope>` and `<caption>` |
| Modal                             | `<dialog>` with `showModal()`, or a headless Dialog        |
| Show/hide a section               | `<details>`/`<summary>`, or a button with `aria-expanded`  |

A `<div onClick>` is not a button: it has no role, cannot be focused, and ignores Enter and
Space. Replacing it with `<button>` fixes all three. A link without `href` is not a link.

### 2. Give everything a name

Every interactive element and every meaningful image needs an accessible name that makes sense
out of context.

- Visible text is the best name. A button that says "Delete project" needs nothing else.
- Icon-only controls: `aria-label="Close"` on the button, `aria-hidden` on the icon.
- Inputs: a `<label htmlFor>` tied to the input's `id`. A placeholder is not a label; it
  disappears on typing and usually fails contrast.
- Images: `alt` describes what the image conveys in this context. Decorative images get
  `alt=""`. An image that is a link describes the destination.
- Repeated controls need distinct names: "Edit" five times in a table should be
  "Edit invoice 1042" (`aria-label`, or visually hidden text).
- Link text describes the destination. Avoid "click here" and "read more" on their own.
- Regions used more than once get labels: `<nav aria-label="Main">`, `<nav aria-label="Footer">`.
- Each page has a unique, descriptive `<title>` (Next.js `metadata`), and `<html lang>` is set.
  Next.js announces client-side route changes using the title, so the title matters twice.

### 3. Make it work from the keyboard

- Everything that can be clicked can be reached with Tab and activated with Enter or Space.
- Focus order follows reading order. This comes from DOM order; do not use positive `tabIndex`.
  `tabIndex={0}` adds a custom widget to the order; `tabIndex={-1}` makes something focusable
  from script only.
- **Focus is always visible.** Never remove the outline without replacing it. Style
  `:focus-visible` with a ring that has at least 3:1 contrast against its surroundings.
- Composite widgets (tabs, menus, toolbars, radio groups, listboxes) are one Tab stop; arrow
  keys move within them. Escape closes anything that opened.
- No keyboard traps, except the intentional one inside a modal dialog.
- Sticky headers and footers must not cover the focused element (`scroll-padding-top`).
- Provide a "Skip to main content" link as the first focusable element on pages with
  navigation before the content.

### 4. Manage focus when the page changes under the user

- **Opening a dialog** moves focus into it, keeps Tab inside, makes the rest of the page inert,
  and **closing** returns focus to the element that opened it. Native `<dialog>` and headless
  Dialog components do this; hand-rolled modals almost never do.
- **Deleting the focused item** moves focus somewhere sensible: the next item, or the list's
  heading.
- **Revealing content** (accordion, "show more") leaves focus on the trigger; the new content
  comes next in tab order.
- **After a failed form submit**, move focus to the first invalid field or to an error summary.
- Do not move focus on page load or steal it for notifications.

### 5. Add ARIA only where HTML runs out

- No ARIA is better than bad ARIA. Do not add a `role` to an element that already has the right
  one (`<button role="button">`), and do not change native semantics (`<h2 role="button">`).
- A `role` is a promise of behaviour. `role="tab"` promises arrow-key navigation;
  `role="menu"` promises application-menu keyboard handling and is wrong for site navigation.
- State must be kept true: `aria-expanded`, `aria-selected`, `aria-pressed`, `aria-checked`,
  `aria-current`, `aria-invalid`, `aria-busy`, `aria-disabled`.
- Relationships: `aria-controls`, `aria-labelledby`, `aria-describedby` point at real `id`s
  (generate them with `useId`).
- `aria-hidden="true"` must never contain or be a focusable element.
- For anything beyond a disclosure button, follow the pattern in `references/aria-patterns.md`
  or, better, use the project's headless component library (Radix, Base UI, React Aria), which
  implements these patterns and is tested with real assistive technology.

### 6. Forms

- Every field has a visible label. Group related fields with `<fieldset>` and `<legend>` (radio
  groups always).
- Mark required fields in the label text and with `required`.
- Use the right `type`, `inputMode` and `autoComplete` values (`email`, `tel`, `given-name`,
  `one-time-code`, `current-password`, `new-password`). They enable autofill and the right
  mobile keyboard, and autocomplete on personal-data fields is a WCAG requirement.
- Errors: text next to the field, linked with `aria-describedby`, with `aria-invalid="true"` on
  the field. Say what is wrong and how to fix it. Colour and an icon are support, not the message.
- Validate on blur or submit, not on every keystroke before the user has finished typing.
- Announce the result of submission: move focus to an error summary, or put the success message
  in a `role="status"` region.
- Prefer keeping the submit button enabled and explaining what is missing over a disabled
  button with no reason given. Disabled buttons cannot be focused and say nothing.
- Do not block paste in any field, including passwords and one-time codes.

### 7. Colour, size and zoom

- Text contrast at least 4.5:1; large text (24px, or about 19px bold) at least 3:1.
- Non-text contrast at least 3:1: input borders, icons that carry meaning, focus indicators,
  chart elements, the on/off parts of toggles.
- Information is never carried by colour alone: add text, an icon, a pattern or an underline.
  Links inside body text need an underline or another non-colour cue.
- Pointer targets at least 24x24 CSS px (WCAG 2.2 AA); aim for 44x44 on touch.
- The page works at 200% text zoom and reflows at 320 px wide without two-direction scrolling.
  Size text in `rem`, let containers grow, and never set `user-scalable=no` or
  `maximum-scale=1`.
- Content shown on hover is also shown on focus, can be dismissed with Escape, and stays while
  the pointer is over it.

### 8. Changes the user did not cause

- Status messages that do not take focus (saved, 3 results, added to cart, an error toast) go
  in a live region: `role="status"` (polite) for most, `role="alert"` (assertive) only for
  urgent errors. The region must exist in the DOM before its text changes.
- Loading: set `aria-busy="true"` on the region being updated; give skeleton containers a
  `role="status"` with a label such as "Loading results".
- Toasts must not be the only way to learn something important, must stay long enough to read,
  and any action inside one must be reachable by keyboard.
- Respect `prefers-reduced-motion`: remove parallax, large movement and auto-playing animation
  (`motion-reduce:` / `motion-safe:` in Tailwind).
- Anything that moves, blinks or auto-advances for more than 5 seconds can be paused. Nothing
  flashes more than three times a second.
- Session timeouts warn the user and allow extending.

## Next.js and React specifics

- Navigate with `<Link>` (renders a real `<a href>`). `router.push` inside an `onClick` on a
  non-link element is not keyboard- or screen-reader-navigable.
- `next/image` requires `alt`; decide between a description and `alt=""` rather than filling it
  with the file name.
- Set `metadata.title` per route (a `title.template` in the root layout helps). The built-in
  route announcer reads the document title, then the `<h1>`, then the pathname.
- `eslint-config-next` includes `eslint-plugin-jsx-a11y` rules. Keep them on and fix what they
  report; consider enabling the plugin's `recommended` set for fuller coverage.
- Use `useId` for `id`s that link labels, descriptions and controls, so they are stable across
  server and client.
- Portalled content (dialogs, popovers) leaves the DOM order; rely on the primitive's focus
  management rather than DOM position.
- JSX uses `htmlFor`, `tabIndex`, `aria-*` (kebab-case, unchanged) and `role`.

## Auditing existing UI

Automated tools find roughly a third of real issues: missing names, contrast, invalid ARIA,
missing labels. They cannot tell whether a name is meaningful, whether focus goes to the right
place, or whether a custom widget is operable. An audit needs all of these steps:

1. **Automated scan.** Run the bundled scanner against the running app, for each key page and
   each important state (menu open, dialog open, form with errors), in light and dark themes:

   ```bash
   node <this-skill-dir>/scripts/axe-scan.mjs http://localhost:3000/pricing
   node <this-skill-dir>/scripts/axe-scan.mjs http://localhost:3000 --dark --viewport 390x844
   node <this-skill-dir>/scripts/axe-scan.mjs http://localhost:3000/login --click "button[type=submit]" --json a11y.json
   ```

   It needs `playwright` and `axe-core` resolvable from the project (`npm i -D playwright axe-core`),
   and prints violations grouped by impact with the affected elements. Run with `--help` for
   all options.

2. **Keyboard pass.** Using only Tab, Shift+Tab, Enter, Space, Escape and arrow keys, complete
   each main task. Note anything unreachable, any invisible focus, any illogical order, any
   trap, and where focus lands after opening and closing overlays. This can be scripted with
   Playwright (`page.keyboard.press('Tab')`, then read `document.activeElement`).

3. **Accessibility tree check.** Read what a screen reader would be told. With Playwright,
   `await page.locator('body').ariaSnapshot()` prints roles and names. Look for unnamed
   buttons and links, missing landmarks and headings, skipped heading levels, and names that
   do not match visible text.

4. **Zoom and reflow.** Check at 320 px wide and at 200% zoom for clipped or overlapping
   content and horizontal scrolling.

5. **Code read** of custom widgets against `references/aria-patterns.md`, and of forms against
   the Forms section above.

Use `references/audit-checklist.md` to make sure nothing is skipped, and say plainly which
steps were done and which were not. A scan alone is not an audit; do not report "accessible"
on the strength of zero automated violations.

### Report format

Order findings by user impact, not by tool output order.

```markdown
## Accessibility audit: <page or flow>

**Scope:** pages and states checked, themes, viewports.
**Method:** automated scan (axe-core), keyboard pass, accessibility-tree review, zoom/reflow.
**Not covered:** anything skipped, e.g. real screen-reader testing.

### Blockers (a user cannot complete the task)
1. **<short title>** - `path/to/file.tsx:42`
   - What happens: <who is affected and how>
   - WCAG: <number and name, e.g. 2.1.1 Keyboard (A)>
   - Fix: <specific change>

### Serious (task is possible but difficult)
...

### Moderate and minor
...

### Passed checks worth noting
```

When asked to fix rather than report, fix blockers first, re-run the scan and the keyboard pass
on the changed flows, and report what remains.

## Reference files

- `references/aria-patterns.md` - roles, states and keyboard behaviour for disclosure,
  accordion, dialog, tabs, menu button, navigation, combobox, listbox, tooltip, toast, switch,
  sortable table and carousel, with React examples.
- `references/audit-checklist.md` - WCAG 2.2 AA checklist grouped by what to inspect, with
  success-criterion numbers for reports.
- `scripts/axe-scan.mjs` - automated axe-core scan of a URL through Playwright.
