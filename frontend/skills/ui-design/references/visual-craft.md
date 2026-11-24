# Visual craft: the details that separate good from elite

Use this while building and while critiquing. Each section gives numbers you can apply and the
mistakes that give amateur work away.

## Contents

1. Composition
2. Typography
3. Colour
4. Imagery, product visuals and icons
5. Depth and surfaces
6. Motion
7. Copy as design
8. Responsive art direction
9. Thirty details reviewers notice

## 1. Composition

- **One focal point per screen.** The focal element is the biggest, the highest contrast and the
  most isolated thing in view. If two things tie, demote one. Check with the squint view.
- **Scale contrast.** On marketing pages the hero headline is at least 4x body size (64-76 px
  against 16-18 px); on app screens the page title is about 1.5-2x body. Weak pages fail by
  making everything medium.
- **Grid.** A 12-column grid in a 1120-1280 px container. Asymmetric splits (5/7, 4/8, 7/5) feel
  designed; 6/6 feels like a template. Text columns span 5-7 columns, never all 12.
- **Few alignment edges.** Most content aligns to two or three vertical lines. Every new edge is
  noise. Centre only short blocks (hero, section intro, empty state).
- **Optical alignment beats mathematical.** Round shapes and pointed icons overshoot slightly; a
  play icon sits a pixel right of centre; opening quotation marks hang outside the text edge;
  large headlines may need a negative left nudge (about 0.04em) to look aligned with body text.
- **Space defines groups.** Space around a group is larger than space inside it, by at least 2x.
  Section padding on desktop: 120-200 px; inside cards: 20-32 px.
- **Pacing.** A long page is a sequence: alternate density (a dense grid, then one airy statement,
  then a full-bleed band, then contained cards). Six visually identical sections in a row reads
  as a template; vary layout every section and give the eye a resting place every two or three.
- **Break the grid once.** One element per page that crosses a boundary (a card overlapping a
  photo's edge, a figure hanging into the margin) creates depth. More than two looks messy.
- **Overlap with purpose.** Cards may overlap images and backgrounds; text never overlaps text.
- **Reading paths.** Heroes read in a Z (logo, nav, headline, CTA, visual); content sections in an
  F (heading, first lines, left edge). Put the action where the path ends.

## 2. Typography

**Choosing.** Pick faces for voice: a neutral grotesk (Geist, Inter, General Sans) for product
clarity; a serif display for editorial authority; a mono only for genuine data, code and
system labels. Two families plus a mono is the ceiling.

**Fonts without network.** `next/font/google` fails when Google Fonts is unreachable. Use
`next/font/local` with files from npm packages: `geist` (GeistSans, GeistMono), and
`@fontsource/<family>` or `@fontsource-variable/<family>` (copy the `.woff2` into the app or
reference it from `node_modules`). Check the font actually loaded: the design audit fails when
text falls back.

**Scale.** App UI: ratio about 1.2 (12, 14, 16, 20, 24, 30). Marketing: ratio 1.333-1.5 with a
jump to display (14, 16, 18, 24, 32, 44, 64-76). Aim for 6-9 sizes on a whole page, counting UI
fragments. Merge sizes within 1-2 px of each other.

**Tracking and leading by size** (grotesk; serifs need about half the negative tracking):

| Size        | Tracking        | Line height |
| ----------- | --------------- | ----------- |
| 11-12 px caps labels | +0.06 to +0.1em | 1.3   |
| 12-14 px    | 0 to +0.01em    | 1.45-1.5    |
| 16-18 px    | 0               | 1.5-1.6     |
| 20-28 px    | -0.01em         | 1.3-1.35    |
| 32-44 px    | -0.02 to -0.03em | 1.1-1.15   |
| 48-64 px    | -0.03 to -0.04em | 1.02-1.08  |
| 72 px +     | -0.04 to -0.05em | 0.95-1.0   |

**Measure.** Body 45-75 characters (`max-w-[65ch]`). Display lines 8-20 characters: set
`max-w-[14ch]`-style widths and `text-wrap: balance` so headlines break into even lines.

**Weights.** Display grotesk 500-600; body 400; emphasis 500. 700+ only for a brand that shouts.
Light (300) only for very large numerals.

**Hierarchy levers.** Size, weight, colour. Change at most two between adjacent levels. The
two-tone headline (second half muted) is one lever; use it for the hero and at most two more
headings, or it becomes a tic.

**Typographic punctuation** (instantly separates crafted from generated):
curly quotes and apostrophes (’ “ ”); en dash for ranges (9–5, 2024–2026); minus sign (−) for
negative numbers; multiplication sign (2.4×); ellipsis (…); non-breaking space between a number and
its unit or a short last word (`72&nbsp;hours`); `tabular-nums` for any figures that align or
update; lining figures in UI.

**Widows and rags.** No heading ends with one short word. Fix with `text-balance`, a
non-breaking space, or a rewrite. Ragged paragraphs: `text-pretty`.

## 3. Colour

**Build from one hue in OKLCH.** Pick the brand hue (H) and make a ladder by lightness, with
chroma peaking in the middle:

```
50  oklch(0.97 0.015 H)   100 oklch(0.94 0.03 H)   200 oklch(0.89 0.06 H)   300 oklch(0.83 0.09 H)
500 oklch(0.58 0.19 H)    700 oklch(0.45 0.17 H)   900 oklch(0.25 0.07 H)
```

Neutrals take a whisper of the same hue (chroma 0.004-0.012) or a warm 60-90 hue against cool
brands. Pure grey looks cheap next to tinted colour and photography.

**Proportion.** Roughly 60% canvas, 30% surfaces and text, 10% colour. In product UI the accent
covers under 5% of pixels; it marks what is live, selected or primary.

**Role tokens, not just shades.** Define the pairs you will use and test them up front:

| Pair                          | Minimum | Note                                                     |
| ----------------------------- | ------- | -------------------------------------------------------- |
| ink on canvas / surface       | 4.5:1   | body text                                                |
| muted on canvas               | 4.5:1   | the usual failure                                         |
| muted on tinted panels        | 4.5:1   | needs a darker "ink-soft"; canvas-muted fails on tints   |
| white on brand fill           | 4.5:1   | use a **fixed** brand fill: a theme-flipped hue goes pale in dark mode |
| ink on light chip in dark mode | 4.5:1  | chips on deep bands need a fixed light tint, not a themed one |
| large muted headline half     | 3:1     | the two-tone grey must still pass for large text         |

**Dark mode** is a second palette: surfaces step up in lightness as they rise; accents drop
chroma and rise in lightness; fills behind white text stay saturated and dark; deep bands stay
deep. Re-check every pair.

**Gradients** only within one hue and subtle (a tint fading to canvas). No purple-to-blue, no
neon glows. Grade photography toward the palette (choose photos with matching temperature).

## 4. Imagery, product visuals and icons

**Photography.** Natural light, real tasks, people mid-action, consistent colour temperature
across the set. Crop tight to the subject and the action. Avoid clichés: handshakes, high-fives,
stacked hands, pointing at a screen, staged laughter. One treatment per page (rounded frame,
full-bleed, or duotone). Never attach invented names or quotes to stock faces.

**Product visuals built in code** are usually better than screenshots:

- real-looking data and copy (names, dates, amounts that add up across the page);
- the density of a real app at 11-14 px, with one accent colour and the page's tokens;
- one "moment of value" visible (a Paid toast, a matched receipt, a merged PR);
- crisp at every width (it is HTML), and `aria-hidden` when decorative, with the point made in text.

**Hero object.** The centre of a hero is the product (or what a service client receives), not a
lifestyle photo. Photos support later sections.

**Icons.** One set; stroke width matched to the text weight next to it (1.5 px at 24 px for
regular text); sized to the cap height; optically centred. Decorative icons are `aria-hidden`.

**Logo rows.** Monochrome, equalised by optical size (visual weight), not by width; shown once.

## 5. Depth and surfaces

- **Elevation levels:** 0 flat; 1 resting card (hairline border, optional `0 1px 2px` shadow);
  2 floating (`0 24px 60px -24px` with a shadow tinted toward the canvas or brand hue, never pure
  black); 3 modal. Three levels per page at most.
- **Hairlines:** 1 px borders at low alpha (`oklch(0 0 0 / 0.08)` light, `oklch(1 0 0 / 0.1)` dark).
- **Radii:** one family by size (for example 8 controls, 14 cards, 24-32 frames, pill buttons) and
  concentric nesting (inner = outer − padding). The audit flags more than six radii.
- **Layers:** canvas, tray, card, and at most one more. Boxes inside boxes inside boxes is clutter.

## 6. Motion

- **One hero moment** per page (the headline rising in, a line drawing, a number ticking up).
  Everything else is quieter.
- **Choreography:** stagger in reading order, 40-80 ms apart; travel 8-16 px; ease out
  (`cubic-bezier(0.2, 0.7, 0.2, 1)`); 300-700 ms for entrances, 120-200 ms for hover and press.
- **Content is visible by default.** Scroll reveals must not leave content invisible without
  JavaScript, under reduced motion, or for screenshots and crawlers.
- **Hover affordances:** a 1-2 px lift, an arrow nudging 2 px, a colour step from the same hue.
- **Loops:** at most one ambient loop on screen (a live dot, a slow 6-8 s float), off under
  `prefers-reduced-motion`.

## 7. Copy as design

- Headlines state an outcome plus its mechanism or a tension ("Freelance bookkeeping, with the
  tax worked out"), not a category ("Empowering your financial future").
- Specific beats impressive: "Kickoff to first commit: 71 hours" over "Lightning-fast onboarding".
- Numbers agree everywhere on the page; repeat a figure rather than invent a second one.
- Buttons name the outcome ("Book a 20-minute intro", "Start free"), never "Submit" or "Learn more"
  when a specific label exists.
- Placeholder content is tagged where it appears ("Sample"), not only in a banner.

## 8. Responsive art direction

Recompose for each width; do not just stack.

- Hero at 390 px: headline 38-44 px in at most three lines with no lone last word; one primary
  button full width or two side by side if they fit; the visual reduced to the central object
  plus two fragments that do not overlap each other or important content.
- Reorder for mobile intent: proof and the primary action earlier; secondary detail later.
- Hide decoration rather than shrink it. Logos and card rows can become horizontal scrollers
  with snap points and a visible peek of the next item.
- Compress the type scale (display drops about 40%, body stays 16 px).
- Tap targets 44 px; footer and inline links need padding to reach it.

## 9. Thirty details reviewers notice

1. Exactly one filled button per view.
2. Headline breaks into balanced lines; no lone last word.
3. Real typographic quotes, dashes and multiplication signs.
4. Number and unit kept together with a non-breaking space.
5. Tabular figures in tables, prices and counters.
6. Six to nine type sizes across the whole page.
7. Two shadow levels, tinted, consistent in direction.
8. One radius family, concentric when nested.
9. Muted text that still passes contrast on every background it sits on.
10. Focus rings visible on every surface, in a deliberate colour, with offset.
11. Selection colour set to a brand tint.
12. Scroll padding so anchor links do not hide headings under a sticky header.
13. Icons from one set with matched stroke and optical centring.
14. Images never distorted or upscaled; explicit aspect ratios.
15. Photos share temperature and treatment.
16. Logo row monochrome and optically balanced, shown once.
17. Product fragments use the page's tokens and plausible, consistent data.
18. Figures and claims agree across sections.
19. Section rhythm varies; there is a resting place every few sections.
20. One element breaks the grid on purpose; nothing breaks it by accident.
21. Hover, pressed and focus states on every interactive element.
22. Motion has one hero moment and respects reduced motion.
23. Content is visible with JavaScript off and with reduced motion on.
24. Dark mode is designed, not inverted, and every pair is re-checked.
25. Mobile hero recomposed, not squeezed.
26. Footer finished: grouped links, contact, legal line, nothing placeholder-looking.
27. Favicon, page title and social image set.
28. Fonts actually load (no silent fallback).
29. No horizontal scroll at 360 px; no clipped text at any width.
30. Copy specific to this product; every button names its outcome.
