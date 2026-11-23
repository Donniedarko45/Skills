# Query tuning (PostgreSQL)

## Contents

1. Find what to tune
2. Read EXPLAIN ANALYZE
3. Index recipes
4. Rewrites that help
5. Diagnostics queries

## 1. Find what to tune

Tune by total cost (calls x mean time), not by the single slowest query.

```sql
-- requires the pg_stat_statements extension
SELECT round(total_exec_time::numeric / 1000, 1) AS total_s,
       calls,
       round(mean_exec_time::numeric, 1)          AS mean_ms,
       round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct,
       left(query, 120)                            AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Also: the slowest spans in your tracing tool, `log_min_duration_statement = 500` for a slow log,
and `auto_explain` to capture plans of slow statements in production.

## 2. Read EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ... ;   -- with realistic parameter values
```

`ANALYZE` executes the query; wrap writes in `BEGIN; ... ROLLBACK;`.

Read from the innermost (most indented) node outward. On each node compare:

| Look at                              | Problem signal                                     | Usual fix                                          |
| ------------------------------------ | -------------------------------------------------- | -------------------------------------------------- |
| `Seq Scan` on a large table          | most rows discarded by a `Filter`                   | an index matching the filter                       |
| `rows=` estimated vs `actual rows=`  | off by 10x or more                                 | `ANALYZE` the table, extended statistics, rewrite  |
| `Rows Removed by Filter`             | large relative to rows returned                    | index on the filter columns, or a partial index    |
| `Sort ... external merge Disk`       | sort spilled to disk                               | index providing the order, or more `work_mem` for that query |
| `Nested Loop` with big outer input   | inner side executed thousands of times             | index on the join key, or a hash join (better estimates) |
| `Buffers: shared read=` high          | reading from disk                                  | fewer rows read (index, covering index), more cache |
| `Index Scan` then many heap fetches   | wide rows, poor locality                           | covering index (`INCLUDE`) for an index-only scan  |
| `Heap Fetches` in index-only scan     | visibility map not current                         | vacuum more often on that table                    |

Planning time large but execution small: too many partitions or a huge `IN` list.

## 3. Index recipes

```sql
-- equality columns first, then the range or sort column, matching ORDER BY direction
CREATE INDEX CONCURRENTLY invoices_tenant_status_created_idx
  ON invoices (tenant_id, status, created_at DESC);

-- partial index for a hot subset
CREATE INDEX CONCURRENTLY invoices_unpaid_due_idx
  ON invoices (tenant_id, due_on) WHERE status IN ('sent', 'overdue');

-- covering index for an index-only scan
CREATE INDEX CONCURRENTLY invoices_tenant_created_cover_idx
  ON invoices (tenant_id, created_at DESC) INCLUDE (amount_cents, status);

-- expression index matching the query exactly
CREATE INDEX CONCURRENTLY users_lower_email_idx ON users (lower(email));

-- substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY customers_name_trgm_idx ON customers USING gin (name gin_trgm_ops);

-- jsonb containment (@>)
CREATE INDEX CONCURRENTLY events_payload_idx ON events USING gin (payload jsonb_path_ops);
```

A multicolumn B-tree is used efficiently only when the query constrains its leading columns.
`(a, b, c)` serves `a`, `a,b` and `a,b,c` filters, not `b` alone.

## 4. Rewrites that help

- **Sargable predicates**: `created_at >= $1 AND created_at < $2` instead of
  `date(created_at) = $1`; `email = lower($1)` with an index on `lower(email)`.
- **Keyset pagination** instead of `OFFSET`:
  `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 50`.
- **`EXISTS`** instead of `count(*) > 0` or `IN (SELECT ...)` with large subqueries.
- **Batch lookups**: `WHERE id = ANY($1::bigint[])` instead of N single-row queries.
- **Avoid `OR` across different columns** in hot queries; a `UNION ALL` of two indexed queries is
  often faster.
- **Aggregate less often**: maintain a counter or summary table, or a materialized view refreshed
  concurrently, for dashboards over millions of rows.
- **Approximate counts** for huge tables: `SELECT reltuples::bigint FROM pg_class WHERE relname = 'events';`
- **Generic vs custom plans**: a prepared statement that is fast for some parameters and slow for
  others may be using a generic plan; test with `SET plan_cache_mode = force_custom_plan`.

## 5. Diagnostics queries

```sql
-- unused indexes (check over a full business cycle, and on replicas too)
SELECT schemaname, relname AS table, indexrelname AS index, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- tables read mostly by sequential scans
SELECT relname, seq_scan, seq_tup_read, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0 AND n_live_tup > 100000
ORDER BY seq_tup_read DESC
LIMIT 20;

-- who is blocking whom
SELECT blocked.pid AS blocked_pid, left(blocked.query, 80) AS blocked_query,
       blocking.pid AS blocking_pid, left(blocking.query, 80) AS blocking_query,
       now() - blocking.xact_start AS blocking_tx_age
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking ON blocking.pid = ANY(pg_blocking_pids(blocked.pid));

-- long-running transactions (they block vacuum and migrations)
SELECT pid, now() - xact_start AS age, state, left(query, 100)
FROM pg_stat_activity
WHERE xact_start IS NOT NULL AND now() - xact_start > interval '5 minutes'
ORDER BY age DESC;

-- dead tuples and vacuum health
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- connection usage
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

To stop a runaway query: `SELECT pg_cancel_backend(pid);` (cancels the statement), and only if
that fails `pg_terminate_backend(pid)` (kills the connection).
