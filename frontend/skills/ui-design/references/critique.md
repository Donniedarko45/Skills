# Critique: review your own work like a design director

First drafts are never the work. The difference between competent and excellent is usually
two honest critique rounds. Do at least two before reporting, and one more after any big change.

## Contents

1. Capture
2. The tests
3. Score it
4. Symptom to fix
5. Fresh eyes
6. Report

## 1. Capture

Look at the rendered page, never the code. With the page running:

```bash
node <skill>/scripts/shoot.mjs http://localhost:3000 ./shots --widths 390,1280 --dark
node <skill>/scripts/design-audit.mjs http://localhost:3000
node <skill>/scripts/design-audit.mjs http://localhost:3000 --viewport 390x844
node <accessibility skill>/scripts/axe-scan.mjs http://localhost:3000 --reduced-motion
```

`shoot.mjs` writes the first screen and full page per width, the page cut into readable
sections, and three critique views: `squint` (blurred), `grey` (greyscale) and `thumb` (the whole
page at 20%). Open every section image, at both widths. `design-audit.mjs` measures what eyes
miss: type-size sprawl, lone last words, clipped or overlapping text, off-scale spacing, radius
and shadow sprawl, small tap targets, distorted or soft images, competing buttons, fonts that
silently fell back. Fix every FAIL; treat each WARN as a question to answer.

## 2. The tests

Run each one and write one line of result.

| Test | How | Passes when |
| ---- | --- | ----------- |
| **Squint** | `squint.png` | The one focal element and the primary button are still obvious when blurred. |
| **Greyscale** | `grey.png` | Hierarchy survives without hue; nothing important relies on colour. |
| **Thumbnail** | `thumb.png` | Sections alternate in density and tone; there is a clear beginning, middle and end; no long run of look-alike blocks. |
| **Five seconds** | Look at the first screen for five seconds, then look away | You can say what it is, who it is for and what to do next. |
| **Logo swap** | Imagine a competitor's logo on it | It would *not* work for them. If it would, the concept layer is missing (`creative-direction.md`). |
| **Remove one thing** | For each section, ask what could go | Nothing can go without loss. Usually something can: remove it. |
| **Reference side by side** | Put the first screen next to the user's references at the same width | Same vocabulary and proportions (type scale, spacing, colour weight), different content. |
| **Mobile first screen** | `*-390-fold.png` | Headline readable in three lines or fewer, primary action visible, visual not colliding. |
| **Dark mode** | `*-dark-*.png` | Every surface is distinguishable, no pale fills behind white text, chips readable. |
| **Stress** | Long names, a 7-digit number, an empty list, a missing image | Layout holds and still looks intended. |

## 3. Score it

Score each criterion 1-10 with one sentence of visible evidence, as a demanding blind reviewer
would. 7 is solid professional work; 9 is something you would show as a reference. **The bar is
9 on every criterion** (a page above 90/100). Score yourself one point lower than feels fair:
self-scores in testing ran a point above blind reviewers. A criterion is not a 9 until every
condition in its row holds.

| Criterion | A 9 requires (all of it) |
| --------- | ------------------------ |
| Hierarchy and first impression | One focal element; the dark (ink) half of the headline is the whole promise on its own; one filled button directly under the copy; the hero stage has the central object plus at most three fragments, none over the object's key figure |
| Typography | A display face chosen for the concept (not a framework default unless the concept carries it); 6-9 sizes; tracking and leading set per size; two-tone on the hero and at most two other headings; nothing readable under 12 px outside product fragments, nothing under 11 px anywhere; no lone last words |
| Layout and spacing | Few alignment edges; no card with more than about 64 px of dead space inside; card internals align across a row; no two consecutive sections with the same structure; a resting place every few sections |
| Colour and restraint | One hue ladder plus at most two meaning colours, each with a named job in the style sheet (income/expense, live/primary); one deep band; no glows or gradients; muted text at 4.5:1 even when large |
| Storytelling | The hero object is the product or the deliverable; every feature is shown working; one interactive moment; proof of output (work with screens and a number); physical products shown large |
| Copy | Specific to this audience and domain; figures agree everywhere; every invented fact tagged where it appears (names, numbers, prices, addresses); buttons name outcomes |
| Mobile | Recomposed hero with at most two fragments, none overlapping text; a menu when the desktop header has links; 44 px targets; placeholders fit their fields; nothing truncated in the first screen |
| Detail and polish | One radius family, two or three tinted shadow levels, designed dark mode, typographic punctuation, finished footer, every state designed |
| Accessibility | Zero axe issues; muted and small text visibly readable (not just passing); visible focus; links and placeholder tags look different from each other |
| Distinctiveness | Logo swap fails; the signature device is visible on the first screen; at least two stock sections (logo row, stats row, three-card features, three-tier pricing, FAQ) are replaced or reshaped by the concept |

### What blind reviewers marked down (rounds 2 and 3)

Each of these cost a point somewhere. Check every one before reporting:

- hero collage with a phone, four floating cards and a toast ("busy"); cards covering the phone on mobile
- the muted second line of the headline carrying the actual promise ("weakens the key promise")
- an agency hero whose biggest object is a sample client app ("reads as a fintech product")
- the two-tone heading on four or more sections ("becomes a tic"); a full-width statement paragraph
- tiny letter-spaced mono labels and grey heading halves ("hard to read", even when axe passes)
- 100-150 px of empty space inside feature cards; uneven step spacing; empty corners
- a single soft hue with nothing else ("flat and familiar"); a mint or periwinkle card grid
- centred sans hero + phone with floating cards + pastel cards + three-tier pricing ("today's standard template")
- no mobile menu; a clipped input placeholder; truncated text in the first mobile screen
- invented details (an address on a real street) not tagged as placeholders
- small product thumbnails for a physical product

## 4. Symptom to fix

| Symptom | Usual cause | Fix |
| ------- | ----------- | --- |
| Looks generic | no concept; layout and copy could be anyone's | Add the signature device and product-specific proof; rewrite the headline from the product's world |
| Flat, nothing stands out | weak scale contrast; everything medium | Make the focal element bigger and the rest smaller and quieter |
| Busy | too many elements, edges and colours | Remove, group, align to fewer edges, drop to one accent |
| Cramped | padding below group gaps; no section space | Double section padding; space around groups 2x space inside |
| Empty or sparse | space without structure; tiny content in big boxes | Tighten the container, enlarge content, add one strong visual |
| Disjointed | ad-hoc sizes, radii, shadows | Re-derive from the style sheet; run the audit until sprawl warnings clear |
| Muddy colour | several hues of similar weight; grey neutrals against tints | One hue ladder; tint the neutrals; reserve saturation for meaning |
| Hero does not land | lifestyle photo as centrepiece; vague headline | Make the product (or deliverable) the central object; headline with outcome plus mechanism |
| Template feel below the fold | identical section structure repeated | Vary layouts; insert a statement, a full-bleed band, an interactive moment |
| Cheap details | straight quotes, hyphens for ranges, grey shadows, default focus | Apply `visual-craft.md` section 9 |
| Mobile collisions | absolutely positioned fragments kept from desktop | Hide or reflow fragments below `sm`; keep the object plus two |

## 5. Fresh eyes

Your own critique is biased toward what you meant to build. If you can start a subagent, ask
one to score the screenshots blind with the table in section 3 (give it only the images and the
brief, not your code or intent) and fix what it flags. If not, write the critique as a design
director who did not make the page, then act on it.

## 6. Report

Say what you changed and why in design terms (hierarchy, rhythm, contrast, concept), list the
critique scores before and after if you scored them, mention any WARN you deliberately kept and
why, and include screenshots when the environment can share them.
