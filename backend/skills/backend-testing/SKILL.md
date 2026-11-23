---
name: backend-testing
description: Write, fix and review tests for backend code - unit tests for domain logic, integration tests against a real database, API/route tests, contract tests, tests for jobs, webhooks, time, randomness and external HTTP, plus diagnosing flaky and slow test suites - with Vitest or Jest (Node/TypeScript) or pytest (Python). Use this whenever adding or changing backend behaviour that should be tested, when asked to "add tests", raise coverage, test an endpoint, mock an API, set up a test database, or when tests are flaky, slow or failing in CI. Use it even when tests were not requested but the change touches money, permissions, data integrity or concurrency.
---

# Backend testing

Tests exist to let you change code without fear. A suite earns that trust when it fails for real
bugs, passes for correct code, runs fast enough to run constantly, and reads as a description of
behaviour. Mocks that mirror the implementation, snapshot dumps and sleeps produce suites that do
none of that.

## 1. Read the existing setup first

- Test runner and config (Vitest, Jest, node:test, pytest), where tests live, naming, helpers,
  factories, and how the database is provided in tests (containers, a shared dev DB, SQLite).
- Run the suite once before changing anything, and note what already fails or is slow.
- Follow the project's conventions. Add infrastructure (a test database, factories) only if the
  task needs it and nothing equivalent exists.

## 2. Test at the right level

| Level        | Covers                                               | Speed        | Use for                                                     |
| ------------ | ---------------------------------------------------- | ------------ | ----------------------------------------------------------- |
| Unit         | pure functions and domain logic, no I/O              | milliseconds | calculations, state machines, validation, parsing, policies |
| Integration  | code plus real database / queue / filesystem         | 10-100 ms    | repositories, queries, transactions, constraints, migrations |
| API          | the HTTP layer in-process (request to response)      | 10-100 ms    | status codes, auth, validation errors, response shapes       |
| Contract     | the agreement with another service                   | fast         | consumer expectations of provider APIs, webhook payloads     |
| End-to-end   | deployed system through real network                 | seconds      | a handful of critical journeys (signup, checkout)            |

For typical backend services, the most valuable tests are **integration and API tests against
a real database**: they catch the bugs that matter (wrong query, missing constraint, broken
transaction, auth hole) and survive refactoring. Mock only what you do not own and cannot run
locally (third-party APIs, email, payment providers).

## 3. What to test

For each behaviour, cover:

- the success path, asserting the full observable result (response body, rows written, events
  emitted), not just "no error";
- validation failures and their error shape;
- **authorization**: unauthenticated (401), wrong role (403), and **another tenant's object** (404).
  The cross-tenant test is the one that catches the most serious bugs;
- not found and conflict cases (duplicate unique value, invalid state transition, stale `If-Match`);
- boundaries: zero, one, many, maximum page size, empty strings, Unicode, very large values,
  time-zone and daylight-saving edges for date logic;
- idempotency: the same request with the same `Idempotency-Key` twice creates one record;
- concurrency where it matters: two simultaneous requests cannot both succeed when only one
  should (double spend, oversold stock).

Do not test the framework, the ORM, or private helpers through contortions; test through the
public behaviour.

## 4. Write tests that read like specifications

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, signInAs } from '../test/app'
import { buildTenant, buildUser, buildInvoice } from '../test/factories'

describe('POST /invoices/:id/void', () => {
  let app: TestApp
  beforeEach(async () => { app = await createTestApp() })

  it('voids a sent invoice and records who voided it', async () => {
    const tenant = await buildTenant()
    const owner = await buildUser({ tenantId: tenant.id, role: 'owner' })
    const invoice = await buildInvoice({ tenantId: tenant.id, status: 'sent' })

    const res = await app.request(`/invoices/${invoice.id}/void`, { method: 'POST', headers: await signInAs(owner) })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: invoice.id, status: 'void' })
    expect(await app.db.invoice.findUnique({ where: { id: invoice.id } })).toMatchObject({ status: 'void', voidedById: owner.id })
  })

  it('returns 404 for an invoice in another tenant', async () => {
    const [mine, theirs] = await Promise.all([buildTenant(), buildTenant()])
    const owner = await buildUser({ tenantId: mine.id, role: 'owner' })
    const invoice = await buildInvoice({ tenantId: theirs.id, status: 'sent' })

    const res = await app.request(`/invoices/${invoice.id}/void`, { method: 'POST', headers: await signInAs(owner) })

    expect(res.status).toBe(404)
  })

  it('rejects voiding a paid invoice with 409', async () => { /* ... */ })
})
```

- Name tests by behaviour: "returns 404 for an invoice in another tenant", not "test void 2".
- Arrange, act, assert, visibly separated. One behaviour per test.
- Build only the data the test needs, with **factories** that fill sensible defaults and accept
  overrides. Shared global fixtures couple tests and hide what matters.
- Assert on outcomes the user or caller sees, not on which internal function was called.

## 5. A real database in tests

- Run Postgres for tests the same version as production: Testcontainers, or a `docker compose`
  service in CI. SQLite in place of Postgres hides real bugs (constraints, types, locking).
- Apply the real migrations to the test database, so migrations are tested too.
- Isolate tests by: a transaction per test rolled back at the end (fastest, but cannot test code
  that manages its own transactions), truncating tables between tests, or a template database
  cloned per worker. Pick one and use it everywhere.
- Parallel workers each get their own database or schema.

Setup recipes in `references/test-infrastructure.md`.

## 6. Control time, randomness and the outside world

- **Time**: inject a clock or use fake timers (`vi.useFakeTimers()`, `vi.setSystemTime(...)`;
  `freezegun` / `time-machine` in Python). Never assert against "now" read separately from the code.
- **Randomness and IDs**: inject generators, or assert on shape (`/^inv_/`) rather than value.
- **External HTTP**: intercept at the network layer (MSW, nock, `respx`) with realistic recorded
  responses, including errors and timeouts. Assert the outgoing request when it matters (amount,
  idempotency key).
- **Email, SMS, queues**: an in-memory fake implementing the same interface, inspected by the test.
- **Never call real third-party services from the default test run.** Keep a separate, opt-in
  suite for that if needed.

## 7. Flaky and slow tests

A flaky test is a bug, either in the test or in the code (often a real race). Diagnose:

1. Reproduce: run the single test many times (a shell loop around `vitest run -t "name"`, the
   `repeats` test option in Vitest, `pytest --count 50` with pytest-repeat) and with the full
   suite in random order (`--sequence.shuffle` in Vitest, pytest-randomly).
2. Typical causes: shared state between tests (leftover rows, module-level caches, singletons),
   time (midnight, month ends, time zones, `setTimeout`), ordering assumptions (`order by`
   missing in a query, object key order), real network, async work not awaited, ports in use.
3. Fix the cause. Never "fix" with retries or longer sleeps; replace sleeps with awaiting the
   condition.

For slow suites: profile which tests and setup steps dominate, share expensive setup per file
(not per test) when it is read-only, run in parallel with isolated databases, and move logic
tests down to unit level where they do not need I/O.

## 8. Coverage

Use coverage to find untested behaviour, not as a target. 100% line coverage with weak
assertions is worse than 70% with tests that pin real behaviour. Check that the risky code
(money, permissions, state transitions, data deletion) is covered by assertions on outcomes.

## 9. Before finishing

- Run the tests you touched and the full suite; report the actual results, including failures.
- Make sure a new test **fails without the fix** (revert the change briefly, or reason it through
  explicitly) so it tests what it claims.
- Remove `.only`, debug logging and skipped tests you added.

## Reference files

- `references/test-infrastructure.md` - Vitest + Testcontainers Postgres setup, transaction and
  truncation isolation, factories, in-process API testing for Next.js route handlers, Hono and
  Express, MSW for outbound HTTP, fake clocks, pytest equivalents, and CI configuration.
