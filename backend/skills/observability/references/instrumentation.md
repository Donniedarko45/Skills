# Instrumentation recipes

Package names and APIs change; check the installed versions' documentation before copying
configuration verbatim.

## Contents

1. Request context with AsyncLocalStorage
2. Request logging middleware
3. OpenTelemetry for Node
4. Next.js
5. Manual spans and attributes
6. Metrics
7. Error tracking
8. Health endpoints
9. Python

## 1. Request context with AsyncLocalStorage

```ts
// lib/context.ts
import { AsyncLocalStorage } from 'node:async_hooks'
import { logger } from './logger'

type Ctx = { requestId: string; userId?: string; tenantId?: string }
export const als = new AsyncLocalStorage<Ctx>()

export const log = () => {
  const ctx = als.getStore()
  return ctx ? logger.child(ctx) : logger
}

export function withContext<T>(ctx: Ctx, fn: () => T) {
  return als.run(ctx, fn)
}
```

Anywhere in the request: `log().info({ invoiceId }, 'invoice voided')` gets the request fields
automatically.

## 2. Request logging middleware

```ts
// Hono example; Express/Fastify are analogous (Fastify has pino built in)
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID()
  const start = performance.now()
  c.header('X-Request-Id', requestId)
  await withContext({ requestId }, async () => {
    try {
      await next()
    } finally {
      log().info({
        method: c.req.method,
        route: c.req.routePath,          // template, not the raw path
        status: c.res.status,
        durationMs: Math.round(performance.now() - start),
      }, 'request completed')
    }
  })
})
```

## 3. OpenTelemetry for Node

```ts
// instrumentation.ts - load before the app: node --import ./instrumentation.js server.js
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'billing-api',
    [ATTR_SERVICE_VERSION]: process.env.GIT_SHA ?? 'dev',
    'deployment.environment.name': process.env.APP_ENV ?? 'development',
  }),
  traceExporter: new OTLPTraceExporter(),          // OTEL_EXPORTER_OTLP_ENDPOINT configures the target
  metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() }),
  instrumentations: [getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } })],
})

sdk.start()
process.on('SIGTERM', () => { void sdk.shutdown() })
```

Point the exporter at an OpenTelemetry Collector (sidecar or agent) rather than straight at a
vendor, so sampling, redaction and routing live in one configurable place.

Log correlation: `@opentelemetry/instrumentation-pino` adds `trace_id` and `span_id` to pino logs.

## 4. Next.js

```ts
// instrumentation.ts at the project root (or src/)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')        // the NodeSDK setup above
  }
}
```

Next.js emits its own spans for routes and rendering when OpenTelemetry is registered; `@vercel/otel`
is a smaller wrapper that also works outside Vercel. Read
`node_modules/next/dist/docs/01-app/02-guides/open-telemetry.md` for the installed version.

## 5. Manual spans and attributes

```ts
import { trace, SpanStatusCode } from '@opentelemetry/api'
const tracer = trace.getTracer('billing')

export async function renderInvoicePdf(invoice: Invoice) {
  return tracer.startActiveSpan('invoice.render_pdf', async (span) => {
    span.setAttributes({ 'invoice.id': invoice.id, 'invoice.line_count': invoice.lines.length })
    try {
      const pdf = await render(invoice)
      span.setAttribute('pdf.bytes', pdf.byteLength)
      return pdf
    } catch (err) {
      span.recordException(err as Error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw err
    } finally {
      span.end()
    }
  })
}
```

Queue producers inject context into message headers (`propagation.inject(context.active(), headers)`);
consumers extract it (`propagation.extract`) and start a span linked to or parented by it.

## 6. Metrics

```ts
import { metrics } from '@opentelemetry/api'
const meter = metrics.getMeter('billing')

export const invoicesSent = meter.createCounter('app.invoices.sent', { description: 'Invoices sent to customers' })
export const paymentOutcome = meter.createCounter('app.payments', { description: 'Payment attempts by outcome' })
export const pdfDuration = meter.createHistogram('app.invoice.pdf.duration', { unit: 's' })

invoicesSent.add(1, { channel: 'email' })
paymentOutcome.add(1, { outcome: 'declined', provider: 'stripe' })   // bounded label values only
```

Prometheus without OpenTelemetry: `prom-client` with `collectDefaultMetrics()`, a `Histogram`
for request duration labelled by `route`, `method`, `status_code`, and a `/metrics` endpoint that
is not publicly exposed.

## 7. Error tracking

Wire the tracker to capture unhandled errors, tag release and environment, and attach the trace
ID; filter expected client errors:

```ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.GIT_SHA,
  environment: process.env.APP_ENV,
  tracesSampleRate: 0,            // let OpenTelemetry own tracing if both are present
  beforeSend(event, hint) {
    const status = (hint.originalException as { status?: number } | undefined)?.status
    return status && status < 500 ? null : event
  },
})
```

## 8. Health endpoints

```ts
let shuttingDown = false
process.on('SIGTERM', () => { shuttingDown = true })

app.get('/healthz', (c) => c.text('ok'))            // liveness: process alive

app.get('/readyz', async (c) => {                    // readiness: can serve traffic
  if (shuttingDown) return c.text('shutting down', 503)
  try {
    await withTimeout(db.$queryRaw`select 1`, 500)
    return c.json({ status: 'ready', version: process.env.GIT_SHA })
  } catch {
    return c.text('database unavailable', 503)
  }
})
```

## 9. Python

```python
import structlog, logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,      # request-bound fields
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.dict_tracebacks,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)
log = structlog.get_logger()

# in middleware
structlog.contextvars.bind_contextvars(request_id=request_id, tenant_id=tenant_id)
log.info("invoice voided", invoice_id=invoice.id)
```

OpenTelemetry: `opentelemetry-distro` plus `opentelemetry-instrument python app.py` for
zero-code auto-instrumentation, or `opentelemetry-instrumentation-fastapi`,
`-sqlalchemy`, `-httpx` for explicit setup.
