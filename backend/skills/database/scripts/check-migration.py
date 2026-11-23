#!/usr/bin/env python3
"""Flag risky operations in PostgreSQL migration files before they run in production.

Usage:
  python3 check-migration.py <file.sql> [<file.sql> ...] [--json] [--fail-on high|medium|low]

Reads plain SQL. For ORM migrations, point it at the generated SQL
(Prisma: prisma/migrations/*/migration.sql; Drizzle: drizzle/*.sql; or `prisma migrate diff --script`).

Checks are static and conservative: they cannot see table sizes or the code running in
production, so treat every finding as a question to answer, not an automatic failure.
Tables created earlier in the same file are treated as new and empty, so lock warnings are
skipped for them.

Exit codes: 0 no findings at or above --fail-on (default: high), 1 findings, 2 usage error.
"""
import json
import re
import sys

SEVERITY_ORDER = {'low': 0, 'medium': 1, 'high': 2}
VOLATILE_DEFAULTS = re.compile(r"\b(gen_random_uuid|uuid_generate_v[14]|random|clock_timestamp|timeofday|nextval)\s*\(", re.I)


def strip_comments(sql):
    """Remove -- and /* */ comments, keeping newlines so line numbers stay right."""
    out, i, n = [], 0, len(sql)
    in_single = False
    dollar = None
    while i < n:
        ch = sql[i]
        if dollar:
            if sql.startswith(dollar, i):
                out.append(dollar)
                i += len(dollar)
                dollar = None
            else:
                out.append(ch)
                i += 1
            continue
        if in_single:
            out.append(ch)
            if ch == "'":
                if i + 1 < n and sql[i + 1] == "'":
                    out.append("'")
                    i += 2
                    continue
                in_single = False
            i += 1
            continue
        if ch == "'":
            in_single = True
            out.append(ch)
            i += 1
            continue
        m = re.match(r'\$[A-Za-z_]*\$', sql[i:])
        if m:
            dollar = m.group(0)
            out.append(dollar)
            i += len(dollar)
            continue
        if sql.startswith('--', i):
            j = sql.find('\n', i)
            i = n if j == -1 else j
            continue
        if sql.startswith('/*', i):
            j = sql.find('*/', i + 2)
            end = n if j == -1 else j + 2
            out.append('\n' * sql.count('\n', i, end))
            i = end
            continue
        out.append(ch)
        i += 1
    return ''.join(out)


def split_statements(sql):
    """Split on semicolons outside quotes and dollar-quoted bodies. Returns (line, text) pairs."""
    stmts, buf, line, start_line = [], [], 1, 1
    in_single, dollar, i, n = False, None, 0, len(sql)
    while i < n:
        ch = sql[i]
        if dollar:
            if sql.startswith(dollar, i):
                buf.append(dollar)
                i += len(dollar)
                dollar = None
                continue
        elif in_single:
            if ch == "'":
                in_single = False
        elif ch == "'":
            in_single = True
        else:
            m = re.match(r'\$[A-Za-z_]*\$', sql[i:])
            if m:
                dollar = m.group(0)
                buf.append(dollar)
                i += len(dollar)
                continue
            if ch == ';':
                text = ''.join(buf).strip()
                if text:
                    stmts.append((start_line, text))
                buf = []
                i += 1
                continue
        if ch == '\n':
            line += 1
        if not ''.join(buf).strip() and not ch.isspace():
            start_line = line
        buf.append(ch)
        i += 1
    text = ''.join(buf).strip()
    if text:
        stmts.append((start_line, text))
    return stmts


def norm(stmt):
    return re.sub(r'\s+', ' ', stmt).strip()


def table_of(stmt):
    m = re.match(r'(?i)alter table (?:if exists )?(?:only )?([\w."]+)', stmt)
    return m.group(1).strip('"').lower() if m else None


def check_file(path):
    raw = open(path, encoding='utf-8', errors='replace').read()
    sql = strip_comments(raw)
    statements = split_statements(sql)
    findings = []
    created = set()
    has_lock_timeout = bool(re.search(r'(?i)\bset\s+(?:local\s+)?lock_timeout\b', sql))
    in_explicit_tx = False
    risky_seen = False

    def add(line, severity, stmt, issue, fix):
        findings.append({'file': path, 'line': line, 'severity': severity, 'statement': norm(stmt)[:160], 'issue': issue, 'fix': fix})

    for line, stmt in statements:
        s = norm(stmt)
        low = s.lower()

        if re.match(r'(?i)(begin|start transaction)\b', s):
            in_explicit_tx = True
        if re.match(r'(?i)(commit|end|rollback)\b', s):
            in_explicit_tx = False

        m = re.match(r'(?i)create (?:unlogged |temp |temporary )?table (?:if not exists )?([\w."]+)', s)
        if m:
            created.add(m.group(1).strip('"').lower())
            continue

        tbl = table_of(s)
        new_table = tbl in created if tbl else False

        # Index builds
        m = re.match(r'(?i)create (unique )?index (concurrently )?(?:if not exists )?[\w."]* ?on (?:only )?([\w."]+)', s)
        if m:
            target = m.group(3).strip('"').lower()
            if m.group(2):
                if in_explicit_tx:
                    add(line, 'high', stmt, 'CREATE INDEX CONCURRENTLY cannot run inside a transaction block.',
                        'Put it in its own migration without BEGIN/COMMIT (and disable the tool\'s per-migration transaction if it adds one).')
            elif target not in created:
                risky_seen = True
                add(line, 'high', stmt, 'Builds the index while blocking all writes to the table.',
                    'Use CREATE INDEX CONCURRENTLY in a migration that is not wrapped in a transaction.')
            continue

        if re.match(r'(?i)drop index (?!concurrently)', s):
            risky_seen = True
            add(line, 'medium', stmt, 'DROP INDEX takes an exclusive lock on the table.',
                'Use DROP INDEX CONCURRENTLY, outside a transaction block.')
            continue

        if re.match(r'(?i)(vacuum full|cluster)\b', s):
            risky_seen = True
            add(line, 'high', stmt, 'Rewrites the table under an ACCESS EXCLUSIVE lock.', 'Use pg_repack, or schedule a maintenance window.')
            continue

        if re.match(r'(?i)refresh materialized view (?!concurrently)', s):
            add(line, 'medium', stmt, 'Blocks reads of the view while it refreshes.',
                'Use REFRESH MATERIALIZED VIEW CONCURRENTLY (requires a unique index on the view).')
            continue

        if re.match(r'(?i)lock table', s):
            risky_seen = True
            add(line, 'medium', stmt, 'Explicit table lock blocks other sessions for the rest of the transaction.', 'Avoid, or keep the transaction very short with lock_timeout set.')
            continue

        if re.match(r'(?i)drop table', s):
            add(line, 'high', stmt, 'Drops data permanently, and breaks any running code that still uses the table.',
                'Stop all reads and writes in a previous release, take a backup or rename-and-wait first, then drop.')
            continue

        if re.match(r'(?i)(update|delete from) ', s) and not re.search(r'(?i)\bwhere\b', s):
            add(line, 'medium', stmt, 'Touches every row in one transaction: long locks, bloat and WAL spikes on big tables.',
                'Backfill in batches (for example 1,000-10,000 rows per transaction) from a script or job, not in the schema migration.')
            continue
        if re.match(r'(?i)update ', s):
            add(line, 'low', stmt, 'Data change inside a schema migration.',
                'Fine for small tables; for large ones, move the backfill into a batched job.')
            continue

        if re.match(r'(?i)alter table .* rename to ', s) and 'rename column' not in low:
            add(line, 'high', stmt, 'Renaming a table breaks every running instance still using the old name.',
                'Expand and contract: create a view or the new table, migrate code, then drop the old name in a later release.')
            continue

        if not tbl:
            continue

        # Clauses inside ALTER TABLE (a statement can have several, comma separated)
        if 'rename column' in low or re.search(r'(?i)\brename \w+ to\b', s):
            add(line, 'high', stmt, 'Renaming a column breaks running code that reads or writes the old name.',
                'Expand and contract: add the new column, write to both, backfill, switch reads, then drop the old column in a later release.')

        if re.search(r'(?i)\bdrop column\b', s):
            add(line, 'high', stmt, 'Drops data, and breaks running code that still selects the column (including SELECT * with ORMs).',
                'Remove all reads and writes (and ORM model fields) in a previous release, then drop.')

        for m in re.finditer(r'(?i)\badd column (?:if not exists )?("?[\w]+"?) ([^,]+?)(?=,\s*(?:add|alter|drop)\b|$)', s):
            col, definition = m.group(1), m.group(2)
            d = definition.lower()
            if new_table:
                continue
            if 'not null' in d and 'default' not in d and 'generated' not in d:
                add(line, 'high', stmt, f'ADD COLUMN {col} NOT NULL without a default fails on any table with rows.',
                    'Add the column as nullable (or with a constant default), backfill in batches, then add NOT NULL via a CHECK ... NOT VALID constraint, VALIDATE it, and SET NOT NULL.')
            if 'default' in d and VOLATILE_DEFAULTS.search(definition):
                risky_seen = True
                add(line, 'high', stmt, f'ADD COLUMN {col} with a volatile default rewrites the whole table under an exclusive lock.',
                    'Add the column without the default (or nullable), set the default afterwards for new rows, and backfill existing rows in batches.')
            if re.search(r'\b(big)?serial\b', d) or re.search(r'(?i)generated always as \(.*\) stored', definition):
                risky_seen = True
                add(line, 'high', stmt, f'ADD COLUMN {col} as serial or stored generated column rewrites the table.',
                    'Add a nullable column, backfill in batches, then attach the sequence or switch to a trigger.')

        if re.search(r'(?i)\balter column ("?\w+"?) (set data )?type\b', s) and not new_table:
            risky_seen = True
            add(line, 'high', stmt, 'Changing a column type usually rewrites the table and its indexes under an exclusive lock.',
                'Safe without rewrite only for some cases (varchar(n) to larger n or to text). Otherwise expand and contract with a new column.')

        if re.search(r'(?i)\balter column ("?\w+"?) set not null\b', s) and not new_table:
            risky_seen = True
            add(line, 'high', stmt, 'SET NOT NULL scans the whole table while holding an exclusive lock.',
                'First ADD CONSTRAINT ... CHECK (col IS NOT NULL) NOT VALID, then VALIDATE CONSTRAINT (no exclusive lock), then SET NOT NULL (Postgres 12+ skips the scan), then drop the check.')

        if re.search(r'(?i)\badd (constraint \S+ )?foreign key\b', s) and 'not valid' not in low and not new_table:
            risky_seen = True
            add(line, 'high', stmt, 'Adding a foreign key validates every row while locking both tables against writes.',
                'ADD CONSTRAINT ... FOREIGN KEY ... NOT VALID, then VALIDATE CONSTRAINT in a separate step.')

        if re.search(r'(?i)\badd (constraint \S+ )?check\b', s) and 'not valid' not in low and not new_table:
            risky_seen = True
            add(line, 'medium', stmt, 'Adding a CHECK constraint scans the table under an exclusive lock.',
                'ADD CONSTRAINT ... CHECK (...) NOT VALID, then VALIDATE CONSTRAINT separately.')

        if re.search(r'(?i)\badd (constraint \S+ )?(unique|primary key)\b', s) and 'using index' not in low and not new_table:
            risky_seen = True
            add(line, 'high', stmt, 'Adding a UNIQUE or PRIMARY KEY constraint builds an index while blocking writes.',
                'CREATE UNIQUE INDEX CONCURRENTLY first, then ADD CONSTRAINT ... UNIQUE USING INDEX <name>.')

        if re.search(r'(?i)\balter column ("?\w+"?) set default\b', s) and VOLATILE_DEFAULTS.search(s):
            add(line, 'low', stmt, 'Volatile default only applies to new rows; existing rows keep NULL.', 'Backfill existing rows in batches if they need a value.')

    if risky_seen and not has_lock_timeout:
        findings.insert(0, {'file': path, 'line': 1, 'severity': 'medium', 'statement': '(whole file)',
                            'issue': 'No lock_timeout set. A migration waiting for a lock blocks every query queued behind it.',
                            'fix': "Start the migration with SET lock_timeout = '5s'; (and a statement_timeout), and retry on timeout."})
    return findings


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    as_json = '--json' in argv
    fail_on = 'high'
    if '--fail-on' in argv:
        idx = argv.index('--fail-on')
        if idx + 1 >= len(argv) or argv[idx + 1] not in SEVERITY_ORDER:
            print('--fail-on must be high, medium or low', file=sys.stderr)
            return 2
        fail_on = argv[idx + 1]
        args = [a for a in args if a != fail_on]
    if not args or '-h' in argv or '--help' in argv:
        print(__doc__)
        return 0 if ('-h' in argv or '--help' in argv) else 2

    findings = []
    for path in args:
        try:
            findings.extend(check_file(path))
        except OSError as err:
            print(f'Cannot read {path}: {err}', file=sys.stderr)
            return 2

    if as_json:
        print(json.dumps(findings, indent=2))
    else:
        if not findings:
            print(f'No risky operations found in {len(args)} file(s).')
        for f in sorted(findings, key=lambda x: (x['file'], -SEVERITY_ORDER[x['severity']], x['line'])):
            print(f"{f['severity'].upper():6} {f['file']}:{f['line']}")
            print(f"       {f['statement']}")
            print(f"       Problem: {f['issue']}")
            print(f"       Instead: {f['fix']}\n")
        counts = {s: sum(1 for f in findings if f['severity'] == s) for s in ('high', 'medium', 'low')}
        if findings:
            print(f"{counts['high']} high, {counts['medium']} medium, {counts['low']} low. Static checks cannot see table sizes: confirm against production row counts.")

    threshold = SEVERITY_ORDER[fail_on]
    return 1 if any(SEVERITY_ORDER[f['severity']] >= threshold for f in findings) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
