# HTTP reference

## Contents

1. Status codes
2. Headers worth using
3. Problem details in code
4. Route handler templates
5. Cursor pagination
6. Idempotency keys
7. Webhooks you send
8. Webhooks you receive

## 1. Status codes

| Code | Name                  | Use it when                                                                                  |
| ---- | --------------------- | -------------------------------------------------------------------------------------------- |
| 200  | OK                    | A read, an update that returns the resource, or an action that completed                       |
| 201  | Created               | A `POST` created a resource; include `Location` and the resource body                        |
| 202  | Accepted              | Work was queued; include `Location` of a status resource                                      |
| 204  | No Content            | Success with nothing to return (`DELETE`, some `PUT`s)                                        |
| 301/308 | Moved              | The resource moved permanently (308 keeps the method)                                        |
| 304  | Not Modified          | Conditional `GET` with a matching `If-None-Match`                                             |
| 400  | Bad Request           | Malformed syntax: invalid JSON, wrong types in query strings                                  |
| 401  | Unauthorized          | No credentials or invalid ones; include `WWW-Authenticate`                                    |
| 403  | Forbidden             | Authenticated, but not allowed to do this                                                     |
| 404  | Not Found             | No such resource, or it exists but the caller may not know that                               |
| 405  | Method Not Allowed    | Method not supported on this URL; include `Allow`                                             |
| 409  | Conflict              | Conflicts with current state: duplicate unique value, invalid state transition, idempotency key reused with a different body |
| 410  | Gone                  | Removed on purpose and will not return (sunset endpoints)                                     |
| 412  | Precondition Failed   | `If-Match` did not match the current `ETag`                                                   |
| 413  | Content Too Large     | Body exceeds the limit                                                                        |
| 415  | Unsupported Media Type| Wrong `Content-Type`                                                                          |
| 422  | Unprocessable Content | Well-formed but fails validation or business rules                                            |
| 428  | Precondition Required | The endpoint requires `If-Match` and none was sent                                            |
| 429  | Too Many Requests     | Rate limited; include `Retry-After`                                                           |
| 500  | Internal Server Error | An unexpected error (a bug). Never for client mistakes                                        |
| 502  | Bad Gateway           | An upstream returned garbage                                                                  |
| 503  | Service Unavailable   | Overloaded or in maintenance; include `Retry-After`                                           |
| 504  | Gateway Timeout       | An upstream timed out                                                                         |

400 vs 422: use 400 when the request cannot be parsed into the expected types at all, 422 when it
parses but the values are not acceptable. Many APIs use 400 for both; pick one and be consistent.

## 2. Headers worth using

| Header                         | Direction | Purpose                                                       |
| ------------------------------ | --------- | ------------------------------------------------------------- |
| `X-Request-Id`                 | both      | Correlates a request across client, logs and traces            |
| `Idempotency-Key`              | request   | Makes a `POST` safe to retry                                  |
| `If-Match` / `ETag`            | both      | Optimistic concurrency for updates                            |
| `If-None-Match` / `ETag`       | both      | Conditional `GET` for caching                                 |
| `Location`                     | response  | URL of a created resource or a job status resource            |
| `Retry-After`                  | response  | Seconds (or a date) to wait after 429 or 503                  |
| `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` | response | Rate-limit state |
| `Deprecation`, `Sunset`, `Link: <...>; rel="deprecation"` | response | Announce an endpoint's removal date |
| `Cache-Control`                | response  | `private, no-store` for per-user data; `public, max-age` for shared |
| `Content-Type: application/problem+json` | response | Errors in Problem Details format              |

## 3. Problem details in code

```ts
// lib/http/problem.ts
export class Problem extends Error {
  constructor(
    public status: number,
    public type: string,
    public title: string,
    public detail?: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(title)
  }
}

export const notFound = (what: string) =>
  new Problem(404, 'not-found', `${what} not found`)

export const conflict = (detail: string) =>
  new Problem(409, 'conflict', 'Request conflicts with the current state', detail)

export function problemResponse(err: unknown, requestId: string, instance: string): Response {
  if (err instanceof Problem) {
    return Response.json(
      {
        type: `https://api.example.com/problems/${err.type}`,
        title: err.title,
        status: err.status,
        detail: err.detail,
        instance,
        requestId,
        ...err.extra,
      },
      { status: err.status, headers: { 'Content-Type': 'application/problem+json', 'X-Request-Id': requestId } },
    )
  }
  // Unknown error: log everything, return nothing internal.
  console.error({ err, requestId }, 'unhandled error')
  return Response.json(
    { type: 'https://api.example.com/problems/internal', title: 'Something went wrong', status: 500, requestId },
    { status: 500, headers: { 'Content-Type': 'application/problem+json', 'X-Request-Id': requestId } },
  )
}

// zod issues to field errors
import type { ZodError } from 'zod'
export const validationProblem = (error: ZodError) =>
  new Problem(422, 'validation-error', 'Request is invalid', `${error.issues.length} field(s) failed validation`, {
    errors: error.issues.map((i) => ({ path: i.path.join('.'), code: i.code, message: i.message })),
  })
```

## 4. Route handler templates

**Next.js App Router route handler**

```ts
// app/api/invoices/route.ts
import { CreateInvoice } from '@/lib/api/schemas'
import { problemResponse, validationProblem } from '@/lib/http/problem'
import { requireUser } from '@/lib/auth'
import { createInvoice, listInvoices } from '@/lib/invoices'

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()
  try {
    const user = await requireUser(req)                    // 401 if missing
    const body = CreateInvoice.safeParse(await req.json().catch(() => null))
    if (!body.success) throw validationProblem(body.error)
    const invoice = await createInvoice(user, body.data, {
      idempotencyKey: req.headers.get('idempotency-key'),
    })
    return Response.json(invoice, {
      status: 201,
      headers: { Location: `/api/invoices/${invoice.id}`, 'X-Request-Id': requestId },
    })
  } catch (err) {
    return problemResponse(err, requestId, '/api/invoices')
  }
}
```

**Hono**

```ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

app.onError((err, c) => problemResponse(err, c.get('requestId'), c.req.path))

app.get('/invoices', zValidator('query', ListInvoicesQuery), async (c) => {
  const user = c.get('user')
  const { limit, cursor, status } = c.req.valid('query')
  return c.json(await listInvoices(user, { limit, cursor, status }))
})
```

Keep handlers thin: parse, authorize, call a domain function, shape the response. Business logic
lives in plain functions that tests can call without HTTP.

## 5. Cursor pagination

Encode the last row's sort key and id; query with a row comparison so the database can use a
composite index.

```ts
type Cursor = { createdAt: string; id: string }
const encode = (c: Cursor) => Buffer.from(JSON.stringify(c)).toString('base64url')
const decode = (s: string): Cursor => JSON.parse(Buffer.from(s, 'base64url').toString())

export async function listInvoices(tenantId: string, { limit = 20, cursor }: { limit?: number; cursor?: string }) {
  const take = Math.min(limit, 100)
  const after = cursor ? decode(cursor) : null
  const rows = await sql<Invoice[]>`
    select * from invoices
    where tenant_id = ${tenantId}
      ${after ? sql`and (created_at, id) < (${after.createdAt}, ${after.id})` : sql``}
    order by created_at desc, id desc
    limit ${take + 1}
  `
  const page = rows.slice(0, take)
  const last = page.at(-1)
  return {
    data: page,
    nextCursor: rows.length > take && last ? encode({ createdAt: last.createdAt, id: last.id }) : null,
  }
}
// index: create index on invoices (tenant_id, created_at desc, id desc);
```

Fetching `take + 1` rows tells you whether another page exists without a count query. Treat the
cursor as opaque to clients; validate it on decode and answer 400 if it is malformed.

## 6. Idempotency keys

```sql
create table idempotency_keys (
  tenant_id      text        not null,
  key            text        not null,
  request_hash   text        not null,          -- sha256 of method + path + body
  status         text        not null check (status in ('processing', 'completed')),
  response_code  int,
  response_body  jsonb,
  created_at     timestamptz not null default now(),
  primary key (tenant_id, key)
);
```

Flow:

1. `insert ... on conflict do nothing returning *`. If the insert won, process the request.
2. If a row already existed: same `request_hash` and `completed` → replay the stored response;
   `processing` → 409 (a retry raced the original); different hash → 422 "key reused with a
   different request".
3. Save the response in the same transaction as the business change when possible, so the two
   cannot disagree.
4. Expire rows after 24-72 hours with a scheduled job.

## 7. Webhooks you send

- Payload: `{ "id": "evt_...", "type": "invoice.paid", "createdAt": "...", "data": { ... } }`.
  Event types are `noun.past_tense_verb`.
- Sign it: `t=<unix>,v1=<hex hmac-sha256(secret, t + "." + rawBody)>` in a `Webhook-Signature`
  header. Receivers reject timestamps older than 5 minutes to stop replays.
- Deliver from a queue, not inline. Retry non-2xx responses with exponential backoff for about
  three days, then mark the endpoint failing and notify the owner.
- Delivery is at-least-once; tell receivers to deduplicate on `id`.
- Give receivers a delivery log and a "resend" button. Send thin events ("invoice.paid" + id) if
  payload freshness matters; clients then fetch the current state.

## 8. Webhooks you receive

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export async function POST(req: Request) {
  const raw = await req.text()                     // verify against the raw body, before JSON.parse
  const header = req.headers.get('webhook-signature') ?? ''
  const { t, v1 } = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
  const expected = createHmac('sha256', process.env.WEBHOOK_SECRET!).update(`${t}.${raw}`).digest('hex')
  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300
  const valid = v1 && v1.length === expected.length && timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
  if (!fresh || !valid) return new Response('invalid signature', { status: 400 })

  const event = JSON.parse(raw)
  await enqueue('webhook.process', event, { dedupeKey: event.id })   // ack fast, process async
  return new Response(null, { status: 204 })
}
```

Acknowledge within a few seconds and process asynchronously; providers retry slow responses and
you will process the same event twice anyway, so make the processor idempotent.
