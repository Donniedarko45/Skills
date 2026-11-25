# Landing page benchmark results

Each round: fresh agents build the same brief in identical Next.js 16 projects, one with this skill
and one without. Pages are built, screenshotted at 1280 and 390 px (and dark), scanned with axe,
then scored blind by a separate judge with a 10-criterion rubric (/100). From round 2 the judge
also scores, after the rubric, how closely each page matches the client's reference designs (/10).

| Round | Brief | Without skill | With skill | Taste match without | Taste match with |
| ----- | ----- | ------------- | ---------- | ------------------- | ---------------- |
| 1 | Tally (bookkeeping app) | 81 | 82 | not scored | not scored |
| 2 | Tally (bookkeeping app) | 86 | 80 | 5 | 9 |
| 2 | VRAMP (product agency) | 80 | 79 | 4 | 9 |
| 3 | Tally (bookkeeping app) | 86 (round 2 page) | 83 | 5 | 9 |
| 3 | VRAMP (product agency) | 80 (round 2 page) | 82 | 4 | 9 |
| 3 | Ember (sourdough bakery) | 76 | 82 | not scored | not scored |

All pages in round 2 built, type-checked, had no console errors or horizontal scroll, and passed
axe with zero violations at both widths.

## What round 2 showed

- The skill reliably moves output to the reference taste (9/10 against 4-5/10).
- On the general rubric it was level (VRAMP) or behind (Tally, -6). The baseline's pages won on
  distinctiveness and product storytelling: a bespoke concept (ledger paper and tally marks;
  a team configurator and comparison table) and a hero that showed the real product.
- With-skill pages lost points for a stock photo as the hero centrepiece, busy hero collages with
  cursor tags, the two-tone heading repeated on every section, and (VRAMP) no proof of work.

## Changes made after round 2

`references/landing-pages.md`: the hero's central object must be the product or the client's
deliverable; at most one or two cursor tags and three fragments; two-tone headings limited; a new
"Earn distinctiveness inside the layout" block requiring one bespoke device, one interactive
moment and a proof section; consistent numbers and in-place placeholder tags; new failure-mode
rows and checklist items.

## Round 3 (after the creative-direction, craft and critique rebuild)

The with-skill pages were rebuilt with the new skill and judged against the same round-2
no-skill pages, plus a new non-tech brief (a bakery) built both ways. In round 3 the Tally and
VRAMP with-skill prompts also included a written description of the client's reference designs;
the round-2 no-skill pages did not have it (this mainly affects the taste score).

- With-skill scores rose by 3 points on both repeated briefs (Tally 80 to 83, VRAMP 79 to 82):
  VRAMP now wins (82 vs 80) and Tally's gap halved (83 vs 86), with taste match held at 9/10.
- On the bakery the skill chose a warm editorial direction (not the fintech default), built a
  "bakery clock" concept, and won clearly (82 vs 76) on restraint, finish and dark mode.
- The concepts landed (tally marks; a "credit the work to: your name / ours" toggle; oven times),
  but distinctiveness still scored 7 where the reference taste dominates the first screen.

Changes made after round 3: the signature device must be visible on the first screen; a service
business's biggest hero object is its own artifact, and physical products need large product
photography; mobile headers keep a menu; the design audit now checks overlaps inside decorative
hero fragments (it missed the Tally mobile hero collision before).
