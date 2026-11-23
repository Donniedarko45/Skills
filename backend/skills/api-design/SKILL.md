---
name: api-design
description: Design, build and review HTTP APIs - resource modelling, URLs and methods, status codes, error format, validation, pagination, filtering, idempotency, versioning and evolution, rate limits, webhooks, long-running operations and OpenAPI contracts - in TypeScript/Node (Next.js route handlers, Hono, Fastify, Express) or any other stack. Use this whenever creating or changing an API endpoint, route handler, REST or JSON API, server action that other clients call, webhook, SDK surface or OpenAPI spec; whenever the user asks how an endpoint should look, which status code to return, how to paginate, version or deprecate; and when reviewing an API for consistency. Use it even for "just add an endpoint", because API shapes are hard to change once clients depend on them.
---

# API design

An API is a promise to code you do not control. Once a client depends on a field, a status code
or an error shape, changing it breaks someone. So the work is mostly front-loaded: model the
resources well, be boringly consistent, and make every future change additive.

## 1. Read the existing API first

Consistency with the API that already exists beats any rule in this skill. Before adding an
endpoint, check:

- How existing routes are named (plural nouns? nested?), how IDs look, and the casing of JSON
  fields (`camelCase` or `snake_case`). Match them.
- The error shape already in use, the pagination style, the auth mechanism, and any OpenAPI spec.
- The framework and validation library (zod, valibot, TypeBox, class-validator, pydantic).

If the API has no conventions yet, adopt the defaults below and write them down (an
`API-CONVENTIONS.md` or the OpenAPI spec's description), so the next endpoint matches.

## 2. Model resources, not actions

- **URLs name things; methods say what to do.** `POST /invoices`, `GET /invoices/inv_123`,
  `PATCH /invoices/inv_123`, `DELETE /invoices/inv_123`. Not `POST /createInvoice`.
- Plural collection nouns, lowercase, hyphenated: `/payment-methods`.
- Nest only for true ownership and at most one level: `/customers/cus_1/invoices`. Anything
  deeper becomes a top-level resource with a filter: `/invoices?customer=cus_1`.
- **Actions that are not CRUD** become sub-resources or state transitions:
  `POST /invoices/inv_123/send`, `POST /invoices/inv_123/void`. Prefer a verb sub-resource over
  letting `PATCH status` trigger side effects, because the action has its own validation,
  permissions and audit trail.
- **IDs are opaque strings**, ideally prefixed by type (`inv_01J...`, `cus_01J...`). Prefixes make
  logs and support tickets readable and catch "wrong kind of ID" bugs. Never expose
  auto-increment integers: they leak volume and invite enumeration.

## 3. Methods and status codes

| Method   | Use                                  | Safe | Idempotent | Success code                 |
| -------- | ------------------------------------ | ---- | ---------- | ---------------------------- |
| `GET`    | read                                  | yes  | yes        | 200                           |
| `POST`   | create, or run an action             | no   | no*        | 201 + `Location` (create), 200 or 202 (action) |
| `PUT`    | replace whole resource at a known URL | no   | yes        | 200 or 204                    |
| `PATCH`  | partial update                       | no   | should be  | 200 with the updated resource |
| `DELETE` | remove                               | no   | yes        | 204 (or 200 with a body)      |

\* Make `POST` safe to retry with an idempotency key (section 7).

Errors: `400` malformed request, `401` not authenticated, `403` authenticated but not allowed,
`404` not found (also use it instead of 403 when revealing existence would leak information),
`409` conflict with current state, `412` failed precondition (`If-Match`), `415` wrong content
type, `422` well-formed but semantically invalid, `429` rate limited, `500` bug, `502`/`503`/`504`
upstream or availability problems. Full table in `references/http-reference.md`.

Rules that prevent most bugs: never return `200` with an error in the body; never return `500`
for a client mistake (validation errors are 4xx); never leak stack traces or SQL in responses.

## 4. Requests and responses

- **JSON in, JSON out.** `Content-Type: application/json`. One casing everywhere.
- **Return the resource** after create and update, so clients need no second request.
- **Stable shapes.** A field is always present (use `null`, not omission) and always the same
  type. Arrays are never `null`; use `[]`.
- **Timestamps** in ISO 8601 UTC with a `Z`: `"2026-11-23T17:58:21Z"`. Field names say what
  they are: `createdAt`, `dueOn` (a date without time), `expiresAt`.
- **Money** as an integer in minor units plus an ISO currency code:
  `{ "amount": 12900, "currency": "USD" }`. Never floats.
- **Enums** as lowercase strings (`"status": "past_due"`), documented, and clients must be told
  to tolerate unknown values, so you can add one later.
- **Booleans** named as questions: `isDefault`, `hasMore`.
- **Never accept fields the client must not set** (`id`, `ownerId`, `role`, `createdAt`). Parse
  input with an allowlist schema; do not spread request bodies into database writes
  (mass assignment).
- Wrap collections in an object (`{ "data": [...], "nextCursor": "..." }`), never a bare array,
  so pagination metadata can be added without a breaking change.

## 5. Validation at the boundary

Validate every input (path params, query, headers, body) with a schema at the edge of the
handler, before any business logic. Turn the parsed result into typed domain input; never pass
raw request objects deeper.

```ts
import { z } from 'zod'

export const CreateInvoice = z.object({
  customerId: z.string().startsWith('cus_'),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  lines: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().int().positive().max(10_000),
    unitAmount: z.number().int().nonnegative(),
  })).min(1).max(100),
  dueOn: z.iso.date(),
}).strict()
```

Bound everything: string lengths, array sizes, numeric ranges, page sizes. Unbounded input is a
denial-of-service vector and a database surprise.

## 6. Errors: one shape everywhere

Use RFC 9457 Problem Details (`application/problem+json`) unless the API already has a shape:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Request body is invalid",
  "status": 422,
  "detail": "2 fields failed validation.",
  "instance": "/invoices",
  "requestId": "req_01JDX4...",
  "errors": [
    { "path": "lines.0.quantity", "code": "too_small", "message": "Must be at least 1" },
    { "path": "dueOn", "code": "invalid_date", "message": "Use YYYY-MM-DD" }
  ]
}
```

- `type` is a stable identifier clients can switch on; `title` is for humans and may change.
- Include a request ID in every response (header `X-Request-Id` and in error bodies) and in logs,
  so a support ticket leads straight to the trace.
- Field errors carry a machine-readable `path` and `code`.
- Map errors in one place (an error handler or wrapper), not ad hoc in each route.

## 7. Idempotency and concurrency

- **Idempotency keys** for any `POST` that creates something or moves money: the client sends
  `Idempotency-Key: <uuid>`; the server stores the key with the request fingerprint and the
  response, and replays the stored response for a retry with the same key (409 or 422 if the same
  key arrives with a different body). Keep keys for at least 24 hours.
- **Optimistic concurrency** for updates that could race: return an `ETag` (or `version`), require
  `If-Match` on `PATCH`/`PUT`, and answer `412` when it does not match. This prevents lost updates
  when two people edit the same record.
- Make handlers safe to retry: side effects (emails, charges, webhooks) go through a job or
  outbox keyed by the operation, not fired inline before the transaction commits (see the
  `background-jobs` skill).

## 8. Collections: pagination, filtering, sorting

- **Cursor pagination by default**: `GET /invoices?limit=50&cursor=...` returning
  `{ data, nextCursor }` (`null` at the end). The cursor encodes the last item's sort key, so it
  is stable under inserts and fast at any depth. Offset pagination (`page=3`) is acceptable only
  for small, admin-style lists that need page numbers.
- Default and maximum `limit` (for example 20 and 100). Reject or clamp larger values.
- Filters as plain query parameters: `?status=overdue&customer=cus_1&createdAfter=2026-11-01`.
  Allowlist filterable fields and make sure each has an index.
- Sorting: `?sort=-createdAt` (minus for descending), allowlisted, always with a unique
  tiebreaker (`id`) so pages never overlap.
- Totals are expensive at scale; return `totalCount` only when asked or when cheap.

## 9. Evolving without breaking clients

Additive changes are safe: new endpoints, new optional request fields, new response fields, new
enum values (if clients were told to tolerate them). Everything else is breaking: removing or
renaming fields, changing types or meanings, making optional input required, changing status
codes or error `type`s, tightening validation.

- Prefer **evolution over versions**. When a breaking change is unavoidable, version the whole
  API (`/v2/...` path, or a dated version header like `Api-Version: 2026-11-01`) rather than
  individual endpoints.
- **Deprecate before removing**: document it, send `Deprecation` and `Sunset` headers, log who
  still calls it, and give a dated migration window.
- Keep the OpenAPI spec in the repo and diff it in CI to catch accidental breaking changes.

## 10. Operational concerns

- **Rate limits** per credential and per IP for unauthenticated routes. Return `429` with
  `Retry-After` and `RateLimit-*` headers.
- **Timeouts** on every outbound call, and an overall request deadline. A handler that waits
  forever on a dependency takes the service down with it.
- **Caching**: `Cache-Control` and `ETag` on cacheable `GET`s; `private, no-store` for
  per-user data.
- **Security**: authenticate every endpoint unless deliberately public; authorize per object
  (can *this* user see *this* invoice?) not just per route (see the `auth-security` skill);
  enforce HTTPS; set CORS to explicit origins.
- **Long-running work**: return `202 Accepted` with a `Location` to a status resource
  (`/exports/exp_1`) that reports `pending | running | succeeded | failed` and the result link.
- **Webhooks** you send: signed payloads (HMAC with timestamp), event IDs for deduplication,
  retries with backoff, and a way for receivers to replay. Details in the reference.

## 11. Document it as a contract

Keep an OpenAPI 3.1 document as the source of truth, generated from the schemas
(zod-to-openapi, TypeBox, FastAPI's built-in generation) or written first and used to generate
types. Every operation gets a summary, request and response schemas, error responses and an
example. Generated, tested docs stay true; hand-written prose drifts.

## Reviewing an API change

Work through `references/review-checklist.md` and report findings by impact: breaking changes
and security first, then consistency, then polish. For each, say what a client would experience
and the concrete fix.

## Reference files

- `references/http-reference.md` - status codes with when-to-use, useful headers, problem
  details examples, cursor pagination implementation, idempotency key storage, webhook signing,
  and a route handler template for Next.js and Hono.
- `references/review-checklist.md` - checklist for reviewing a new or changed endpoint.
