---
name: database
description: Design PostgreSQL schemas, write and review migrations, index and tune queries, and handle transactions, locking, multi-tenancy and connection pooling - with raw SQL or an ORM (Prisma, Drizzle, Kysely, TypeORM, SQLAlchemy). Use this whenever creating or changing tables, columns, indexes, constraints or migrations; when a query or endpoint is slow; when choosing column types, primary keys or how to store money, time, JSON or enums; when dealing with race conditions, deadlocks, N+1 queries or "too many connections"; or when reviewing a migration before it runs in production. Use it even for a one-column change, because migrations on large tables can lock production.
---

# Database (PostgreSQL)

The database outlives every service that talks to it. Get the schema right and the constraints
in place, and whole classes of bugs become impossible; get a migration wrong and production
stops. So: let the database enforce what must be true, index for the queries you actually run,
and treat every migration as something that will run against a large, busy table.

## 1. Read the existing setup first

- Which Postgres version (features like `uuidv7()`, `MERGE`, `NULLS NOT DISTINCT` depend on it),
  which migration tool (Prisma Migrate, Drizzle Kit, Knex, Flyway, Alembic, plain SQL files), and
  which access layer (ORM, query builder, raw SQL).
- Existing conventions: table and column naming (`snake_case`, plural tables), primary key type,
  timestamp columns, soft-delete pattern, tenant column.
- How big the tables are in production, when that is knowable. A migration that is instant on
  1,000 rows can lock a 200-million-row table for an hour.

Follow the project's conventions; use the defaults below where it has none.

## 2. Schema defaults

| Need                 | Use                                                         | Avoid                                            |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Primary key          | `bigint generated always as identity`, or `uuid` (v7 for time ordering: `uuidv7()` in Postgres 18+, else generated in the app) | `serial`; random UUIDv4 as a clustered key on huge insert-heavy tables |
| Public identifier    | a separate opaque `text` id (`inv_01J...`) or the UUID       | exposing sequential integers in URLs              |
| Text                 | `text` with a `check (length(x) <= n)` when a limit matters  | `varchar(255)` by habit                           |
| Time                 | `timestamptz` (stores UTC)                                  | `timestamp` without time zone                     |
| Calendar dates       | `date`                                                      | timestamps at midnight                            |
| Money                | `bigint` minor units + `currency char(3)`, or `numeric(19,4)` | `float`, `real`, `money`                         |
| Enumerations         | `text` + `check (status in (...))`, or a lookup table       | Postgres `enum` types if values change often (adding is easy, removing is not) |
| Flexible attributes  | `jsonb` for genuinely schemaless data, with a GIN index if queried | `jsonb` for data with a known shape you filter and join on |
| Booleans             | `boolean not null default false`                            | nullable booleans (three states)                  |

Every table gets `created_at timestamptz not null default now()` and, if rows change,
`updated_at` (set by the application or a trigger).

## 3. Let the database enforce the rules

Application checks race; constraints do not. Encode every invariant you can:

- `not null` by default. A nullable column must have a reason.
- Foreign keys for every reference, with an explicit `on delete` (`restrict` by default,
  `cascade` only for true ownership).
- `unique` constraints for natural uniqueness (`unique (tenant_id, lower(email))` via a unique
  index on the expression). Never "check then insert" in code: two requests will both pass the
  check.
- `check` constraints for ranges and states: `check (amount_cents >= 0)`,
  `check (ends_at > starts_at)`.
- Exclusion constraints for no-overlap rules (bookings): `exclude using gist (room_id with =, tstzrange(starts_at, ends_at) with &&)`.

Then handle the constraint violation as a normal outcome: map unique-violation (`23505`) to a
409, foreign-key violation (`23503`) to a 422 or 404.

## 4. Indexes: for the queries you run

- Index every foreign key column you join or filter on (Postgres does not do it automatically).
- **Composite index order**: equality columns first, then the range or sort column:
  `(tenant_id, status, created_at desc)` serves `where tenant_id = $1 and status = $2 order by created_at desc`.
- **Partial indexes** for hot subsets: `create index ... on invoices (due_on) where status = 'sent'`.
- **Covering indexes** (`include (...)`) when an index-only scan would avoid heap reads.
- **Expression indexes** to match how you query: `on users (lower(email))`.
- GIN for `jsonb` containment and arrays; `pg_trgm` GIN for `ILIKE '%term%'` search.
- Every index slows writes and costs memory. Do not add one without a query that needs it, and
  drop unused ones (`pg_stat_user_indexes.idx_scan = 0` over a representative period).

## 5. Make queries fast

1. Find the slow query (`pg_stat_statements` sorted by total time, the APM trace, or the slow
   query log). Optimize what costs the most in total, not the slowest single run.
2. `explain (analyze, buffers)` it with realistic data and parameters. Read it bottom-up: look
   for sequential scans on big tables, row-estimate errors of 10x or more, sorts spilling to
   disk, and nested loops over large inputs.
3. Fix the cause: a missing or wrong-order index, a non-sargable predicate
   (`where date(created_at) = ...` instead of a range), a stale statistic (`analyze`), or the query
   shape itself.
4. Re-run `explain analyze` and compare.

Query-shape problems in application code:

- **N+1**: a loop that queries once per row. Fetch in one query with a join or `where id = any($1)`,
  or use the ORM's include/eager loading deliberately.
- **Over-fetching**: `select *` of wide rows, or loading thousands of rows to count them. Select
  the columns you need; count with `count(*)` (or an estimate for huge tables).
- **Offset pagination** deep into a table reads and discards every skipped row. Use keyset
  pagination (`where (created_at, id) < ($1, $2)`).
- **Unbounded queries**: every list query has a `limit`.

Details and plan-reading notes in `references/query-tuning.md`.

## 6. Transactions and concurrency

- Group writes that must succeed or fail together in one transaction; keep transactions short,
  and never make network calls (HTTP, email, queues) inside one.
- Default isolation (Read Committed) allows lost updates in read-modify-write code. Prevent them
  with one of: an atomic update (`update accounts set balance = balance - $1 where id = $2 and balance >= $1`),
  a row lock (`select ... for update`), optimistic concurrency (`where version = $n`, check rows
  affected), or `serializable` isolation with retries.
- Work queues in Postgres: `select ... for update skip locked limit n`.
- Upserts: `insert ... on conflict (key) do update set ...`, not select-then-insert.
- Deadlocks come from locking the same rows in different orders; lock in a consistent order (for
  example by id) and retry on `40P01`.
- Side effects after commit: write to an outbox table in the same transaction and publish from
  it (see the `background-jobs` skill).

## 7. Migrations that do not take production down

Most dangerous operations take an `ACCESS EXCLUSIVE` lock or rewrite the table. While waiting for
that lock, a migration blocks every query queued behind it, so even a "fast" change can cause an
outage if a long query is running.

- Set `lock_timeout` (for example `5s`) and `statement_timeout` in every migration, and retry
  rather than queue behind long transactions.
- **Add columns** as nullable or with a constant default (instant in Postgres 11+). Backfill in
  batches separately. Add `not null` afterwards via a `check (...) not valid` constraint, then
  `validate constraint`, then `set not null`.
- **Indexes**: `create index concurrently` (outside a transaction block; most migration tools
  need a flag or a separate migration for this).
- **Foreign keys and checks**: add `not valid`, then `validate constraint` in a later step.
- **Never** in one deploy: rename a column, change a column's type, drop a column still read by
  running code. Use **expand and contract**: add the new thing, write to both, backfill, switch
  reads, stop writing the old, drop it in a later release.
- Backfills run in batches (1,000-10,000 rows) with pauses, outside the schema migration.
- Every migration is reviewed for: locks taken, table rewrite, duration on production-sized data,
  and compatibility with the code version running before and after it.

Before applying a migration, run the bundled checker on it:

```bash
python3 <this-skill-dir>/scripts/check-migration.py migrations/20261123_add_status.sql
python3 <this-skill-dir>/scripts/check-migration.py prisma/migrations/*/migration.sql
```

It flags operations that lock or rewrite tables, missing `lock_timeout`, non-concurrent index
builds, `not null` additions, type changes, renames and drops, each with the safe alternative.
It reads SQL; for ORM migrations, generate the SQL first (`prisma migrate diff --script`,
`drizzle-kit generate`). Step-by-step recipes for each risky change are in
`references/safe-migrations.md`.

## 8. Multi-tenancy

- Shared tables with a `tenant_id` column on every tenant-owned table, leading every index, and
  included in every query. Make it impossible to forget: a repository layer that requires the
  tenant, and Postgres row-level security (`create policy ... using (tenant_id = current_setting('app.tenant_id'))`)
  as a second line of defence.
- Unique constraints include the tenant: `unique (tenant_id, slug)`.
- Schema-per-tenant or database-per-tenant only for strong isolation or residency requirements;
  they multiply migration and connection costs.

## 9. Connections

- Each Postgres connection is a process; a few hundred is a practical ceiling. Serverless
  functions and many app instances exhaust this quickly.
- Use a pooler (PgBouncer in transaction mode, or the platform's pooled endpoint) and a small
  per-instance pool (for example 5-10). In transaction pooling, avoid session state: prepared
  statements by name (configure the driver), `set` without `local`, advisory session locks.
- Close or release connections in `finally`; a leaked connection per error is a slow outage.

## 10. ORMs

Use the ORM for the 90% of simple reads and writes, and drop to SQL for reports, bulk operations
and anything where you need to see the plan. Check the SQL the ORM generates for hot paths
(enable query logging in development). Keep the schema source of truth in migrations, and review
generated migrations as if hand-written: ORMs happily generate a locking `alter column type`.

## Reviewing schema or migration changes

Check, and report by severity: production locking and rewrites (blockers), data loss, missing
constraints that let invalid data in, missing indexes for new queries, unused new indexes, type
choices (money, time, IDs), and compatibility with the previously deployed code.

## Reference files

- `references/safe-migrations.md` - step-by-step recipes for adding non-null columns, renaming,
  changing types, adding foreign keys and unique constraints, dropping columns, large backfills,
  and per-tool notes for Prisma, Drizzle and Alembic.
- `references/query-tuning.md` - reading `EXPLAIN ANALYZE`, index recipes, `pg_stat_statements`
  queries, finding unused and missing indexes, lock and bloat diagnostics.
- `scripts/check-migration.py` - static checker for risky SQL in migration files.
