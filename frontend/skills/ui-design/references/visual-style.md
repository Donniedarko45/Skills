# Visual style: crafted product UI

The default look for this plugin when a project has no design language of its own, or when
asked to make something "look premium", "modern", "polished" or "less generic". It was
distilled from a set of current dashboard, product-widget and fintech marketing designs. What
those designs share is not decoration but **density with calm**: a lot of real information,
arranged so the eye always knows where to go.

Use it as a direction, not a template. If the project already has tokens and components, keep
them and borrow only the principles (sections 1-3) and the copy rules (section 8).

A complete page built with these patterns, which renders in light and dark, is in
`assets/dashboard-example.html` with its tokens in `assets/theme.css`. Read it when building a
dashboard or app screen from scratch.

## Contents

1. The five ideas
2. Tokens
3. Surfaces: canvas, frame, tray, card
4. Typography and numbers
5. Product UI patterns (with Tailwind)
6. Data inside cards: micro-visualisations
7. Charts
8. Copy that reads like a product
9. Motion
10. Marketing pages
11. Dark mode
12. Before and after: what "polish" actually changed
13. Checklist

## 1. The five ideas

1. **Monochrome plus one accent.** Near-black, white and a warm-neutral grey family do almost
   all the work. A single saturated accent (orange, coral, blue, green: pick one) marks only
   what is live, selected, or the newest data. The primary button is usually near-black, not
   the accent.
2. **Nested surfaces instead of heavy borders.** A soft grey *tray* holds a white *card*. The
   tray carries the title; the card carries the content. Depth comes from 1px hairlines,
   a barely-there shadow and a change of surface tone, not from big shadows.
3. **Numbers are the heroes.** Large tabular figures, with their context inline in small muted
   text right next to them: `148 this month`, `$0.0046 / 1K tokens`, `36 · 24% of applied`.
4. **Metadata in a quiet monospace.** Small uppercase mono labels with wide tracking for
   system state and units: `2,749 CHUNKS`, `POLICY V14 · LIVE ON CHAT-PROD`, `24 PARTITIONS · RF 3`.
   They read as instrument readouts and keep the sans-serif for content.
5. **Every card says something specific.** Titles, statuses and empty states describe the real
   situation ("Debrief ready · 4 of 4 in", "Systems thinking is the one soft spot"), never
   placeholder labels.

## 2. Tokens

Extend the token set from the `design-system` skill with three additions:

| Token            | Purpose                                                    | Light (OKLCH)        | Dark (OKLCH)          |
| ---------------- | ---------------------------------------------------------- | -------------------- | --------------------- |
| `canvas`         | the page behind the app frame                              | `0.955 0.003 80`     | `0.16 0.004 260`      |
| `tray`           | the outer grey container that holds a card                 | `0.965 0.003 80`     | `0.175 0.004 260`     |
| `brand`          | the single accent (fills, dots, highlights)                | `0.68 0.19 42`       | `0.74 0.17 45`        |
| `brand-ink`      | the accent as text, darker so it passes 4.5:1 on white     | `0.5 0.16 40`        | `0.8 0.14 50`         |

Rules that matter:

- **The tray must differ from the card in both themes.** In light mode the tray is a shade
  *darker* than the white card; in dark mode it is darker still than the card, which is
  *lighter* than the page. If tray and page share a value, the structure disappears in dark mode.
- **Accent as fill and accent as text are different tokens.** A saturated orange that looks
  right as a dot or bar fails contrast as text. `brand-ink` is for text.
- Status hues (success, warning, danger) follow the same pairing: a `*` fill token and a
  `*-ink` text token.
- Neutrals carry a whisper of warmth (chroma 0.003-0.006, hue 60-80). Pure grey reads colder
  and cheaper next to warm photography and off-white canvases.
- Radius is generous and stepped: about 8px controls, 12px cards, 16px trays, 24px the app frame.
  Inner radius = outer radius minus the padding between them, so nested corners stay concentric.

## 3. Surfaces: canvas, frame, tray, card

```
canvas (page)                     bg-canvas
└─ app frame                      rounded-3xl border bg-background shadow-sm
   ├─ sidebar                     bg-tray/60, selected item = raised white pill
   └─ content
      └─ tray                     rounded-2xl bg-tray p-1.5        title row lives here
         └─ card                  rounded-xl border bg-card shadow-xs p-4   content lives here
```

```tsx
<section className="rounded-2xl bg-tray p-1.5">
  <h2 className="px-2.5 py-2 text-sm text-muted-foreground">Requests received</h2>
  <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
    {/* number, micro-viz, breakdown */}
  </div>
</section>
```

- For dashboards, putting the app inside a rounded frame on a slightly darker canvas makes it
  feel like an object rather than a web page. Skip the frame for full-bleed apps.
- Not everything needs a tray. Use trays for stat tiles and self-contained widgets; use a plain
  bordered panel (`rounded-2xl border p-5`) for large charts and tables, so the page has rhythm.
- A tray can hold a footer as well as a header: a mono status line on the left and the action
  on the right (`2 SOURCES · SYNCING` ... `Connect source`).

## 4. Typography and numbers

- One sans family (Inter, Geist or the system stack) and one mono family (Geist Mono,
  JetBrains Mono, or `ui-monospace`). Load both through `next/font`.
- **Sizes**: 11px mono labels, 12px meta, 14px body (dense apps), 20-24px numbers in tiles,
  20px page title. Marketing headlines are a different scale (section 10).
- **Weights**: 400 and 500 for nearly everything, 600 for numbers and the page title. Avoid
  700 in product UI; it looks heavy next to hairlines.
- Large numbers: `font-semibold tracking-tight tabular-nums`.
- Mono labels: `font-mono text-[11px] uppercase tracking-wider text-muted-foreground`.
- Separate metadata with a middle dot and spaces: `Oslo · 8 yrs`, `18:30 · 1,184 homes · +2.9 MWh`.
- Deltas: a short coloured figure followed by muted context: `+12%` in success-ink, then
  `vs last month` in muted. Put the arrow or sign in the figure, not in an icon chip.
- Currency and units sit beside the number in smaller muted text: `€412/MWh`, `/ 1K tokens`.

## 5. Product UI patterns (with Tailwind)

Class lists assume the tokens above plus the `design-system` set (`background`, `card`,
`muted`, `muted-foreground`, `border`, `primary`...).

**App header**: breadcrumb on the left, compact actions on the right.

```tsx
<header className="flex h-14 items-center justify-between border-b border-border px-6">
  <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
    Home <span className="mx-1.5 text-foreground/30">/</span>
    <span aria-current="page" className="font-medium text-foreground">Overview</span>
  </nav>
  <div className="flex items-center gap-2">{/* search with ⌘K, Export, primary */}</div>
</header>
```

**Page title with live state**: title, a status dot pill, and a mono timestamp.

```tsx
<div className="flex flex-wrap items-center gap-3">
  <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-ink">
    <span className="size-1.5 rounded-full bg-brand motion-safe:animate-pulse" />Peak live
  </span>
  <span className="font-mono text-xs text-muted-foreground">Tue 27 Oct · 18:42 IST</span>
</div>
```

**Greeting with a one-line summary** (home dashboards): say what changed, not "Here's what's
happening".

```tsx
<h1 className="text-xl font-semibold tracking-tight">Good morning, Amara</h1>
<p className="mt-0.5 text-sm text-muted-foreground">Revenue is up 12% on last month. Two invoices are overdue.</p>
```

**Segmented control**: muted track, raised white selected segment. Counts sit in the label.

```tsx
<div role="group" aria-label="Period" className="inline-flex rounded-lg bg-muted p-0.5 text-sm">
  <button type="button" aria-pressed="false" className="rounded-md px-3 py-1 text-muted-foreground">Week</button>
  <button type="button" aria-pressed="true" className="rounded-md bg-card px-3 py-1 font-medium shadow-xs">Month</button>
</div>
{/* with counts: All <span className="ml-1 text-muted-foreground tabular-nums">205</span> */}
```

**Buttons**: compact (`h-8`, `text-sm`, `rounded-lg`). Primary = `bg-primary text-primary-foreground`
(near-black). Secondary = `border bg-card shadow-xs`. A primary that only matters after a change
is shown faded until then, with a mono note explaining why (`POLICY V14 · UNSAVED CHANGES`).

**Sidebar**: tinted background; selected item is a raised white pill (`border bg-card shadow-xs`);
section labels in mono caps; counts right-aligned and muted; a usage card pinned to the bottom
(`Credits used 810 / 3,100` with a 4px progress bar).

**Status pill**: dot + label, tinted fill, tinted hairline border, ink-coloured text.

```tsx
<span className="inline-flex items-center gap-1.5 rounded-md border border-success/25 bg-success/10 px-2 py-0.5 text-xs font-medium text-success-ink">
  <span className="size-1.5 rounded-full bg-success" />Offer
</span>
```

For system states use the mono variant: `font-mono text-[11px] uppercase tracking-wider`,
`● CONNECTED`, `● SYNCING 36%`, `● DRAIN`.

**Rows**: two-line cells. Primary text in `font-medium`, secondary in `text-xs text-muted-foreground`.
Initials avatars on pastel tints of the chart colours. The selected or attention row gets a
tinted background and a 3px accent bar on the leading edge:

```tsx
<tr className="bg-brand/8 shadow-[inset_3px_0_0_var(--brand)]">...</tr>
```

**Ratings and scores**: a figure plus five short dashes, filled in the accent:
`4.4 ▬▬▬▬▭`. Use `aria-hidden` on the dashes; the number carries the meaning.

**Progress inside a row**: a 1px accent line along the row's bottom edge, its width the
percentage. Quiet, but visible at a glance across a list.

**Toast**: a dark pill centred near the bottom: `✓ Docs site connected · 1,284 chunks`,
in a `role="status"` region.

**Empty state inside a widget**: a line illustration in light grey, a specific title
("Nothing indexed yet"), one sentence saying what happens next, and the two actions that fill it.
When content arrives, the same illustration gains accent strokes. The empty and full states
share a layout, so nothing jumps.

**Add affordance at the end of a list or board column**: a dashed full-width button,
`rounded-xl border border-dashed text-sm text-muted-foreground`, labelled with the verb
("+ Add bill", "+ Log income").

## 6. Data inside cards: micro-visualisations

Small, purposeful graphics inside stat cards are the single biggest difference between these
designs and a generic dashboard. Each answers one question at a glance. Always give the
container `role="img"` and an `aria-label` stating the data in words.

| Pattern            | Shows                                   | Build                                                                     |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------- |
| Tick strip         | a proportion split (70% orders / 30% invoices) | ~48 thin `rounded-full` vertical bars in a `flex gap-[2px] h-4`, coloured by segment |
| Spark bars         | trend, with the latest highlighted      | ~24 bars, grey (`bg-foreground/12`), the last 2-3 in the accent            |
| Dot grid           | a count of units (1,184 of 1,240 homes) | grid of small circles; active = filled accent, inactive = accent outline   |
| Segmented meter    | share by category                       | 3-4 `rounded-full` segments with gaps, optional diagonal hatching          |
| Step progress      | progress toward a goal                  | 16-20 rounded squares, filled up to the value                              |
| Thin bar + legend  | budget used                             | `h-1` track and fill, value and limit as text beside it                    |

Diagonal hatching (`repeating-linear-gradient(-45deg, ...)` as a utility) distinguishes
series without extra colours and looks deliberate. Keep micro-viz monochrome-plus-accent where
possible; use the chart palette only when categories need telling apart.

## 7. Charts

- Bars sit on a full-height rounded *track* (`bg-muted`), so empty months still show their slot.
- **Focus by dimming**: the selected or current column is full colour; the others drop to about
  30% opacity. This beats adding more colour.
- Gridlines are dashed and faint, or absent. Axis labels are 12px muted; the selected label is
  `text-foreground font-medium`.
- Tooltips are small cards: a muted title (`July 2026`) above a hairline, the total with its
  delta, then one row per series with a colour swatch, label and right-aligned tabular value.
  On touch layouts, show the same details below the chart instead of floating them.
- Link hover across views: hovering a chart element highlights its table row and the reverse.
- Line charts: one series dark, a highlighted current segment in the accent, the latest point
  marked with a ring and labelled with its value.

For more on charts, use the session's data-visualisation guidance if available.

## 8. Copy that reads like a product

The copy is half the polish. Write it from the data.

- **Titles name the thing and its state**: "Evening peak · Live 17:30-19:00", "Knowledge base is ready".
- **Statuses say what is next**: "Debrief ready · 4 of 4 in", "Waiting on reply · 2 days",
  "Screen call · today 16:00".
- **Summaries make a judgement**: "Move her to onsite · 3 of 4 yes. Craft and communication lead
  every card. Systems thinking is the one soft spot."
- **Footers report scope**: "Showing 9 of 205 · sorted by score", "4 SOURCES · 4,812 CHUNKS · IN SYNC".
- **Empty states explain the mechanism**: "Connect a source or upload files. The assistant reads,
  chunks and embeds them, so answers can cite your own content."
- **Drop internal noise**: transaction IDs, raw enum names and timestamps to the second rarely
  help. Show a category, a human date and the amount.
- Label sample data as sample data.

## 9. Motion

What the reference videos do, all quick and quiet:

- Numbers update by rolling or cross-fading digits rather than jumping.
- Content fades and rises a few pixels in a short stagger when a panel loads.
- Live states pulse a single dot, not the whole card.
- Progress underlines grow; data-flow lines move as dashes along a path.
- A dark toast confirms each completed step.
- Changing a segmented control re-weights the visualisation smoothly.

Keep it under about 250 ms, animate `transform` and `opacity` only, and remove it all under
`prefers-reduced-motion`.

## 10. Marketing pages

Landing and marketing pages have their own anatomy, sizes and failure modes. They are in
`landing-pages.md`; read it before building one. The product fragments shown on those pages
follow sections 3-8 here.

## 11. Dark mode

- Canvas near-black (`0.16`), app background a step up (`0.2`), cards a step further (`0.235`),
  trays *below* the card (`0.175`). Check that each layer is distinguishable.
- Borders do the separating: `oklch(1 0 0 / 9%)`. Shadows barely register.
- The accent gets lighter and slightly less saturated; text uses `brand-ink`.
- Dense, data-heavy dark dashboards can use per-category colours on icon chips and gradient
  meters (red to amber to green for a health range), but keep each card to one or two colours.
- Hatched fills need a lighter stripe in dark (`white 20-35%`), or they vanish.

## 12. Before and after: what "polish" actually changed

From a before/after redesign of a finance dashboard, the changes that made the difference:

| Before                                              | After                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Stat cards with a number, a sparkline and three sub-figures | One big number, one line of context, one micro-viz per card; delta as a small badge      |
| Transaction IDs (`TXN-041`) on every card           | Removed; a category in small caps with an icon instead                                    |
| Amounts coloured red and green everywhere           | Neutral amounts; colour reserved for status badges and the `+` on income                  |
| Each board card laid out differently                | One card anatomy: category + status / title + amount / hairline / date + meta             |
| Plain underlined tabs                               | Section label, then icon tabs as a segmented control                                      |
| Columns as bare lists                               | Columns as tinted trays with a count, ending in a dashed "+ Add" button                   |
| Sidebar of grey icons                               | Small coloured icon chips for account types; a tree line for nested items                 |

The lesson generalises: **remove noise, then make every repeated element share one anatomy.**

## 13. Checklist

- [ ] One accent colour, used only for live, selected and newest; primary button near-black.
- [ ] Trays hold cards; tray and card differ in both themes.
- [ ] Every stat tile: big tabular number, one line of muted context, at most one micro-viz.
- [ ] Mono caps for system metadata only; sans for everything a person reads as content.
- [ ] Middle-dot separators in metadata; two-line row cells.
- [ ] Status pills with dot, tinted fill and ink text; accent text uses the `-ink` token.
- [ ] Charts focus by dimming, not by adding colours; tooltips are small cards.
- [ ] All copy is specific to the data; no IDs or enum names where a person reads.
- [ ] Empty, loading and full states share a layout.
- [ ] Checked at 375 px: nothing overflows, floating tooltips move inline.
- [ ] Checked in dark mode: every surface layer is visible.
