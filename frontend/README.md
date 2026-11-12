# Frontend skills

Skills for React, Next.js (App Router), TypeScript and Tailwind CSS. Written against
Next.js 16, React 19 and Tailwind CSS 4; each skill tells Claude to check the project's
installed versions and existing conventions first and to follow those.

| Skill                                          | Triggers on                                                                 | Bundled extras                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`react-components`](skills/react-components)  | writing or refactoring components, pages, hooks; `'use client'` questions    | server/client examples, composition patterns, review checklist |
| [`ui-design`](skills/ui-design)                | any visible UI work; "looks off", polish, responsive, dark mode              | layout recipes, polish checklist                             |
| [`design-system`](skills/design-system)        | theme, tokens, dark mode, shared components and variants, shadcn/ui          | token stylesheet (Tailwind v4 and v3), component recipes     |
| [`accessibility`](skills/accessibility)        | a11y, WCAG, ARIA, keyboard, and any dialog, menu, tabs, form or navigation   | widget patterns, WCAG 2.2 AA checklist, `axe-scan.mjs`       |
| [`web-performance`](skills/web-performance)    | slow pages, Core Web Vitals, Lighthouse, bundle size, jank                   | diagnosis guides, Next.js techniques, `measure-vitals.mjs`   |

## Install

```bash
claude plugin marketplace add Donniedarko45/Skills
claude plugin install frontend@donniedarko45-skills
```

Or in one step inside a session (Claude Code 2.1.275 or later):

```text
/plugin install frontend --marketplace Donniedarko45/Skills
```

## Scripts

Both scripts drive headless Chromium through Playwright and resolve their dependencies from
the project they are run in.

```bash
# Accessibility scan (needs: npm i -D playwright axe-core)
node frontend/skills/accessibility/scripts/axe-scan.mjs http://localhost:3000 --help

# Core Web Vitals and page weight (needs: npm i -D playwright)
node frontend/skills/web-performance/scripts/measure-vitals.mjs http://localhost:3000 --help
```

## Planned

- `forms` - validation, Server Functions, error handling, multi-step flows
- `data-fetching` - server and client data, caching and revalidation, optimistic updates
- `state-management` - URL state, stores, server state
- `frontend-testing` - component and end-to-end tests
- `nextjs-app-router` - routing, layouts, metadata, proxy, deployment concerns
