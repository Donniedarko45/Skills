# Landing pages: the crafted marketing look

How the best current product and fintech marketing pages are built, section by section, with
sizes measured from 1440px-wide references. Read this before building any landing, home,
product or agency page. The dashboard rules in `visual-style.md` still apply to the product UI
fragments shown *inside* the page.

## Contents

1. What these pages have in common
2. Failure modes: what makes a page look generated
3. Tokens and type scale
4. Header
5. Hero
6. Section patterns (pick 6-9)
7. Photography and imagery
8. Footer
9. Mobile
10. Checklist

## 1. What these pages have in common

- **Light and airy above the fold.** White, warm off-white or cream canvas. Colour arrives in
  tints and in one or two full-bleed bands further down, never as a saturated hero background.
- **Centred, calm hero.** A small social-proof chip, a two-line headline, one line of
  sub-copy, two pill buttons, then a large product collage that starts above the fold and
  finishes below it.
- **The product is the illustration.** Crisp UI fragments (a balance, a transaction list, a
  chart card) floating around a central object (a phone, a card held in a hand, a photo).
  No abstract blobs, no icon grids standing in for the product.
- **Big, quiet type.** Headlines in a medium weight with tight tracking; huge light-weight
  numerals for stats; small grey body copy. Contrast comes from size and from dimming part of a
  sentence, not from bold weights or colour.
- **One hue family.** Each page picks one hue and uses a ladder of its tints (lavender 100/200/300,
  mint, terracotta, oxblood). Buttons are near-black or the darkest shade of that hue.
- **Space.** 160-200px between sections at desktop. Sections hold one idea each.
- **Real photography** of people working, in warm natural light, often with a UI card overlapping it.

## 2. Failure modes: what makes a page look generated

Check the draft against this list before polishing anything else. Each one is something a real
generated page did.

| Looks generated                                                     | Do instead                                                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Saturated full-bleed colour behind the hero (electric blue, purple gradient) | Light canvas; save the deep colour for one band lower down                    |
| Grid-paper, noise or glow-blob backgrounds everywhere               | One subtle texture behind the hero only: concentric rings, a dot field, or circuit lines |
| An italic serif "accent word" in every heading                      | Two-tone headings: the second half in a muted shade. One typeface for headings      |
| Mono uppercase labels on everything                                 | Mono only inside UI fragments. Eyebrows in small uppercase sans with wide tracking  |
| Abstract chart or diagram as the hero visual                        | A collage of realistic product UI around a central object or photo                  |
| Every section in a different dark/light/colour band                 | Mostly canvas; at most two full-bleed bands (one deep, one tint)                    |
| Dense sections with many small boxes                                | One idea per section, large type, generous space                                    |
| Icons in coloured squares as feature illustrations                  | A white UI fragment at the top of each feature card                                 |
| Bold 700-800 headlines                                              | 500 weight, tracking -0.04em to -0.05em                                             |
| Gradient text, glassmorphism, neon glows                            | Flat colour, hairlines, soft shadows                                                |
| Testimonials with stock-photo faces and invented names              | Initials avatars, or real quotes only; mark placeholders as placeholders            |
| A stock photo as the hero centrepiece                               | The product itself (dashboard, app screen, card), or what a service client receives |
| Cursor tags, rings, photo and five cards all competing in the hero  | One central object, 3 fragments (2 on mobile), at most one cursor tag                |
| The two-tone device on every section heading                        | Two-tone for the hero and at most two section headings; plain or statement elsewhere |
| A layout that could be any brand's once the logo is swapped         | One bespoke device from the product's own world (section 6, "Earn distinctiveness")  |
| Showing how an engagement runs but never the output                 | A proof section: work with real product screens, numbers, one quote                 |

## 3. Tokens and type scale

```css
:root {
  --canvas: oklch(0.975 0.006 85);   /* warm off-white page */
  --surface: oklch(1 0 0);           /* cards */
  --tray: oklch(0.955 0.006 85);     /* grey block behind footer, secondary panels */
  --ink: oklch(0.2 0.01 60);         /* headings, primary buttons */
  --ink-muted: oklch(0.55 0.01 60);  /* second half of headlines, body copy */
  --ink-faint: oklch(0.72 0.008 60); /* third tier: dimmed statement text, axis labels */
  --line: oklch(0.9 0.006 85);
  /* one hue, as a ladder: 100 for big tinted areas, 200-300 for cards, 700 for text, 900 for the deep band */
  --hue-100: oklch(0.95 0.03 275);
  --hue-200: oklch(0.9 0.055 275);
  --hue-300: oklch(0.84 0.08 275);
  --hue-500: oklch(0.55 0.2 270);    /* small accents only: a dot, a cursor tag, a link */
  --hue-700: oklch(0.42 0.17 270);
  --hue-900: oklch(0.24 0.06 270);   /* the one deep full-bleed band */
}
```

| Role                       | Desktop (1440)                                   | Mobile (390)          |
| -------------------------- | ------------------------------------------------ | --------------------- |
| Hero headline              | 64-76px, weight 500, tracking -0.045em, leading 1.0 | 40-44px            |
| Section heading            | 44-56px, weight 500, tracking -0.04em, leading 1.05 | 32-36px            |
| Statement paragraph        | 40-48px, weight 500, tracking -0.03em, leading 1.15 | 26-28px            |
| Stat numeral               | 88-110px, weight 300-400, tracking -0.05em       | 56-64px               |
| Card title                 | 20-24px, weight 500                              | 20px                  |
| Body / sub-copy            | 16-18px, `--ink-muted`, max 30-36em              | 16px                  |
| Eyebrow                    | 12-13px uppercase sans, tracking 0.08em          | 12px                  |
| UI fragment text           | 11-14px                                          | same                  |

One sans family does everything (Geist, Inter Display, General Sans, Neue Montreal-like
grotesks). An editorial serif for headings is a valid alternative (one reference uses a light
serif throughout), but then it is the *only* heading face, not an accent.

Radius: choose one family and keep it. Soft (12px cards, 24-32px photo cards, full pills) or
editorial (0-4px cards, full pills). Buttons are always pills, `h-11` to `h-12`.

## 4. Header

- On the canvas colour, not a coloured bar. Height 72-80px. Logo left, 4-5 links centre
  (14-15px, `--ink-muted`, hover `--ink`), one dark pill CTA right ("Get started →").
- Variants that look considered: links inside a pill group with the current item filled;
  logo and a menu button inside one pill on the left.
- Sticky only if it stays light and gains a hairline and slight blur when scrolled.

## 5. Hero

Order, all centred, `max-w-3xl` for the text:

1. **Proof chip** (12-13px): avatar stack + "38,182 users active", or "4.8 ★★★★★", or "Backed by
   …", or an uppercase pill ("SECURE TRANSFER PLATFORM →") in a `--hue-200` fill.
2. **Headline**, two lines, 7-10 words. Line 2 (or the last 2-3 words) in `--ink-muted`:
   `Manage business` / `finances with ease`. Line breaks are deliberate (`<br class="hidden sm:block">`).
3. **Sub-copy**, one sentence, 16-18px muted, `max-w-md`.
4. **Buttons**: dark filled pill with an arrow + outline or plain-text secondary. 12px gap.
5. **The stage**, 40-60px below the buttons, as wide as the container, 460-560px tall:
   - a central object that **is the product**: its dashboard or app screen in a phone or window, or
     the product held in a hand (a card, a device). For a service business, it is what the client
     receives: the proposal, the matched team, the deliverable. A lifestyle stock photo is not a
     central object; photography belongs in later sections. The object must be on-message: an
     agency hero showing an unrelated sample app makes the visitor ask whose product it is;
   - 3-5 UI fragments around it, partly overlapping it, at different heights: a metric card,
     a short list ("This month": two rows with avatar, name, date, amount), a mini chart;
   - at most one or two **cursor tags**, only when collaboration is part of the story, never covering content:: a small coloured label with a pointer arrow, as in a multiplayer design
     tool (`Smart Asset Allocation` in a blue pill, a yellow one on the other side);
   - one background texture behind it: 3-4 concentric circles in `--line`, a dot field fading
     out, or thin circuit lines with small rounded nodes;
   - the stage's bottom edge fades into the canvas or is cut cleanly by the next section.

The first screen shows the chip, headline, buttons and the top half of the stage. The proof row
of logos may sit inside the hero, between buttons and stage.

## 6. Section patterns (pick 6-9)

### Earn distinctiveness inside the layout

Blind reviews of pages built from this guide scored them high on matching the reference taste
but marked them down as "a well-executed template" when nothing was specific to the brand. A
competent page without this guide tends to win on identity. Keep the layout and add all three:

1. **One bespoke device from the product's own world**, used two or three times: ruled ledger
   lines and tally-mark numerals for a bookkeeping app; a white-label toggle ("Your client sees" /
   "Behind the scenes") for an agency; a route line for logistics. It lives inside the tokens and
   layout above (a texture, a numeral style, a card), not as a new colour scheme.
2. **One interactive moment** that lets a visitor try the core idea: a tax set-aside calculator,
   a team configurator, a before/after toggle. Small, keyboard accessible, with a sensible default.
3. **Proof of output**: 2-3 pieces of work with real product screens and one number each, and one
   quote. Process and team sections show how it works; proof shows that it works. Services pages
   without it read as promises.

Keep the numbers consistent across the page (the same count of countries, people, days
everywhere), show the logo row once, and mark invented content where it appears (a small
"Sample" tag), not only in a banner.

**Logo row.** "Trusted by 2,000+ teams" in 15-16px muted, centred; 6-8 greyscale wordmarks at
50-60% opacity, optionally scrolling. Variant: a full-bleed band in the brand's deep shade with
logos in cells separated by vertical hairlines.

**Statement paragraph.** One 2-4 line sentence at 40-48px saying what the company does. The
first half in `--ink`, the rest fading to `--ink-muted` and `--ink-faint` (split into 2-3
spans). Optional small eyebrow chip above. Often on the deep band, then text is light with the
same fade.

**Big stats.** 3-4 numbers in a row separated by 1px vertical rules: `92%` at 100px light weight,
a 15px two-line label beside or under it. One stat can sit beside a section heading with an
avatar stack.

**Staircase.** 3-4 columns whose tinted blocks rise left to right like steps (heights 40%,
55%, 70%, 85%), each with a number (`01`), a stat, a title and one line. Tints step from
`--hue-100` to `--hue-300`. A quote or name card can fill the first column's foot. It turns
"growth" or "progress" into a shape.

**Feature cards in tinted trays.** 3 columns. Each card is a `--hue-200/300` panel holding a
white UI fragment at the top (12-16px padding), then a white tag pill ("Annual yield +18.4%"),
a 22-24px title, two lines of copy, a hairline, and a "Learn more →" row. Use the tint ladder
across the three cards.

**Photo with overlaid UI.** Copy on the left (heading, paragraph, buttons pinned to the bottom of
the column); on the right a portrait photo (rounded or square), with 1-3 white UI cards
overlapping its left edge and bottom.

**Photo cards row.** Two large rounded photo cards (1:1.6 width ratio), each with one UI chip on
it: a coloured balance badge bottom-left, a dark transactions card bottom-right, a select
("Monthly ⌄") top-right.

**Feature band.** A full-width `--hue-100` panel: left, an eyebrow chip and a 44px heading with a
sentence at the bottom; centre, a photo; right, 3 features each with a line icon, a 17px title
and two muted lines.

**Interactive product moment.** One real-looking control centred on a tinted panel (an amount
stepper, a transfer form) so the page shows how the product feels.

**Testimonial band.** Deep-shade full-bleed band, a large quote at 40-48px in light text, a
name with avatar, and prev/next pills with a `01/05` counter.

**Pricing.** 3 cards, one in the deep shade. Price at 48px, a short list of inclusions, one
button per card.

**FAQ.** Heading left (sticky on desktop), accordion right with hairline separators and a `+`.

## 7. Photography and imagery

- Warm natural light, real environments (wood, plants, daylight), people mid-task, not posing.
  Close-ups of hands working on a device or sketching are as useful as faces.
- Crop tightly, round the corners to match the radius family, and overlap a UI card so the
  photo and the product read together.
- Free sources with permissive licences: Unsplash, Pexels. Credit them in the README.
  Never attach invented names or quotes to a stock-photo face; use initials avatars for people
  in UI fragments and testimonials.
- Without photography, the central object can be a drawn phone or product window, but then
  the UI fragments must be rich and realistic.
- Use `next/image` with `sizes`, and `priority` only for the hero image.

## 8. Footer

A `--tray` block (or the deep shade) with: a big closing headline (44-56px, two-tone), numbered
link groups (`01 — Product`, `02 — Company`) with `→` on each link, an email field as one dark pill
with the button inside, social icon squares, contact email right, and a hairline above a
copyright row.

## 9. Mobile

- Headline 40-44px, still two-tone; buttons full-width or side by side if both fit.
- The hero stage keeps the central object and 2 fragments; the rest are hidden, not shrunk.
- Stats stack in a 2x2 grid with horizontal rules; the staircase becomes a stack of rising bars
  or a simple list with the tint ladder.
- Photo + overlay sections stack: photo first, overlays move below or inside the photo's
  bottom edge.

## 10. Checklist

- [ ] Hero canvas is light; there are at most two full-bleed colour bands on the page.
- [ ] Headline is two-tone, weight 500, tracking about -0.045em, 64-76px at 1440px.
- [ ] Hero has a proof chip, one-line sub-copy and a dark pill primary button.
- [ ] Hero stage's central object is the product (or the client's deliverable), on-message, with
      3 realistic UI fragments around it (2 on mobile, none overlapping each other).
- [ ] One bespoke device from the product's world, one interactive moment, and a proof section.
- [ ] Two-tone headings on the hero and at most two other sections.
- [ ] Numbers agree everywhere; logos appear once; placeholders are tagged where they appear.
- [ ] One hue family, used as a tint ladder; accent colour only on small things.
- [ ] At least one statement paragraph with fading text and one big-numeral stats row.
- [ ] Feature cards contain UI fragments, not icons.
- [ ] Photography is warm and real, overlapped by UI; no invented people attached to stock faces.
- [ ] 160-200px between sections at desktop; one idea per section.
- [ ] Mono type appears only inside product fragments.
- [ ] Checked at 390px and in dark mode; nothing overflows.
