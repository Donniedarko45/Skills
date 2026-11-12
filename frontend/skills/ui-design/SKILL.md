---
name: ui-design
description: Make interfaces look and feel well designed - layout, spacing, typography, colour, visual hierarchy, responsive behaviour, dark mode, interaction states and motion - in React/Next.js with Tailwind CSS. Use this whenever building or restyling any visible UI (a page, landing page, dashboard, form, card, table, modal, navbar, empty state), whenever the user says something looks off, plain, cluttered, generic or "not professional", asks to polish, modernise or make something responsive or mobile-friendly, or shares a screenshot or mockup to match. Use it even when the request is purely functional ("add a settings page"), because the result will be judged by how it looks.
---

# UI design

Good interface design is mostly restraint and consistency: a clear hierarchy, a small set of
spacing and type sizes used everywhere, one accent colour doing one job, and every state of every
element accounted for. Decoration comes last and is usually not needed.

## 1. Start from what exists and what the screen is for

- **Read the project's design language first.** Look at the theme tokens (`globals.css`,
  `tailwind.config.*`), the existing `components/ui`, and one or two finished screens. Use those
  tokens, radii, shadows and spacing. A new screen that looks like it belongs beats a prettier
  one that does not.
- **Name the screen's job.** What is the one thing a person comes here to do or learn? That
  decides what is biggest, what gets the accent colour, and what can be demoted or removed.
- **If a mockup or screenshot was given, match it.** Measure it: spacing, sizes, weights, colours.
  Do not "improve" a design you were asked to implement.
- **Use real content.** Design with realistic names, numbers and paragraph lengths. Lorem ipsum
  hides the problems real content causes.

## 2. Hierarchy

A viewer should know where to look first, second and third without reading.

- One primary action per view, styled as the only filled accent button. Secondary actions are
  outlined or ghost; tertiary ones are text links. Two equally loud buttons mean neither wins.
- Create emphasis with **size, weight and colour together**, and de-emphasise the rest. Making
  supporting text smaller and lower-contrast is usually more effective than making the heading
  bigger.
- Use three text tones: primary (headings, key values), secondary (body), muted (metadata,
  captions, placeholders). More than that reads as noise.
- Labels are less important than the values they label. In "Revenue $48,200", the number is the
  content.
- Destructive actions are not automatically primary. A delete button in a list is quiet; the
  confirmation dialog is where it becomes prominent.

## 3. Spacing and layout

- Use the spacing scale and nothing else. With Tailwind that means the 4px-based steps
  (`1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`...). Arbitrary values like `mt-[13px]` are a smell
  outside of matching a mockup exactly.
- **Proximity shows relationship.** Space inside a group is smaller than space between groups:
  label to input `gap-1.5`, field to field `gap-4`, section to section `gap-8` or more. If the
  gaps are all equal, the structure disappears.
- Use `gap` on flex and grid parents instead of margins on children. Spacing then belongs to the
  layout and components stay reusable.
- Be generous. Cramped interfaces are the most common flaw; when unsure, add space, then remove
  until it feels tight enough.
- Constrain line length. Body text reads best at 45-75 characters: `max-w-prose` or `max-w-[65ch]`.
  A full-width paragraph on a wide screen is unreadable.
- Give pages a max width and consistent gutters: `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8`.
- Align to a small number of vertical edges. Left-align text by default; centre only short,
  self-contained blocks (a hero heading, an empty state).
- Avoid fixed heights on anything that holds text. Use `min-h-*` and let content decide.
- In flex rows, add `min-w-0` to the child that should truncate, or long content will overflow.

Layout recipes (app shell, sidebar, card grids, forms, tables, sticky headers) are in
`references/layout-recipes.md`.

## 4. Typography

- A small scale is enough: one display size, two heading sizes, body, small. Pair each size with
  a line height: tight for headings (`leading-tight`), relaxed for body (`leading-relaxed` or
  about 1.5-1.6).
- Two weights for most UI: regular for text, medium or semibold for emphasis. Bold everywhere
  is the same as bold nowhere.
- Large headings look better with slight negative tracking (`tracking-tight`). Small all-caps
  labels need positive tracking (`tracking-wide`) and a smaller size.
- `text-balance` on headings and `text-pretty` on paragraphs remove awkward last lines.
- `tabular-nums` on any column of numbers, timers, prices and counters, so digits align and do
  not jitter when they update.
- Body text at 16px (`text-base`) on mobile. Inputs below 16px make iOS Safari zoom on focus.
- Load fonts with `next/font` so they are self-hosted with fallback metrics and cause no layout
  shift. One family is usually enough; two at most.

## 5. Colour

- Build from neutrals. Most of an interface is background, surface, border and text in one grey
  family. Add **one** accent for primary actions and active states, plus semantic colours
  (success, warning, destructive) used only for their meaning.
- Use semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`,
  `bg-primary text-primary-foreground`) rather than raw palette classes (`bg-zinc-900`), so
  dark mode and rebrands work without touching components. The `design-system` skill covers
  setting these up.
- Meet contrast minimums: 4.5:1 for body text, 3:1 for large text, icons and the boundaries of
  inputs and buttons. Muted text is where this fails most often; check it.
- Never signal with colour alone. Pair it with an icon, text or shape: an error has a message,
  a status has a label, a chart series has a marker.
- Pure black text on pure white is harsh; near-black on off-white, or the reverse, is easier to
  read.
- Tint and shade from the same hue for hover and pressed states. A hover state that jumps to an
  unrelated colour looks broken.

### Dark mode

Dark mode is a second palette, not an inversion.

- Use dark greys for backgrounds, not `#000`. Raise elevated surfaces (cards, popovers, dialogs)
  by making them *lighter*, since shadows barely show on dark.
- Reduce saturation and brightness of accent and semantic colours; saturated colour on dark
  vibrates.
- Borders become more important than shadows for separating surfaces. Low-opacity white
  borders (`border-white/10`) work well.
- Check images, illustrations, logos and charts in both themes.
- Test both themes every time. A token missing its dark value is the usual cause of an unreadable
  screen.

## 6. Responsive design

- **Mobile first.** Write the narrow layout as the base, then add `sm:`, `md:`, `lg:` for wider
  screens. It forces prioritisation and produces less CSS.
- Let layouts adapt on their own where possible: `flex-wrap`,
  `grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]`, `clamp()` for fluid type and spacing.
  Breakpoints are for structural changes (sidebar to drawer, table to cards).
- Use **container queries** (`@container` on the parent, `@md:` on children) for components that
  appear in different-width slots. A card should respond to its column, not the viewport.
- Touch targets are at least 44x44 CSS px on touch layouts (24x24 is the WCAG 2.2 AA floor), with
  space between adjacent targets.
- Hover does not exist on touch. Anything revealed on hover needs another route on mobile.
- Use `dvh`/`svh` for full-height mobile layouts instead of `vh`, which ignores browser chrome,
  and pad for notches with `env(safe-area-inset-*)`.
- Wide tables: allow horizontal scroll inside a bordered container, pin the first column, or
  switch to stacked cards on narrow screens. Never let the page itself scroll sideways.
- Check at 360, 768, 1024 and 1440 px wide, and at 200% zoom.

## 7. States

A static mockup shows one state; a real component has many. Design each of them.

- **Interactive elements**: default, hover, `focus-visible`, active/pressed, disabled, loading.
  The focus ring must be clearly visible against every background it sits on.
- **Selection**: selected, current page (`aria-current`), checked, expanded.
- **Data regions**: loading (skeletons shaped like the content, not a lone spinner), empty
  (say what belongs here and offer the action that creates it), error (say what happened and how
  to recover), partial, and overflowing.
- **Forms**: pristine, focused, filled, invalid with a message next to the field, submitting,
  succeeded.
- **Content extremes**: a one-character name and a ninety-character one; zero items, one item
  and a thousand; a missing avatar; a number with seven digits.

Disabled is not just lower opacity: also remove hover effects and set `cursor-not-allowed`,
and prefer keeping a button enabled with a validation message over disabling it with no
explanation.

## 8. Depth, shape and detail

- Pick one radius scale and apply it by size: small for inputs and badges, medium for buttons and
  cards, large for dialogs. For nested rounded shapes, inner radius = outer radius minus the
  padding between them, or the corners look mismatched.
- Separate surfaces with **either** a border, a shadow or a background change. Using all three at
  once is heavy.
- Shadows are soft, low-opacity and offset downward. Use two or three elevation levels in total:
  resting card, raised popover, modal.
- Avoid boxes inside boxes inside boxes. If a card contains cards, try removing the outer
  container or separating inner items with dividers or spacing.
- Icons: one set, one stroke width, sized to the text they sit beside (`size-4` with `text-sm`,
  `size-5` with `text-base`), vertically centred with `items-center`. Decorative icons get
  `aria-hidden`.
- Images get an explicit aspect ratio (`aspect-video`, `aspect-square`) and `object-cover`, so
  layouts hold before and after loading.

## 9. Motion

- Animate to explain a change: something entered, left, moved, or responded to input. If removing
  the animation loses no meaning, it was decoration; keep it only if it is subtle.
- Keep UI transitions short: about 100-150 ms for hover and press, 150-250 ms for menus, popovers
  and dialogs, up to about 300 ms for large panels. Ease-out for things entering, ease-in for
  things leaving.
- Animate `transform` and `opacity` only. Animating width, height, top or left causes layout work
  on every frame and stutters.
- Respect `prefers-reduced-motion`: use `motion-safe:` / `motion-reduce:` variants and remove
  large movement, parallax and auto-playing animation for those users.
- Never block input on an animation.

## 10. Avoid the generic look

Interfaces produced without deliberate choices converge on the same tells. Check for them and
make an actual decision instead:

- a purple-to-blue gradient on the hero, the buttons and the headings
- every section a centred heading, centred subheading and three identical icon cards
- emoji used as icons
- glassmorphism, glows and heavy shadows on everything
- every element in its own bordered, rounded, shadowed card
- uniform spacing with no grouping, and five or more font sizes on one screen
- placeholder copy ("Lorem ipsum", "Feature 1", "Your tagline here")

Derive the look from the product instead: its content, its audience, the tokens already in the
codebase. A dense data tool and a marketing page should not look alike.

## 11. Look at it

Do not judge UI from code. Run the app and look at it.

1. Start the dev server and open the page.
2. Take screenshots at a mobile width (about 375 px) and a desktop width (about 1280 px), in
   light and dark themes if both exist. Playwright is the simplest way to do this.
3. Compare against the brief or mockup and against `references/polish-checklist.md`.
4. Fix what you see, then look again.

When reporting, say what you changed and why in design terms (hierarchy, spacing, contrast), and
include the screenshots if the environment lets you share them.

## Reference files

- `references/layout-recipes.md` - Tailwind recipes for common layouts: page container, app
  shell with sidebar, card grid, form, data table, sticky header, hero, empty state, dialog.
- `references/polish-checklist.md` - the final pass before calling a screen done.
