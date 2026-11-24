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

Score each criterion 1-10 with one sentence of visible evidence, as a demanding reviewer would.
7 is solid professional work; 9 is something you would show as a reference. Do not report until
every criterion is at least 7, and push the two lowest up before anything else.

| Criterion | A 6 looks like | A 9 looks like |
| --------- | -------------- | -------------- |
| Hierarchy and first impression | several things compete; two filled buttons | one focal point, one action, an obvious reading order |
| Typography | many sizes, default tracking, lone last words | 6-9 sizes, size-specific tracking and leading, balanced lines, real punctuation |
| Layout and spacing | equal gaps everywhere, many edges | grouping by space, few edges, varied section rhythm |
| Colour and restraint | several accents, decorative colour | one hue doing one job, tested contrast pairs, designed dark mode |
| Storytelling | features listed with icons | the product shown working; proof of output |
| Copy | generic claims, "Learn more" | specific to this audience, numbers that agree, outcome buttons |
| Mobile | stacked desktop, collisions, small targets | recomposed hero, 44 px targets, nothing clipped |
| Detail and polish | radius and shadow sprawl, stray misalignment | one radius family, two shadow levels, every state designed |
| Accessibility | axe issues, faint muted text | zero axe issues, visible focus, readable everywhere |
| Distinctiveness | could be any brand's page | a concept and signature device only this product could own |

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
