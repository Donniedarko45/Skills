# Skills

Agent skills for Claude, organised by engineering discipline. Each skill is a folder with a
`SKILL.md` that Claude loads when a task calls for it, plus reference files and scripts it
reads or runs only when needed.

| Section                | Status      | What it covers                                                                 |
| ---------------------- | ----------- | ------------------------------------------------------------------------------ |
| [`frontend/`](frontend) | 5 skills    | React, Next.js (App Router), TypeScript, Tailwind CSS                           |
| [`backend/`](backend)   | planned     | API design, data modelling, auth, testing, observability                        |
| [`devops/`](devops)     | planned     | CI/CD, containers, infrastructure as code, deployment, incident response        |

## Frontend skills

| Skill                                                    | Use it for                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`react-components`](frontend/skills/react-components)   | Building and reviewing components: server/client boundary, props APIs, state, effects, types  |
| [`ui-design`](frontend/skills/ui-design)                 | Making UI look right: hierarchy, spacing, typography, colour, responsive, states, motion      |
| [`design-system`](frontend/skills/design-system)         | Tokens, theming and dark mode, component variants, shadcn/ui and headless primitives          |
| [`accessibility`](frontend/skills/accessibility)         | Building accessible UI and auditing against WCAG 2.2 AA, with an axe-core scan script         |
| [`web-performance`](frontend/skills/web-performance)     | Core Web Vitals, bundle size and rendering performance, with a lab measurement script         |

## Install

The repository is a Claude Code plugin marketplace. Each section is a plugin.

```bash
claude plugin marketplace add Donniedarko45/Skills
claude plugin install frontend@donniedarko45-skills
```

Inside a session, the same commands work as `/plugin marketplace add Donniedarko45/Skills` and
`/plugin install frontend@donniedarko45-skills`. Skills then load automatically when relevant,
and can be invoked directly, for example `/frontend:accessibility`.

To use a single skill without the plugin, copy its folder into a project's `.claude/skills/`
or into `~/.claude/skills/`.

To try local changes without installing:

```bash
claude --plugin-dir ./frontend
```

## Layout

```text
.claude-plugin/marketplace.json     the marketplace: lists the plugins below
frontend/
  .claude-plugin/plugin.json        plugin manifest
  skills/
    <skill-name>/
      SKILL.md                      instructions; frontmatter name + description decide when it loads
      references/                   deeper material, read on demand
      scripts/                      helpers the skill runs
backend/                            same shape, skills to come
devops/                             same shape, skills to come
```

## Adding or changing a skill

1. Create `<section>/skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter.
   The description is what Claude sees when deciding whether to load the skill, so say what
   the skill does and list the situations and phrases that should trigger it.
2. Keep `SKILL.md` under about 500 lines. Put long examples, checklists and tables in
   `references/` and point to them from `SKILL.md` with a line on when to read each.
3. Explain the reasoning behind each instruction. A model that understands why can handle
   cases the skill did not anticipate.
4. Put repeatable, deterministic work in `scripts/` and test the script before committing.
5. When a section gets its first skill, add its plugin to `.claude-plugin/marketplace.json`.
6. Validate before pushing:

   ```bash
   claude plugin validate .
   claude plugin validate ./frontend
   ```
