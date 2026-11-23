# API review checklist

Report findings ordered by impact. For each: the endpoint, what a client experiences, and the
fix.

## Breaking changes (block the change)

- [ ] No field removed, renamed or retyped in any response.
- [ ] No optional input made required; no validation tightened on existing fields.
- [ ] No status code or error `type` changed for an existing case.
- [ ] No change in the meaning of an existing field or enum value.
- [ ] If a breaking change is intended: new version, deprecation headers, migration notes.

## Security

- [ ] Every endpoint authenticates, or is deliberately public and documented as such.
- [ ] Object-level authorization: the handler checks that this caller may access this specific
      resource (and tenant), not only that they are logged in.
- [ ] Input parsed with an allowlist schema; server-owned fields (`id`, `ownerId`, `role`,
      `tenantId`, timestamps) cannot be set by the client.
- [ ] All strings, arrays and numbers are bounded; page size is capped.
- [ ] No secrets, internal IDs, stack traces or SQL in responses or error messages.
- [ ] Rate limiting on authentication, expensive and unauthenticated routes.
- [ ] Outbound URLs supplied by users are validated against SSRF (no internal addresses).

## Correctness

- [ ] Correct method and status code (201 + `Location` on create, 204 on delete, 4xx for client errors).
- [ ] Creates that may be retried accept an `Idempotency-Key`.
- [ ] Concurrent updates guarded with `ETag`/`If-Match` or a version column where lost updates matter.
- [ ] Side effects happen after the transaction commits (outbox or job), never before.
- [ ] Every outbound call has a timeout.
- [ ] Pagination is stable (unique tiebreaker in the sort) and indexed.

## Consistency

- [ ] Naming, casing, ID format and timestamp format match the rest of the API.
- [ ] Errors use the shared problem format with a request ID.
- [ ] Collections are wrapped (`{ data, nextCursor }`), never bare arrays.
- [ ] Money as integer minor units with currency; dates as ISO 8601.
- [ ] Filters and sort parameters follow the existing style.

## Contract and docs

- [ ] OpenAPI updated: summary, request/response schemas, all error responses, an example.
- [ ] Tests cover success, validation failure, unauthenticated, forbidden (other tenant's
      resource), not found and conflict cases.
