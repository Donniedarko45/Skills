---
name: background-jobs
description: Design and build background jobs, queues, scheduled tasks and event-driven work - when to move work off the request path, idempotent job handlers, retries with backoff and jitter, dead-letter queues, the transactional outbox, cron and scheduled jobs, long-running jobs with progress, concurrency and rate limits, graceful shutdown and queue observability - with BullMQ, pg-boss, Graphile Worker, SQS, Inngest, Trigger.dev, Celery or similar. Use this whenever the task involves sending emails or webhooks, calling slow or flaky third-party APIs, processing uploads or imports, generating reports or PDFs, syncing data, scheduled or recurring tasks, event handlers, or any work that should survive a crash or retry safely. Use it even when the user just says "send an email when X happens", because doing it inline in the request is usually the bug.
---

# Background jobs

Work moves to the background for three reasons: it is slow, it talks to something unreliable, or
it must happen even if the request that triggered it fails. Queues deliver messages **at least
once**, workers crash mid-job, and retries run the same job again. So every job must be safe to
run twice, every failure must end somewhere visible, and the act of enqueueing must not be lost
when the database commit succeeds.

## 1. Read what exists first

Find the queue or scheduler in use (BullMQ/Redis, pg-boss or Graphile Worker on Postgres, SQS,
Pub/Sub, Inngest, Trigger.dev, Celery, Sidekiq, a platform cron), how workers are deployed, and
how existing jobs are structured. Add jobs in the same system; a second queue technology is a
second thing to operate.

If there is none: on Postgres, a Postgres-backed queue (pg-boss, Graphile Worker, or the
`FOR UPDATE SKIP LOCKED` pattern) avoids new infrastructure and lets jobs be enqueued in the same
transaction as the data. Redis-based BullMQ suits high throughput; a managed queue (SQS) or a
durable-workflow platform suits serverless deployments.

## 2. What belongs in a job

Move off the request path:

- outbound email, SMS, push, webhooks;
- calls to slow or rate-limited third-party APIs;
- file processing, imports, exports, PDFs, image and video work;
- fan-out (notify 10,000 users), aggregation, cache warming, search indexing;
- anything that must be retried until it succeeds.

Keep in the request: work whose result the user needs immediately to continue, and validation.
Return `202 Accepted` with a status resource for long work the user waits on (see the
`api-design` skill).

## 3. Enqueue reliably: the outbox

The classic bug: save the order, then enqueue "send confirmation". If the process dies between
the two, or the enqueue fails, the email never goes. If you enqueue first and the transaction
rolls back, the email goes for an order that does not exist.

Fix it with one of:

- **Same-database queue**: with a Postgres-backed queue, insert the job in the same transaction
  as the business change. Both commit or neither does.
- **Transactional outbox**: write an `outbox` row in the same transaction; a relay process reads
  unsent rows, publishes them to the queue or event bus, and marks them sent. Delivery becomes
  at-least-once, so consumers deduplicate.

Never enqueue inside a transaction that might roll back, and never call external services
inside a database transaction.

## 4. Idempotent handlers

Assume every job runs more than once. Make the effect happen once:

- **Natural idempotency**: "set status to paid" is safe to repeat; "add 10 to balance" is not.
  Prefer state-setting operations.
- **Idempotency keys downstream**: pass a stable key (the job ID or business ID) to APIs that
  support it (payment providers, email providers).
- **Record completion**: a `processed_events (event_id primary key)` insert in the same
  transaction as the effect; a duplicate hits the unique constraint and is skipped.
- **Check before acting**: "if the invoice email was already sent, stop", stored on the record
  and updated atomically.
- **Deduplicate on enqueue** where the queue supports a job key (`jobId` in BullMQ,
  `singletonKey` in pg-boss), to avoid piling up identical jobs.

## 5. Retries, backoff and dead letters

- Retry transient failures (timeouts, 5xx, 429, connection errors) with **exponential backoff
  plus jitter** (for example 10s, 30s, 2m, 10m, 1h ... with ±20% randomness), capped at a maximum
  number of attempts or age.
- Do **not** retry permanent failures (validation errors, 4xx other than 408/429, missing records):
  fail immediately with a clear reason. Distinguish them explicitly in the handler.
- After the last attempt, move the job to a **dead-letter** queue or failed state that someone
  sees: an alert on dead-letter growth, and a way to inspect and replay.
- Respect `Retry-After` from rate-limited APIs.
- Give every job a **timeout** shorter than the queue's visibility or lock timeout, or a second
  worker will pick it up while the first is still running.

## 6. Payloads

- Pass **IDs, not objects**: `{ invoiceId }`, then load fresh state in the handler. Snapshots go
  stale between enqueue and run, and large payloads strain the queue.
- Include a schema version or job version when payloads may change, and keep handlers able to
  process the previous version during a deploy.
- Validate the payload at the start of the handler; a malformed job is a permanent failure.
- No secrets in payloads; they are stored and often visible in dashboards.

## 7. Concurrency and ordering

- Set worker concurrency deliberately, based on what the job hits: database connections,
  third-party rate limits, CPU. A limiter per external API (for example 10 requests per second
  across all workers) prevents a backlog from turning into a 429 storm.
- Most queues do not guarantee order. When order matters per entity, use a per-key group or
  partition (BullMQ groups, SQS FIFO message groups) or serialize with a lock on the entity.
- Prevent overlapping runs of the same logical job (a sync for one account) with a lock or a
  unique job key.

## 8. Scheduled and recurring jobs

- Use the queue's repeatable/cron jobs or the platform scheduler, not `setInterval` in a web
  process (it runs once per instance and dies with deploys).
- Ensure **one run per schedule** across instances: the queue's built-in deduplication, or a
  lock (`pg_try_advisory_lock`) around the run.
- Make runs **catch-up safe**: process "everything due and not yet done" (`where due_at <= now()
  and processed_at is null`) rather than "what happened in the last 5 minutes", so a missed run is
  repaired by the next one.
- Store schedules in UTC; be explicit about the time zone for user-facing schedules ("9:00 in the
  customer's zone").

## 9. Long-running jobs

- Break work into **chunks** (pages of 500 records) that each commit and record a cursor, so a
  crash resumes rather than restarts.
- Report progress on a job record (`processed`, `total`, `status`) for the UI to poll.
- Support cancellation by checking a flag between chunks.
- For multi-step workflows with waits and compensation (charge, then provision, then email, undo
  on failure), use a durable workflow engine (Temporal, Inngest, Trigger.dev, Step Functions)
  rather than chaining ad-hoc jobs.

## 10. Graceful shutdown

On `SIGTERM`: stop taking new jobs, let running jobs finish within a grace period, then exit.
Jobs that cannot finish in time must be safe to be retried (they will be). Make sure the
deployment's termination grace period is longer than the typical job duration, or chunk the work.

## 11. Observability

For every queue: depth, **age of the oldest waiting job** (the best single health signal),
processing rate, failure rate, retry count, dead-letter count and job duration. Log job start and
end with job ID, type, attempt and the business IDs; propagate the trace context from the
enqueuing request. Alert on oldest-job age and dead-letter growth, not on individual failures
that will be retried.

## 12. Testing jobs

Test the handler as a function with database state in and effects out; run it twice to prove
idempotency; test permanent vs transient failure classification; test the outbox relay
separately. Details in the `backend-testing` skill.

## Reference files

- `references/patterns.md` - code for the outbox table and relay, a Postgres `SKIP LOCKED`
  worker, BullMQ queue and worker setup with retries and limiter, pg-boss usage, backoff with
  jitter, error classification, advisory-lock cron, chunked resumable jobs and graceful shutdown.
