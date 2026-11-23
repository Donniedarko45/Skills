# Skills

Agent skills for Claude, organised by engineering discipline. Each skill is a folder with a
`SKILL.md` that Claude loads when a task calls for it, plus reference files and scripts it
reads or runs only when needed.

| Section                | Status      | What it covers                                                                 |
| ---------------------- | ----------- | ------------------------------------------------------------------------------ |
| [`frontend/`](frontend) | 5 skills    | React, Next.js (App Router), TypeScript, Tailwind CSS                           |
| [`backend/`](backend)   | 6 skills    | TypeScript/Node and PostgreSQL: APIs, database, auth, testing, observability, jobs |
| [`devops/`](devops)     | 6 skills    | GitHub Actions, Docker, Terraform/OpenTofu, Kubernetes, monitoring, incidents     |

## Frontend skills

| Skill                                                    | Use it for                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`react-components`](frontend/skills/react-components)   | Building and reviewing components: server/client boundary, props APIs, state, effects, types  |
| [`ui-design`](frontend/skills/ui-design)                 | Making UI look right: hierarchy, spacing, typography, colour, responsive, states, motion      |
| [`design-system`](frontend/skills/design-system)         | Tokens, theming and dark mode, component variants, shadcn/ui and headless primitives          |
| [`accessibility`](frontend/skills/accessibility)         | Building accessible UI and auditing against WCAG 2.2 AA, with an axe-core scan script         |
| [`web-performance`](frontend/skills/web-performance)     | Core Web Vitals, bundle size and rendering performance, with a lab measurement script         |

## Backend skills

| Skill                                                    | Use it for                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`api-design`](backend/skills/api-design)                | Endpoint shapes, status codes, errors, pagination, idempotency, versioning, webhooks          |
| [`database`](backend/skills/database)                    | PostgreSQL schemas, indexes, query tuning, transactions, safe migrations (with a checker)     |
| [`auth-security`](backend/skills/auth-security)          | Authentication, sessions, authorization and tenant isolation, secrets, security review        |
| [`backend-testing`](backend/skills/backend-testing)      | Integration and API tests against a real database, mocks, time, flaky and slow suites         |
| [`observability`](backend/skills/observability)          | Structured logs, metrics, OpenTelemetry tracing, error tracking, health checks                |
| [`background-jobs`](backend/skills/background-jobs)      | Queues, retries, idempotent handlers, the outbox pattern, scheduled and long-running jobs     |

## DevOps skills

| Skill                                                    | Use it for                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`ci-cd`](devops/skills/ci-cd)                           | Fast, secure GitHub Actions pipelines and deploys (with a workflow security audit)            |
| [`containers`](devops/skills/containers)                 | Small, secure, cache-friendly Dockerfiles; signal handling; Compose for local development     |
| [`infrastructure-as-code`](devops/skills/infrastructure-as-code) | Terraform/OpenTofu layout, state, plan review, refactoring, CI                       |
| [`deployment`](devops/skills/deployment)                 | Zero-downtime rollouts, Kubernetes manifests, feature flags, rollback, release checklists     |
| [`monitoring-alerting`](devops/skills/monitoring-alerting) | SLOs, burn-rate alerts, dashboards, runbooks, on-call readiness                             |
| [`incident-response`](devops/skills/incident-response)   | Running live incidents, status communication, blameless postmortems                          |

## Install

The repository is a Claude Code plugin marketplace. Each section is a plugin.

```bash
claude plugin marketplace add Donniedarko45/Skills
claude plugin install frontend@donniedarko45-skills
claude plugin install backend@donniedarko45-skills
claude plugin install devops@donniedarko45-skills
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
      assets/                       files the skill copies or adapts (optional)
      evals/                        test cases: prompt, expected outcome, checks, starting project
backend/                            same shape
devops/                             same shape
```

## Adding or changing a skill

1. Create `<section>/skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter.
   The description is what Claude sees when deciding whether to load the skill, so say what
   the skill does and list the situations and phrases that should trigger it. It is a plain
   YAML value: avoid a colon followed by a space inside it, or the skill silently fails to load.
2. Keep `SKILL.md` under about 500 lines. Put long examples, checklists and tables in
   `references/` and point to them from `SKILL.md` with a line on when to read each.
3. Explain the reasoning behind each instruction. A model that understands why can handle
   cases the skill did not anticipate.
4. Put repeatable, deterministic work in `scripts/` and test the script before committing.
5. When a section gets its first skill, add its plugin to `.claude-plugin/marketplace.json`.
6. Validate before pushing:

   ```bash
   claude plugin validate .
   for p in frontend backend devops; do claude plugin validate ./$p; done
   ```
