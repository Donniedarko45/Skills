---
name: observability
description: Instrument backend services so production behaviour can be understood - structured logging, request and correlation IDs, metrics (RED, histograms, cardinality), distributed tracing with OpenTelemetry, error tracking, health checks, and debugging production issues from logs, metrics and traces. Use this whenever adding or reviewing logging, adding metrics or traces, setting up OpenTelemetry, Sentry, Datadog, Grafana, Honeycomb or similar, writing health or readiness endpoints, or when asked "why is this slow / failing in production" and the answer needs better telemetry. Use it whenever building a new service or endpoint, because instrumentation added after an incident is too late for that incident.
---

# Observability

The test of observability is simple: when something goes wrong in production, can you answer
"what happened, to whom, and why" without deploying new code? That needs three signals that
connect to each other: **logs** that are structured events, **metrics** that show rates and
distributions over time, and **traces** that show where one request spent its time. A shared
request ID or trace ID ties them together.

## 1. Read what exists first

Find the logger (pino, winston, console, structlog), the error tracker (Sentry, Rollbar), the
metrics and tracing setup (OpenTelemetry, Datadog, Prometheus client), and where telemetry is
shipped. Extend these; do not add a second logger or a second tracing SDK.

## 2. Logs: structured events

- **JSON, one event per line**, with a consistent set of fields. In Node, `pino` is the default
  choice; in Python, `structlog` or the standard library with a JSON formatter.
- Every log line in a request carries `requestId` (or `traceId`/`spanId`), plus `userId` and
  `tenantId` when known. Use a child logger bound at the start of the request, or
  `AsyncLocalStorage`, so the context is added automatically.
- **Message is a constant; data goes in fields**: `log.info({ invoiceId, amountCents }, 'invoice voided')`,
  not ``log.info(`invoice ${id} voided for ${amount}`)``. Constant messages can be counted and searched.
- **Levels mean something**: `error` = needs a human (with the error object and stack), `warn` =
  unexpected but handled, `info` = notable business events and request summaries, `debug` = off
  in production unless switched on deliberately.
- **One summary line per request** (method, route template, status, duration, user, tenant)
  beats many lines per request.
- **Never log** passwords, tokens, API keys, session cookies, full card numbers, or more personal
  data than needed. Configure redaction paths in the logger (`req.headers.authorization`,
  `*.password`) as a safety net, not a substitute.
- Log errors once, where they are handled, with the error object. Catch-log-rethrow at every
  layer produces five copies of one failure.

```ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'], remove: true },
  base: { service: 'billing-api', env: process.env.APP_ENV, version: process.env.GIT_SHA },
})
```

## 3. Metrics: rates and distributions

Measure every service with **RED** for requests (Rate, Errors, Duration) and **USE** for
resources (Utilization, Saturation, Errors: pools, queues, CPU, memory).

- Duration as a **histogram**, never an average: averages hide the slow tail that users feel.
  Report p50, p95, p99.
- Label by bounded values only: route **template** (`/invoices/:id`, never the raw path), method,
  status class, outcome. **Never** label by user ID, request ID, email or raw URL: unbounded
  label values (cardinality) blow up cost and storage.
- Add business metrics for what the product promises: invoices sent, payments succeeded and
  failed, signups, jobs processed. These detect breakage that HTTP 200s hide.
- Saturation for every pool and queue: database pool in-use and waiting, queue depth and
  oldest-message age, event-loop lag in Node.

Naming (Prometheus/OpenTelemetry conventions): `http.server.request.duration` (seconds),
`app_invoices_sent_total`, units in the name or metadata, `_total` for counters.

## 4. Traces: where the time went

- Use **OpenTelemetry**: auto-instrumentation covers HTTP servers and clients, database drivers
  and many queues. Start the SDK before anything else is imported.
- Propagate context (W3C `traceparent`) across every hop: outgoing HTTP, queue messages (put the
  context in message attributes), scheduled jobs (start a new root span).
- Add manual spans around meaningful units of work the auto-instrumentation cannot see
  (`invoice.render_pdf`, `ledger.post_entries`) with attributes for IDs and sizes.
- Record exceptions on the span and set the span status to error.
- Sample sensibly: keep all errors and slow requests (tail sampling in the collector), and a
  percentage of the rest.
- Put the trace ID in logs and in error responses' `requestId`, so a customer's error ID leads
  straight to the trace.

Setup snippets for Node (including Next.js `instrumentation.ts`) and Python are in
`references/instrumentation.md`.

## 5. Errors

- Send unhandled and unexpected errors to an error tracker with release (git SHA), environment,
  user and tenant IDs, and the trace ID. Upload source maps for readable stacks.
- Expected outcomes are not errors: a 404 for a missing invoice or a 422 validation failure
  should not page anyone or flood the tracker. Report 5xx and unexpected exceptions.
- Group and own: every error group should have an owner or be ignored deliberately.

## 6. Health checks

- **Liveness** (`/healthz`): "the process is running and not deadlocked." Cheap, no dependency
  checks. A failing liveness check restarts the process, so never fail it because the database
  is down; that turns an outage into a restart storm.
- **Readiness** (`/readyz`): "I can serve traffic now." Checks critical dependencies quickly
  (database ping with a short timeout) and fails during startup and graceful shutdown, so the load
  balancer stops routing here.
- Report the version (git SHA) on a status endpoint or header, so you can tell what is running.

## 7. Debugging production with telemetry

1. Start from the symptom metric (error rate, latency, a business metric) and narrow the time
   window and dimensions (route, region, version, tenant).
2. Check what changed at that time: deploys, config changes, traffic shape, dependency status.
3. Pull example traces from the bad window (slow or errored), and find the span that dominates.
4. Read the logs for those trace IDs.
5. Form a hypothesis and confirm it with data before changing code. Then add the telemetry that
   would have made this faster to find.

## 8. Reviewing instrumentation

Check that: every request has a request/trace ID in logs and responses; errors are logged once
with stack and context; no secrets or excess personal data in logs; metrics use route templates
and bounded labels; latency is a histogram; outbound calls and queue hops propagate trace
context; liveness does not depend on downstream services; new business flows have a counter
for success and failure.

## Reference files

- `references/instrumentation.md` - pino request logging with AsyncLocalStorage, OpenTelemetry
  setup for Node and Next.js, manual spans, metrics with OpenTelemetry, Sentry wiring, health
  endpoints, Python structlog and OpenTelemetry equivalents.
