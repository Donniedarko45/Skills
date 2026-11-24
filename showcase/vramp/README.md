# VRAMP landing page

A one-page site for VRAMP, a studio that puts senior product teams (design, web, mobile, AI, platform)
inside agencies and companies. Built with Next.js 16 (App Router, static export), React 19,
TypeScript and Tailwind CSS 4, following the skills in `frontend/`.

## The idea behind it

**The name is the concept.** VRAMP sells one thing buyers of outsourced work worry about most:
how fast a strange team becomes a productive one. So the page is built around a *ramp*, the curve
from "brief" to "launched":

- The hero draws a real engagement as a rising line, Day 0 brief → Day 3 first commit → Week 6
  launch, with the matched team pinned to it. The promise ("ramped up in 72 hours") is a chart,
  not an adjective.
- The process section is the same incline, with four steps climbing it.
- The logo is a V that turns into a ramp.

**Two buyers, two doors.** Agencies want a white-label build partner that stays invisible; companies
want a product team without hiring one. Most studio sites blur them together. Here they get one
section each, side by side, each with its own proof laid over a photo: a client update posted under
the agency's name, and a merged, deployed pull request for the company that wants to see work land.

**Proof over adjectives.** Every claim sits next to evidence: case studies with numbers, fixed
prices on the page, a live clock showing which cities in the network are working right now, and a
brief form instead of a "contact us" link. Research on agency and B2B sites (sources below) agrees
that clear pricing, specific outcomes and a short path from intent to conversation are what convert.

**Visual language.** Version 2 follows the crafted fintech and product marketing pages used as
references for the `ui-design` skill (`frontend/skills/ui-design/references/landing-pages.md`):

- a light, warm canvas; a centred two-tone headline (second line muted); a dark pill as the only
  filled button;
- a hero stage built from the product itself: a phone running an app the team shipped, with
  "team matched", "this week" and "first commit" cards floating around it and multiplayer cursor
  tags for two team members;
- one hue (VRAMP blue) used as a ladder of tints, with its deepest shade for exactly one
  full-bleed band (the testimonials);
- the ramp as a staircase: four process steps rising left to right, the last in the deep shade;
- warm photography with UI cards laid over it, big light numerals for stats, Geist throughout.

Motion is limited to a short entrance, cards drifting slowly and live dots, all off under
`prefers-reduced-motion`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
npm run start      # serve out/
npm run typecheck
```

## Before launch

Everything editable lives in `lib/content.ts`.

1. Replace the placeholder clients, case studies, results, quotes, statistics and prices with real
   ones. They are illustrative and must not ship as-is.
2. Set `site.draftNotice` to `false` to remove the draft banner.
3. Set `site.email` and `site.bookingUrl` (a Cal.com or Calendly link works).
4. Wire the brief form (`components/brief-form.tsx`) to a form endpoint or CRM. It currently opens
   the visitor's email app with the brief filled in.
5. Add an Open Graph image in `app/` (`opengraph-image.png`) and a favicon.

## Photos

From Unsplash (free to use under the Unsplash licence). Photo IDs, in `public/photos/`:

- `pair-at-laptop.jpg`: 1531482615713-2afd69097998
- `engineer-at-desk.jpg`: 1551434678-e076c223a692
- `tablet-wireframes.jpg`: 1586717791821-3f44a563fa4c
- `team-at-table.jpg`: 1522071820081-009f0129c71c

Swap in photos of the real team when you have them. People shown in UI cards use initials,
not stock faces.

## Checked

- axe-core: no violations at 1440px and 390px, light and dark
- No horizontal overflow at 390px; no console errors
- Every interactive element reachable by keyboard with a visible focus ring; the mobile menu works
  without JavaScript (`details`/`summary`)

## Sources

- Clay, best web design agencies: https://clay.global/blog/best-web-design-agencies
- KrishaWeb, white-label pricing models: https://www.krishaweb.com/blog/white-label-pricing-model/
- Blend, conversion-focused agency websites: https://www.blendb2b.com/resources/best-website-agencies-for-conversion-focused-websites
- LowCode Agency, B2B website case studies: https://www.lowcode.agency/blog/b2b-website-development-case-studies
- Apexure, B2B website strategy: https://www.apexure.com/blog/2025-07-18-b2b-website-strategy
