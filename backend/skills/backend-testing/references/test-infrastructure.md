# Test infrastructure recipes

## Contents

1. Vitest with a real Postgres (Testcontainers)
2. Isolation strategies
3. Factories
4. In-process API tests
5. Mocking outbound HTTP with MSW
6. Time
7. Testing jobs and outbox processing
8. Concurrency tests
9. pytest equivalents
10. CI

## 1. Vitest with a real Postgres

```ts
// test/global-setup.ts  (vitest.config.ts: test.globalSetup = ['test/global-setup.ts'])
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { execSync } from 'node:child_process'

let container: StartedPostgreSqlContainer

export async function setup() {
  container = await new PostgreSqlContainer('postgres:17-alpine').start()   // match production's major version
  process.env.DATABASE_URL = container.getConnectionUri()
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env })   // or your migration command
}

export async function teardown() {
  await container?.stop()
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['test/global-setup.ts'],
    setupFiles: ['test/setup.ts'],
    pool: 'forks',
    // one database per worker if tests write in parallel; or fileParallelism: false for a single DB
  },
})
```

Without Docker in CI, use a Postgres service container (section 10) and point `DATABASE_URL` at it.

## 2. Isolation strategies

**Truncate between tests** (simple, works with code that opens its own transactions):

```ts
// test/setup.ts
import { afterEach } from 'vitest'
import { db } from '../lib/db'

afterEach(async () => {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    select tablename from pg_tables where schemaname = 'public' and tablename not like '_prisma%'`
  if (tables.length) {
    await db.$executeRawUnsafe(`truncate ${tables.map((t) => `"${t.tablename}"`).join(', ')} restart identity cascade`)
  }
})
```

**Transaction per test** (fastest): open a transaction in `beforeEach`, give the code a client
bound to it, roll back in `afterEach`. Requires that application code accepts an injected client
and does not commit itself.

**Database per worker**: create `app_test_${process.env.VITEST_POOL_ID}` from a migrated template
(`create database x template app_test_template`) in setup; lets files run in parallel.

## 3. Factories

```ts
// test/factories.ts
import { db } from '../lib/db'
let seq = 0
const next = () => ++seq

export async function buildTenant(overrides: Partial<TenantInput> = {}) {
  return db.tenant.create({ data: { name: `Tenant ${next()}`, ...overrides } })
}

export async function buildUser(overrides: Partial<UserInput> & { tenantId: string }) {
  const n = next()
  return db.user.create({ data: { email: `user${n}@test.example`, name: `User ${n}`, role: 'member', ...overrides } })
}

export async function buildInvoice(overrides: Partial<InvoiceInput> & { tenantId: string }) {
  const customer = overrides.customerId ? null : await db.customer.create({ data: { tenantId: overrides.tenantId, name: `Customer ${next()}` } })
  return db.invoice.create({
    data: { customerId: customer?.id, amountCents: 10_000, currency: 'USD', status: 'draft', dueOn: new Date('2026-12-31'), ...overrides },
  })
}
```

Defaults are valid and boring; tests override only what they are about. Unique values come from
a counter, not randomness, so failures reproduce.

## 4. In-process API tests

**Next.js route handlers**: call the exported function with a `Request`.

```ts
import { POST } from '@/app/api/invoices/route'

const res = await POST(new Request('http://test/api/invoices', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: await sessionCookieFor(user) },
  body: JSON.stringify({ customerId: 'cus_1', currency: 'USD', lines: [], dueOn: '2026-12-31' }),
}))
expect(res.status).toBe(422)
```

Dynamic route params: pass `{ params: Promise.resolve({ id }) }` as the second argument. Code that
calls `cookies()` or `headers()` from `next/headers` needs a request scope; prefer reading the
session from the `Request` in a helper you can call directly, or test through a running server
for those paths.

**Hono**: `await app.request('/invoices', { method: 'POST', body, headers })`.

**Express / Fastify**: `supertest(app)` or `fastify.inject({ method, url, payload })`.

## 5. Mocking outbound HTTP with MSW

```ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  http.post('https://api.payments.example/v1/charges', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 'ch_123', status: 'succeeded', amount: body.amount })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))   // unexpected calls fail the test
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('surfaces a declined card as 402', async () => {
  server.use(http.post('https://api.payments.example/v1/charges', () =>
    HttpResponse.json({ error: { code: 'card_declined' } }, { status: 402 })))
  // ...
})
```

Test the failure modes: 4xx, 5xx, timeouts (`await delay('infinite')` with a client timeout),
malformed bodies.

## 6. Time

```ts
import { vi } from 'vitest'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-23T09:00:00Z')) })
afterEach(() => vi.useRealTimers())

it('marks invoices overdue the day after the due date', async () => {
  const invoice = await buildInvoice({ tenantId, status: 'sent', dueOn: new Date('2026-11-22') })
  await markOverdueInvoices()
  expect((await getInvoice(invoice.id)).status).toBe('overdue')
})
```

Fake timers do not change the database's `now()`; pass times as parameters, or compute "now" in
the application and send it to the query.

## 7. Testing jobs and outbox processing

- Test the job handler as a function: given this payload and database state, it produces these
  rows and these outgoing calls.
- Test idempotency: run the handler twice with the same payload; assert one effect.
- Test the outbox: the business transaction writes the event row; a separate test runs the relay
  once and asserts publication and the row marked sent.
- Do not wait on real queue timing in tests; invoke the processor directly or use the queue
  library's test mode.

## 8. Concurrency tests

```ts
it('does not oversell the last ticket', async () => {
  const event = await buildEvent({ capacity: 1 })
  const [a, b] = await Promise.allSettled([buyTicket(event.id, userA), buyTicket(event.id, userB)])
  const ok = [a, b].filter((r) => r.status === 'fulfilled')
  expect(ok).toHaveLength(1)
  expect(await countTickets(event.id)).toBe(1)
})
```

Run against a real database with separate connections; a single shared connection serializes
everything and hides the race.

## 9. pytest equivalents

| Need                 | pytest                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Postgres container   | `testcontainers[postgres]` in a session-scoped fixture                   |
| Isolation            | a function-scoped fixture that opens a transaction and rolls back (SQLAlchemy `connection.begin()` + session bound to it) |
| Factories            | `factory_boy` or plain builder functions                                 |
| API tests            | FastAPI `TestClient` / `httpx.AsyncClient(transport=ASGITransport(app))`; Django test client |
| HTTP mocking         | `respx` (httpx), `responses` (requests)                                  |
| Time                 | `time-machine` or `freezegun`                                            |
| Repeat flaky test    | `pytest-repeat` (`--count 50`), `pytest-randomly` for order               |
| Parallel             | `pytest-xdist` (`-n auto`) with a database per worker                    |

## 10. CI

```yaml
# .github/workflows/test.yml (job excerpt)
services:
  postgres:
    image: postgres:17-alpine
    env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: app_test }
    ports: ['5432:5432']
    options: >-
      --health-cmd "pg_isready -U postgres" --health-interval 5s --health-timeout 5s --health-retries 10
env:
  DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
steps:
  - run: npm ci
  - run: npx prisma migrate deploy
  - run: npx vitest run --reporter=default --reporter=junit --outputFile=test-results.xml
```

Upload the JUnit report so failures show in the PR, and keep the test job under about ten
minutes; split by shards (`vitest --shard=1/4`) before it grows past that.
