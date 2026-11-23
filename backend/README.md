# Backend skills

Skills for building HTTP services on TypeScript/Node.js with PostgreSQL. Examples use Next.js
route handlers, Hono, Prisma and plain SQL; each skill notes where Python (FastAPI, SQLAlchemy,
pytest) or other stacks differ, and tells Claude to follow the project's existing conventions
first.

| Skill                                         | Triggers on                                                                        | Bundled extras                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`api-design`](skills/api-design)             | new or changed endpoints, status codes, errors, pagination, versioning, webhooks    | HTTP reference with handler templates, API review checklist |
| [`database`](skills/database)                 | schema changes, migrations, indexes, slow queries, transactions, multi-tenancy      | safe-migration recipes, query-tuning guide, `check-migration.py` |
| [`auth-security`](skills/auth-security)       | login, sessions, tokens, permissions, tenant isolation, secrets, security reviews    | auth flow recipes, OWASP-mapped review checklist             |
| [`backend-testing`](skills/backend-testing)   | adding tests, testing endpoints and jobs, real-database tests, flaky or slow suites  | test infrastructure recipes (Vitest, Testcontainers, MSW, pytest) |
| [`observability`](skills/observability)       | logging, metrics, tracing, OpenTelemetry, error tracking, health checks              | instrumentation recipes for Node, Next.js and Python         |
| [`background-jobs`](skills/background-jobs)   | emails, webhooks, queues, cron, imports, retries, outbox, long-running work          | outbox, SKIP LOCKED worker, BullMQ and pg-boss patterns      |

## Install

```bash
claude plugin marketplace add Donniedarko45/Skills
claude plugin install backend@donniedarko45-skills
```

## Script

`check-migration.py` flags PostgreSQL migration statements that lock or rewrite tables (index
builds without `CONCURRENTLY`, `NOT NULL` additions, type changes, renames, drops, missing
`lock_timeout`), each with the safe alternative. It needs only Python 3.

```bash
python3 backend/skills/database/scripts/check-migration.py migrations/*.sql
python3 backend/skills/database/scripts/check-migration.py prisma/migrations/*/migration.sql --fail-on medium
```

Exit code 1 when findings reach the `--fail-on` level (default `high`), so it can gate CI.
