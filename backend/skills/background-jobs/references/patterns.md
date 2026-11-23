# Background job patterns

Library APIs change between major versions; check the installed version's docs for exact option
names.

## Contents

1. Transactional outbox
2. A Postgres worker with SKIP LOCKED
3. BullMQ
4. pg-boss
5. Backoff with jitter and error classification
6. One run per schedule with an advisory lock
7. Chunked, resumable jobs
8. Graceful shutdown

## 1. Transactional outbox

```sql
create table outbox (
  id            bigint generated always as identity primary key,
  topic         text        not null,               -- 'invoice.paid'
  key           text        not null,               -- business id, for dedup and ordering
  payload       jsonb       not null,
  created_at    timestamptz not null default now(),
  published_at  timestamptz,
  attempts      int         not null default 0,
  last_error    text
);
create index outbox_unpublished_idx on outbox (id) where published_at is null;
```

Write it in the same transaction as the change:

```ts
await db.$transaction(async (tx) => {
  await tx.invoice.update({ where: { id }, data: { status: 'paid', paidAt: new Date() } })
  await tx.outbox.create({ data: { topic: 'invoice.paid', key: id, payload: { invoiceId: id } } })
})
```

Relay (one or more instances; `skip locked` lets them share the work):

```ts
async function relayOnce(batchSize = 100) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<OutboxRow[]>`
      select * from outbox where published_at is null
      order by id limit ${batchSize} for update skip locked`
    for (const row of rows) {
      try {
        await queue.add(row.topic, row.payload, { jobId: `outbox-${row.id}` })   // dedup on retry
        await tx.$executeRaw`update outbox set published_at = now() where id = ${row.id}`
      } catch (err) {
        await tx.$executeRaw`update outbox set attempts = attempts + 1, last_error = ${String(err)} where id = ${row.id}`
      }
    }
    return rows.length
  }, { timeout: 30_000 })
}
```

Run it in a loop with a short sleep when empty, or trigger with `LISTEN/NOTIFY`. Delete or
archive published rows periodically.

## 2. A Postgres worker with SKIP LOCKED

```sql
create table jobs (
  id          bigint generated always as identity primary key,
  type        text        not null,
  payload     jsonb       not null,
  run_at      timestamptz not null default now(),
  attempts    int         not null default 0,
  max_attempts int        not null default 10,
  locked_until timestamptz,
  status      text        not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  last_error  text,
  dedupe_key  text unique
);
create index jobs_ready_idx on jobs (run_at) where status = 'queued';
```

```ts
async function claim(workerId: string) {
  const [job] = await sql<Job[]>`
    update jobs set status = 'running', attempts = attempts + 1, locked_until = now() + interval '5 minutes'
    where id = (
      select id from jobs
      where status = 'queued' and run_at <= now()
      order by run_at
      limit 1
      for update skip locked
    )
    returning *`
  return job
}

async function complete(job: Job) {
  await sql`update jobs set status = 'done', locked_until = null where id = ${job.id}`
}

async function fail(job: Job, err: unknown) {
  const permanent = isPermanent(err)
  const exhausted = job.attempts >= job.max_attempts
  await sql`
    update jobs set
      status = ${permanent || exhausted ? 'failed' : 'queued'},
      run_at = now() + ${backoffMs(job.attempts) + ' milliseconds'}::interval,
      last_error = ${String(err)},
      locked_until = null
    where id = ${job.id}`
}
```

A reaper requeues jobs whose `locked_until` passed (crashed workers). Prefer a maintained library
(pg-boss, Graphile Worker) over growing this by hand.

## 3. BullMQ

```ts
import { Queue, Worker, UnrecoverableError } from 'bullmq'
const connection = { url: process.env.REDIS_URL! }

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 8,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 24 * 3600, count: 10_000 },
    removeOnFail: { age: 14 * 24 * 3600 },          // keep failures to inspect
  },
})

await emailQueue.add('invoice-sent', { invoiceId }, { jobId: `invoice-sent:${invoiceId}` })   // dedup

const worker = new Worker('email', async (job) => {
  const invoice = await loadInvoice(job.data.invoiceId)
  if (!invoice) throw new UnrecoverableError('invoice not found')      // no retries
  if (invoice.emailSentAt) return                                       // idempotent
  await mailer.send(renderInvoiceEmail(invoice), { idempotencyKey: job.id })
  await markEmailSent(invoice.id)
}, {
  connection,
  concurrency: 10,
  limiter: { max: 20, duration: 1000 },             // provider rate limit across workers
  lockDuration: 60_000,                              // longer than the slowest job
})

worker.on('failed', (job, err) => log().warn({ jobId: job?.id, attempt: job?.attemptsMade, err }, 'job failed'))
```

Repeatable jobs: `queue.upsertJobScheduler('nightly-dunning', { pattern: '0 6 * * *', tz: 'UTC' }, { name: 'dunning' })`.

## 4. pg-boss

```ts
import { PgBoss } from 'pg-boss'
const boss = new PgBoss(process.env.DATABASE_URL!)
await boss.start()
await boss.createQueue('invoice-email')

await boss.send('invoice-email', { invoiceId }, { singletonKey: invoiceId, retryLimit: 8, retryBackoff: true })

await boss.work('invoice-email', { batchSize: 5 }, async (jobs) => {
  for (const job of jobs) await sendInvoiceEmail(job.data.invoiceId)
})

await boss.schedule('nightly-dunning', '0 6 * * *', null, { tz: 'UTC' })
```

pg-boss can enqueue using an existing transaction's connection, which gives the outbox guarantee
without a separate relay; see its docs for the `db` option.

## 5. Backoff with jitter and error classification

```ts
export function backoffMs(attempt: number, baseMs = 10_000, capMs = 6 * 3600_000) {
  const exp = Math.min(capMs, baseMs * 2 ** (attempt - 1))
  return Math.round(exp * (0.8 + Math.random() * 0.4))   // ±20% jitter spreads retries
}

export function isPermanent(err: unknown): boolean {
  if (err instanceof ValidationError || err instanceof NotFoundError) return true
  const status = (err as { status?: number }).status
  if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) return true
  return false                                             // network errors, 5xx, 429, timeouts: retry
}
```

## 6. One run per schedule with an advisory lock

```ts
async function runExclusive(lockId: number, fn: () => Promise<void>) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('select pg_try_advisory_lock($1) as locked', [lockId])
    if (!rows[0].locked) return                             // another instance is running it
    try { await fn() } finally { await client.query('select pg_advisory_unlock($1)', [lockId]) }
  } finally {
    client.release()
  }
}
```

Session advisory locks need a dedicated connection; they do not work through a transaction-mode
pooler. Use `pg_try_advisory_xact_lock` inside a transaction there instead.

## 7. Chunked, resumable jobs

```ts
async function exportInvoices(exportId: string) {
  const job = await getExport(exportId)
  let cursor = job.cursor                                    // resume point
  for (;;) {
    if ((await getExport(exportId)).cancelRequested) return markCancelled(exportId)
    const page = await listInvoicesAfter(job.tenantId, cursor, 500)
    if (page.length === 0) break
    await appendToFile(job.fileKey, toCsv(page))
    cursor = page.at(-1)!.id
    await updateExport(exportId, { cursor, processed: { increment: page.length } })   // commit progress
  }
  await finishExport(exportId)
}
```

Appending must be idempotent too: write each chunk as its own object keyed by the cursor, or
record the byte offset, so a retried chunk does not duplicate rows.

## 8. Graceful shutdown

```ts
let stopping = false
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, async () => {
    if (stopping) return
    stopping = true
    log().info({ signal }, 'shutting down worker')
    await worker.close()            // BullMQ: stop fetching, wait for active jobs
    await boss?.stop({ graceful: true, timeout: 25_000 })
    await db.$disconnect()
    process.exit(0)
  })
}
```

Kubernetes sends `SIGTERM`, waits `terminationGracePeriodSeconds` (default 30), then kills the
process. Set it above the longest normal job, and keep jobs chunked so a kill costs one chunk.
