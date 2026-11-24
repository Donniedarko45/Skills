---
name: ui-design
description: Make interfaces look and feel exceptionally well designed - creative direction, layout, composition, typography, colour, imagery, visual hierarchy, responsive behaviour, dark mode, interaction states and motion - in React/Next.js with Tailwind CSS. Use this whenever building or restyling any visible UI (a page, landing page, dashboard, form, card, table, modal, navbar, empty state), whenever the user says something looks off, plain, cluttered, generic, ugly, "AI-looking" or "not professional", asks to polish, beautify, modernise, make it unique, distinctive or premium, or make something responsive or mobile-friendly, or shares a screenshot, mockup or design references to match. Also use it for art direction, brand look and feel, a premium, high-end or "Dribbble-quality" look, a SaaS or fintech dashboard, an admin panel, a landing or agency page, or stat cards and charts. Use it even when the request is purely functional ("add a settings page"), because the result will be judged by how it looks.
---

# UI design

Elite interface design is a point of view executed with restraint and checked without mercy.
Three layers, in this order: **taste** (the visual vocabulary: the user's references or house
style), **concept** (what only this product could say with it), and **craft** (every detail
precise). Rules alone produce correct, forgettable pages; a concept alone produces striking,
sloppy ones.

## The workflow

Follow these steps for any new screen or redesign. For a small change to an existing screen,
steps 1, 6 and 7 are usually enough.

1. **Read what exists.** The project's tokens (`globals.css`, `tailwind.config.*`), components
   in `components/ui`, and one or two finished screens. A new screen that belongs beats a
   prettier one that does not. If the user shared references or a mockup, they are the taste
   layer: take them apart with the teardown in `references/creative-direction.md` (measure, run
   `scripts/palette.mjs` on the images, list the moves). If asked to *implement* a mockup, match
   it exactly; do not "improve" it.
2. **Write the brief** in five lines: product, audience and their moment, the screen's one job,
   two feeling words each with what it must not become, and the givens
   (`references/creative-direction.md` section 2).
3. **Find the concept** (new pages and redesigns): write three short concept cards from the
   product's own world (its name, domain artifacts, the shape of its data, its promise made
   literal), pick one and say why. Choose one signature device to use two to four times.
4. **Write the style sheet**: a dozen lines fixing type scale, colour roles and tested contrast
   pairs, radius and shadow levels, spacing rhythm, imagery and motion rules, and a "never" list.
   Every section must obey it.
5. **Build** with real content, from the narrowest width up, using the craft rules below,
   `references/visual-craft.md`, and for the house style `references/visual-style.md` (product
   UI) or `references/landing-pages.md` (marketing pages).
6. **Critique**: render it and run `scripts/shoot.mjs`, `scripts/design-audit.mjs` (desktop and
   390 px) and an axe scan; run the tests and score in `references/critique.md`. Fix, then
   critique again. At least two rounds before reporting.
7. **Polish**: the final pass in `references/polish-checklist.md`.

### Defaults when nothing is given

- **Product UI** (dashboards, app screens): the house style in `references/visual-style.md`:
  monochrome plus one accent, grey trays holding white cards, big tabular numbers with inline
  context, quiet monospace metadata, micro-visualisations in stat cards, and copy written from
  the data. `assets/dashboard-example.html` shows it assembled.
- **Marketing pages** (landing, home, product, agency): `references/landing-pages.md`: light
  canvas, centred two-tone headline, a hero stage of real UI around the product itself, one hue
  as a tint ladder, warm photography, big quiet numerals. It is the vocabulary; the concept from
  step 3 is what makes it this product's page.
- A product that clearly does not fit either (a children's app, a luxury hotel, a festival):
  pick an archetype from `references/creative-direction.md` section 5 and say why.

### Always

- **Name the screen's job.** The one thing a person comes to do or learn decides what is
  biggest, what gets the accent, and what can be demoted or removed.
- **Use real content.** Realistic names, numbers and paragraph lengths; figures that agree
  across the page. Lorem ipsum hides the problems real content causes.

## 1. Hierarchy

A viewer should know where to look first, second and third without reading.

- One primary action per view, styled as the only filled button (the brand colour, or
  near-black in a monochrome design). Secondary actions are outlined or ghost; tertiary ones are
  text links. Two equally loud buttons mean neither wins.
- Create emphasis with **size, weight and colour together**, and de-emphasise the rest. Making
  supporting text smaller and lower-contrast is usually more effective than making the heading
  bigger.
- Use three text tones: primary (headings, key values), secondary (body), muted (metadata,
  captions, placeholders). More than that reads as noise.
- Labels are less important than the values they label. In "Revenue $48,200", the number is the
  content.
- Destructive actions are not automatically primary. A delete button in a list is quiet; the
  confirmation dialog is where it becomes prominent.

## 2. Spacing and layout

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

## 3. Typography

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

## 4. Colour

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

## 5. Responsive design

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

## 6. States

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

## 7. Depth, shape and detail

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

## 8. Motion

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

## 9. Avoid the generic look

Interfaces produced without deliberate choices converge on the same tells. Check for them:

- a purple-to-blue gradient on the hero, the buttons and the headings; neon glows; glassmorphism
- every section a centred heading, centred subheading and three identical icon cards
- emoji used as icons; icon-in-a-coloured-square as the only illustration
- every element in its own bordered, rounded, shadowed card
- uniform spacing with no grouping, and a dozen font sizes on one page
- an italic serif "accent word" in every heading, mono uppercase labels on everything
- a saturated full-bleed colour behind the hero; grid-paper or blob backgrounds everywhere
- a stock photo as the hero centrepiece; floating cards and cursor tags competing
- the same two-tone heading device on every section
- placeholder copy ("Lorem ipsum", "Feature 1", "Your tagline here"), vague claims
  ("Empower your business"), numbers that disagree between sections

The cure is not a different trend; it is the three layers. Keep the taste layer (the user's
references or the house defaults) as the vocabulary, and make the page specific with a concept
and signature device from the product's own world (`references/creative-direction.md`):
ledger lines and tally numerals for a bookkeeping app, a white-label toggle for an agency.
The concept lives inside the vocabulary, as a texture, numeral style, diagram, interaction or
headline. It never replaces it with a new colour scheme or layout grammar. Test with the logo
swap: if a competitor could put their logo on the page unchanged, the concept is missing.

## 10. Critique loop

Do not judge UI from code. Run the app and look at it, then measure it.

```bash
node <skill>/scripts/shoot.mjs http://localhost:3000 ./shots --widths 390,1280 --dark
node <skill>/scripts/design-audit.mjs http://localhost:3000
node <skill>/scripts/design-audit.mjs http://localhost:3000 --viewport 390x844
```

`shoot.mjs` writes each width's first screen, full page and readable sections, plus the squint,
greyscale and thumbnail views. `design-audit.mjs` reports what the eye misses: type-size sprawl,
headings ending in a lone word, clipped or overlapping text, off-scale spacing, radius and shadow
sprawl, small tap targets, distorted or upscaled images, competing filled buttons and fonts that
silently fell back. Use the `accessibility` skill's axe scan for contrast and semantics.

Then run the tests in `references/critique.md` (squint, greyscale, thumbnail, five seconds, logo
swap, remove one thing, side by side with the references, mobile first screen, dark mode,
stress), score the ten criteria, and fix the two lowest first. Repeat until every criterion is
at least 7 and every audit FAIL is gone; at least two rounds.

When reporting, say what you changed and why in design terms (hierarchy, rhythm, contrast,
concept), and include the screenshots if the environment lets you share them.

## Reference files

- `references/creative-direction.md` - the three layers, the brief, finding a concept (three
  directions, then choose), signature devices, art-direction archetypes, reference teardown,
  the style sheet, worked examples.
- `references/visual-craft.md` - composition, typography (scale, tracking and leading by size,
  punctuation, offline fonts), colour (OKLCH ladders, contrast pairs, dark mode), imagery and
  product visuals, depth, motion choreography, copy, responsive art direction, thirty details.
- `references/critique.md` - capture, ten critique tests, the scoring table, symptom-to-fix
  table, fresh-eyes review, reporting.
- `references/landing-pages.md` - the marketing taste layer: failure modes, tokens and measured
  type sizes, hero and product stage, section patterns, photography, footer, mobile, checklist.
- `references/visual-style.md` - the product UI house style: tokens, surfaces (canvas, tray,
  card), numbers and mono metadata, product UI patterns, micro-visualisations, charts, copy,
  motion, dark mode, and a before/after of what polish changes.
- `references/layout-recipes.md` - Tailwind recipes for common layouts: page container, app
  shell with sidebar, card grid, form, data table, sticky header, hero, empty state, dialog.
- `references/polish-checklist.md` - the final pass before calling a screen done.
- `scripts/shoot.mjs` - review screenshots: widths, sections, squint, greyscale, thumbnail.
- `scripts/design-audit.mjs` - measured design QA of a rendered page (FAIL / WARN / inventories).
- `scripts/palette.mjs` - dominant colours of reference images as OKLCH with suggested roles.
- `assets/dashboard-example.html` and `assets/theme.css` - a complete page in the house style
  (dashboard and marketing sections, light and dark) to read or adapt.

The scripts need `playwright` resolvable from the project (`npm i -D playwright`) and a running page.
