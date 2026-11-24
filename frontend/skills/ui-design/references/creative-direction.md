# Creative direction: from brief to a page with a point of view

Rules make a page correct. A point of view makes it memorable. This file is the thinking that
happens before any layout: what the page should feel like, the one idea that makes it belong to
this product, and the written style sheet that keeps every section consistent.

## Contents

1. Three layers: taste, concept, craft
2. Write the brief
3. Find the concept (diverge, then choose)
4. Signature devices
5. Art-direction archetypes (when nothing is given)
6. Working from references: teardown, then translate
7. The style sheet: write it before code
8. Worked examples

## 1. Three layers: taste, concept, craft

Every strong page is three layers stacked in this order:

| Layer       | Question it answers                         | Comes from                                                      |
| ----------- | ------------------------------------------- | --------------------------------------------------------------- |
| **Taste**   | What visual vocabulary do we speak?         | The user's references or house style; else an archetype (section 5) |
| **Concept** | What does *this* product say with it?       | The product's own world: its name, materials, data, promise     |
| **Craft**   | Is every detail executed precisely?         | `visual-craft.md`, the checklists, the audit script             |

Measured lesson: blind reviews of landing pages built with only the taste layer scored 9/10 on
"matches the client's references" but lost to plainer briefs on distinctiveness ("a
well-executed template"). Pages with a concept but no taste layer won on identity and missed the
client's taste (4-5/10). The target is both: the client's vocabulary, saying something only this
product could say, executed without flaws.

Taste is not negotiable when the user has given it (references, a brand, an existing app).
Concept lives *inside* it: a texture, a numeral style, a diagram, an interaction, a headline. It
never replaces the vocabulary with a new colour scheme or layout grammar.

## 2. Write the brief

Five lines, written down before designing. If the user did not give an answer, infer it and
state the assumption.

```
Product:   what it is, in one sentence a customer would use
Audience:  who, and the moment they arrive (searching for a fix? comparing vendors? curious?)
Job:       the one thing this screen must make them do or believe
Feeling:   two adjectives, each with what it must NOT become ("precise, not cold"; "warm, not cute")
Givens:    references, existing tokens and components, brand assets, content that must appear
```

The "not" halves matter most: they are where designs usually go wrong.

## 3. Find the concept (diverge, then choose)

Do not build the first idea. Write three concept directions, each in a short card, then pick.

**Where concepts come from** (mine the product's world, not other websites):

- **Artifacts of the domain**: the ledger, receipt, invoice, boarding pass, blueprint, lab
  notebook, recipe card, contract, shipping label, score sheet. Their textures, numbering and
  layouts are free, recognisable design material.
- **The name**: VRAMP becomes a ramp (a rising staircase, a line climbing); Tally becomes tally
  marks used as numerals and as the logo.
- **The data's own shape**: time zones become a row of live clocks; growth becomes steps;
  a pipeline becomes a route line; a schedule becomes a timeline.
- **The promise made literal**: "white-label" becomes a toggle between *Your client sees* and
  *Behind the scenes*; "set aside tax as you go" becomes a calculator that splits a payment.
- **The user's ritual**: the Friday demo, the quarterly tax panic, the 3 a.m. alert, the Sunday
  budget. Show the moment the product changes.
- **A tension the product resolves**: chaos to order, many tools to one, guess to number.

**Concept card** (one per direction):

```
Name:       Ledger
Idea:       the books, made calm: Tally as the tidy ledger a freelancer never keeps
Device:     ruled-paper texture + tally-mark numerals + a torn receipt showing the tax maths
Type:       serif display for headings, grotesk for UI, mono for figures
Colour:     cream paper, forest green, mustard for "set aside", terracotta for expenses
Imagery:    the product dashboard as hero; real freelancers at work further down
Motion:     numbers tick up; the receipt prints in
Risk:       looks old-fashioned if the UI fragments are not modern and crisp
```

**Choose** the direction that scores best on: fits the brief's feeling and the taste layer;
carries through at least three sections (not just the hero); can be built well in code (no
illustration you cannot produce); survives at 390 px; and does not hurt usability or legibility.
Say which you picked and why in one sentence, in the reply.

**Reject** concepts that are only a colour, puns that need explaining, devices that would sit
on top of content, and anything that would make the page look like a specific existing brand.

## 4. Signature devices

A signature device is the one recurring element a visitor would describe afterwards ("the one
with the ledger lines"). One device, used two to four times, each time carrying meaning.

| Kind               | Examples                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| Surface or texture | ruled paper, blueprint grid, fine grain, dot field, topographic lines            |
| Numerals           | tally marks, mono counters, roman numerals for steps, step numbers in circles    |
| Shape language     | ticket notches, receipt zig-zag edge, folder tabs, stamp outlines, pill rails    |
| Recurring diagram  | staircase of steps, route line between sections, timeline, rising curve          |
| Interactive toy    | calculator, configurator, before/after toggle, slider, live clock, playground    |
| Typographic move   | a giant cropped wordmark, two-tone headlines, a counter that rolls, annotated words |
| Framing device     | multiplayer cursor tags, margin annotations, redaction bars, sticky-note callouts |

Rules: the device uses the page's tokens (it is the same palette and type, used cleverly); it
never covers content; it has a reduced-motion version; and if removing it makes no section
worse, it was decoration.

## 5. Art-direction archetypes (when nothing is given)

If the user shared references or there is a house style, that is the taste layer; skip this.
For this plugin the default taste is the crafted product look in `visual-style.md` and
`landing-pages.md`. Choose a different archetype only when the product clearly does not fit it,
and say why.

| Archetype           | Suits                                      | Type                                   | Colour                                   | Shape and imagery                              | Motion                 | Pitfall                         |
| ------------------- | ------------------------------------------ | -------------------------------------- | ---------------------------------------- | ---------------------------------------------- | ---------------------- | ------------------------------- |
| Crafted product (default) | SaaS, fintech, dev and B2B products  | one grotesk, medium weights, two-tone  | warm neutral + one hue as tint ladder    | soft radii; product UI fragments; warm photos  | quiet, short           | template sameness without a concept |
| Editorial           | agencies, studios, publishers, premium services | serif display + grotesk + small mono | cream, ink, one bold accent           | numbered sections, rules, big margins          | minimal                | italic-accent-word cliché       |
| Technical           | infrastructure, APIs, security, data tools  | grotesk + mono for real data           | near-black or white, one signal colour   | hairline grids, diagrams, code, terminals      | precise, linear        | cold, wall of code              |
| Warm and human      | health, education, community, consumer      | rounded or humanist sans               | soft tints, warm photography             | large radii, people, hand-drawn accents        | gentle, springy        | childish, low contrast          |
| Bold and expressive | consumer brands, events, creative tools     | oversized display, tight tracking      | saturated blocks, high contrast          | collage, cut-outs, full-bleed colour           | energetic, kinetic     | noisy, poor readability         |
| Quiet luxury        | hospitality, fashion, real estate, craft    | light serif, generous letter spacing   | muted, tonal, almost monochrome          | full-bleed photography, thin rules             | slow fades             | empty, slow to scan             |

## 6. Working from references: teardown, then translate

When the user shares screenshots or links of designs they like, take them apart before building.

1. **Scale.** Find the screenshot's design width (a 1480 px wide capture of a 1440 site is
   about 1.03x). Convert every measurement to CSS px.
2. **Measure** the headline size, body size, container width, section spacing, card padding,
   radii and button heights. Write them down as numbers.
3. **Sample colours** with `scripts/palette.mjs <images>`: it prints each image's dominant
   colours as OKLCH with suggested roles (canvas, ink, deep band, accent, tints).
4. **List the anatomy**: the sections in order, and what each one's job is.
5. **Name the moves** that make them good (a centred two-tone headline, product UI floating
   around a central object, a tint ladder of one hue, a staircase of stats). These are the
   taste layer.
6. **Translate, never copy.** Keep the vocabulary and proportions; replace the specific
   composition, illustrations, copy and brand marks with the product's own. Do not recreate a
   specific existing site.
7. **Compare side by side** at the same width when the first draft renders (see `critique.md`).

## 7. The style sheet: write it before code

A dozen lines that every section must obey. Put it in the reply or in a comment at the top of
the stylesheet; it is what keeps section nine consistent with section one.

```
Concept:   Ledger. Device: ruled lines (hero, tax section), tally numerals (steps), torn receipt (maths)
Type:      Display serif 64/72 -0.03em 500; UI grotesk 16/1.55; figures mono tabular; 7 sizes total
Colour:    canvas cream, ink green-black, accent mustard (set-aside only), terracotta (expenses only)
           text-on-fill tokens fixed in both themes; contrast pairs listed and tested
Shape:     radius 8 / 14 / 24 / pill; hairline borders; 2 shadow levels, tinted
Space:     section padding 160 desktop / 96 mobile; container 1200; 12-col grid, 5/7 splits
Imagery:   product UI as hero; real freelancers at work, warm light, rounded 24 frame
Motion:    figures tick up once; 60ms stagger in reading order; nothing loops except the live dot
Never:     gradients, glow, emoji icons, more than one filled button per view, stock handshakes
```

## 8. Worked examples

**Tally (bookkeeping for freelancers).** Strong concept: Ledger (above). The ledger lines and
tally numerals appear in the logo, the hero background, the step numbers and the receipt that
shows the tax calculation, so the idea runs the length of the page. Inside the crafted-product
taste, the same concept would keep the centred two-tone hero and tint ladder, and add the ruled
texture to the hero stage, tally numerals to the feature cards, and the receipt as the "how the
estimate works" fragment.

**VRAMP (senior product teams for agencies and companies).** Candidate concepts:

- *White-label*: a toggle card, *Your client sees* (everything in the agency's brand) /
  *Behind the scenes* (the VRAMP team, cities, years). Proves the core promise interactively.
- *The ramp*: a rising staircase for the process and a climbing line from brief to launch.
- *Follow the sun*: live clocks of the team's cities, a 24-hour coverage bar.

The strongest page uses one as the signature (the white-label toggle in the hero stage, the
central object being the agency-branded deliverable) and lets one other appear once (the
staircase for process). A hero showing an unrelated sample app was judged off-message: the
central object must be what the visitor buys.
