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
