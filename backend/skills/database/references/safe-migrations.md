# Safe migration recipes (PostgreSQL)

Every recipe assumes production-sized tables and code from the previous release still running
while the migration applies. Each numbered step is its own migration or deploy unless noted.

## Contents

1. Session settings for every migration
2. Add a NOT NULL column
3. Add an index
4. Add a unique constraint
5. Add a foreign key
6. Add a check constraint
7. Rename a column
8. Change a column's type
9. Drop a column
10. Backfill large tables
11. Enum values
12. Tool notes: Prisma, Drizzle, Knex, Alembic
13. Lock cheat sheet

## 1. Session settings for every migration

```sql
SET lock_timeout = '5s';        -- give up instead of queueing behind a long transaction
SET statement_timeout = '15min'; -- cap runaway statements (raise for big validations)
```

If a migration fails on `lock_timeout`, retry it a little later. That is the system working: the
alternative was blocking every query on the table while waiting.

## 2. Add a NOT NULL column

```sql
-- 1. add nullable (instant)
ALTER TABLE invoices ADD COLUMN status text;
-- deploy code that writes status on every insert and update

-- 2. backfill in batches (job or script, see section 10)

-- 3. enforce without a long exclusive lock
ALTER TABLE invoices ADD CONSTRAINT invoices_status_not_null CHECK (status IS NOT NULL) NOT VALID;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_status_not_null;   -- SHARE UPDATE EXCLUSIVE: reads and writes continue
ALTER TABLE invoices ALTER COLUMN status SET NOT NULL;                -- Postgres 12+ uses the valid check, no scan
ALTER TABLE invoices DROP CONSTRAINT invoices_status_not_null;
```

A constant default (`DEFAULT 'draft'`) is instant in Postgres 11+ and lets you add `NOT NULL`
directly. A volatile default (`gen_random_uuid()`, `clock_timestamp()`) rewrites the table; add the
column without it, then `ALTER COLUMN ... SET DEFAULT` for new rows and backfill old ones.

## 3. Add an index

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS invoices_tenant_due_idx ON invoices (tenant_id, due_on);
```

- Cannot run inside a transaction block. Prisma, Drizzle and Knex wrap migrations differently;
  see section 12.
- If it fails, it leaves an `INVALID` index behind. Find it with
  `select indexrelid::regclass from pg_index where not indisvalid;` and drop it
  (`DROP INDEX CONCURRENTLY`) before retrying.
- It waits for running transactions that touch the table; long transactions make it slow, not
  dangerous.

## 4. Add a unique constraint

```sql
CREATE UNIQUE INDEX CONCURRENTLY customers_tenant_email_key ON customers (tenant_id, lower(email));
-- for a named table constraint (plain columns only):
ALTER TABLE customers ADD CONSTRAINT customers_tenant_email_key UNIQUE USING INDEX customers_tenant_email_key;
```

Find and resolve duplicates first, or the index build fails:
`select tenant_id, lower(email), count(*) from customers group by 1, 2 having count(*) > 1;`

## 5. Add a foreign key

```sql
ALTER TABLE invoices ADD CONSTRAINT invoices_customer_fk
  FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;   -- brief lock, no scan
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_customer_fk;      -- scans without blocking writes
```

Index the referencing column (`invoices(customer_id)`) too, or deletes on the parent table scan
the child table.

## 6. Add a check constraint

```sql
ALTER TABLE invoices ADD CONSTRAINT invoices_amount_nonnegative CHECK (amount_cents >= 0) NOT VALID;
ALTER TABLE invoices VALIDATE CONSTRAINT invoices_amount_nonnegative;
```

`NOT VALID` constraints are enforced for new writes immediately; validation proves old rows.

## 7. Rename a column (expand and contract)

1. Add the new column (nullable).
2. Deploy code that writes both columns and reads the old one.
3. Backfill new from old in batches.
4. Deploy code that reads the new column (still writing both).
5. Deploy code that stops writing the old column (and remove it from ORM models).
6. Drop the old column.

A trigger that copies writes between the two columns can replace step 2's code change. For a
quick win without the dance, a view or generated column can expose the new name, but the
storage name stays.

## 8. Change a column's type

Safe in place (no rewrite): `varchar(n)` to larger `n` or to `text`; `numeric(p,s)` to larger
precision with the same scale; dropping a `varchar` length limit. Almost everything else
(`int` to `bigint`, `text` to `jsonb`, `timestamp` to `timestamptz`) rewrites the table and every
index under an exclusive lock.

For those, use expand and contract (section 7) with the new type, converting during the backfill.
For `int` to `bigint` primary keys on huge tables, plan it as a project: new column, trigger to
sync, batched backfill, build a unique index concurrently, then swap in a short transaction.

## 9. Drop a column

1. Remove every read and write, including ORM model fields: an ORM that selects all model
   columns will fail on the next query after the drop.
2. Deploy, and wait until no old code is running.
3. `ALTER TABLE ... DROP COLUMN` (fast: marks it dropped, does not rewrite).

Dropping a table is the same, plus a backup or a rename-and-wait period
(`ALTER TABLE x RENAME TO x_deprecated_20261123`) to catch forgotten readers.

## 10. Backfill large tables

Never as one `UPDATE` over the table. Batch by primary key, commit per batch, pause between
batches, and make it resumable:

```sql
-- run repeatedly until it updates 0 rows
WITH batch AS (
  SELECT id FROM invoices
  WHERE status IS NULL
  ORDER BY id
  LIMIT 5000
  FOR UPDATE SKIP LOCKED
)
UPDATE invoices i SET status = CASE WHEN i.paid_at IS NOT NULL THEN 'paid' ELSE 'sent' END
FROM batch WHERE i.id = batch.id;
```

```ts
// scripts/backfill-invoice-status.ts
for (;;) {
  const { rowCount } = await db.query(BACKFILL_SQL)
  console.log(`updated ${rowCount}`)
  if (rowCount === 0) break
  await new Promise((r) => setTimeout(r, 200))   // let replication and autovacuum keep up
}
```

Watch replication lag and database CPU while it runs. Run it as a job or one-off task, not inside
the deploy's migration step, so a slow backfill cannot block a deploy.

## 11. Enum values

- `text` plus a `CHECK` constraint: change the constraint with the `NOT VALID` / `VALIDATE` pattern.
- Postgres `enum` types: `ALTER TYPE status ADD VALUE 'archived';` is fast, but the new value
  cannot be used in the same transaction, and removing or renaming values is not supported
  without recreating the type. This is the main reason to prefer `text` + `CHECK`.
- Deploy code that tolerates the new value before any row can contain it.

## 12. Tool notes

**Prisma Migrate**: review `migration.sql` before committing; it will generate locking
operations. For `CREATE INDEX CONCURRENTLY`, create an empty migration
(`prisma migrate dev --create-only`), write the SQL by hand, and keep it as the only statement in
that migration. Use `prisma migrate diff --from-... --to-... --script` to see SQL for a schema change.

**Drizzle Kit**: `drizzle-kit generate` writes SQL files; edit them before `migrate`. Avoid
`drizzle-kit push` against production.

**Knex**: set `exports.config = { transaction: false }` in a migration that uses `CONCURRENTLY`.

**Alembic**: use `op.create_index(..., postgresql_concurrently=True)` inside
`with op.get_context().autocommit_block():`.

**All tools**: migrations run before or after the new code deploys; the schema after each
migration must work with both the old and the new code.

## 13. Lock cheat sheet

| Operation                                   | Lock                   | Blocks reads | Blocks writes | Rewrite/scan |
| ------------------------------------------- | ---------------------- | ------------ | ------------- | ------------ |
| `ADD COLUMN` (nullable or constant default) | ACCESS EXCLUSIVE, brief | briefly      | briefly       | no           |
| `ADD COLUMN` volatile default               | ACCESS EXCLUSIVE       | yes          | yes           | rewrite      |
| `ALTER COLUMN TYPE` (most)                  | ACCESS EXCLUSIVE       | yes          | yes           | rewrite      |
| `SET NOT NULL` (no valid check)             | ACCESS EXCLUSIVE       | yes          | yes           | scan         |
| `CREATE INDEX`                              | SHARE                  | no           | yes           | build        |
| `CREATE INDEX CONCURRENTLY`                 | SHARE UPDATE EXCLUSIVE | no           | no            | build        |
| `ADD FOREIGN KEY` (valid)                   | SHARE ROW EXCLUSIVE on both tables | no | yes        | scan         |
| `ADD ... NOT VALID` then `VALIDATE`          | brief, then SHARE UPDATE EXCLUSIVE | no | no          | scan (non-blocking) |
| `DROP COLUMN`                               | ACCESS EXCLUSIVE, brief | briefly      | briefly       | no           |
| `VACUUM FULL`, `CLUSTER`                     | ACCESS EXCLUSIVE       | yes          | yes           | rewrite      |

"Brief" still means it must wait for every running transaction on the table to finish, which is
why `lock_timeout` matters even for fast operations.
