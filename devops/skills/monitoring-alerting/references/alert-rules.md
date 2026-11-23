# Alert rules and templates

Metric names follow OpenTelemetry HTTP semantic conventions exported to Prometheus
(`http_server_request_duration_seconds_*`). Adjust to the names your instrumentation produces.

## Contents

1. Recording rules for SLIs
2. Burn-rate alerts (availability)
3. Latency SLO alerts
4. Cause-based alerts worth paging on
5. Alertmanager routing
6. Runbook template
7. Other platforms
8. Production readiness checklist

## 1. Recording rules for SLIs

```yaml
groups:
  - name: slo-billing-api-recording
    rules:
      # error ratio = 5xx / all requests, excluding health checks
      - record: slo:billing_api:error_ratio:rate5m
        expr: |
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz", http_response_status_code=~"5.."}[5m]))
          /
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz"}[5m]))
      - record: slo:billing_api:error_ratio:rate30m
        expr: |
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz", http_response_status_code=~"5.."}[30m]))
          /
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz"}[30m]))
      - record: slo:billing_api:error_ratio:rate1h
        expr: |
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz", http_response_status_code=~"5.."}[1h]))
          /
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz"}[1h]))
      - record: slo:billing_api:error_ratio:rate6h
        expr: |
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz", http_response_status_code=~"5.."}[6h]))
          /
          sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz"}[6h]))
```

Generating these by hand is error-prone; tools such as Sloth or Pyrra generate recording and
alert rules from a short SLO definition.

## 2. Burn-rate alerts (availability)

SLO 99.9% → error budget 0.001.

```yaml
groups:
  - name: slo-billing-api-alerts
    rules:
      - alert: BillingApiAvailabilityBudgetBurnFast
        expr: |
          slo:billing_api:error_ratio:rate1h > (14.4 * 0.001)
          and
          slo:billing_api:error_ratio:rate5m > (14.4 * 0.001)
        labels:
          severity: page
          team: billing
        annotations:
          summary: 'billing-api availability SLO burning >14x budget (errors {{ $value | humanizePercentage }})'
          runbook_url: https://runbooks.example.com/billing-api/availability
          dashboard_url: https://grafana.example.com/d/billing-api

      - alert: BillingApiAvailabilityBudgetBurnSlow
        expr: |
          slo:billing_api:error_ratio:rate6h > (6 * 0.001)
          and
          slo:billing_api:error_ratio:rate30m > (6 * 0.001)
        labels:
          severity: page
          team: billing
        annotations:
          summary: 'billing-api availability SLO burning >6x budget over 6h'
          runbook_url: https://runbooks.example.com/billing-api/availability
```

Low-traffic services: at a few requests per minute, one error is a large ratio. Require a minimum
request rate in the expression (`and sum(rate(...[1h])) > 0.1`) or use synthetic traffic.

## 3. Latency SLO alerts

SLO: 95% of requests under 300 ms. Good events are the histogram bucket at the threshold.

```yaml
      - record: slo:billing_api:latency_bad_ratio:rate1h
        expr: |
          1 - (
            sum(rate(http_server_request_duration_seconds_bucket{service="billing-api", le="0.3", http_route!~"/healthz|/readyz"}[1h]))
            /
            sum(rate(http_server_request_duration_seconds_count{service="billing-api", http_route!~"/healthz|/readyz"}[1h]))
          )
      - alert: BillingApiLatencyBudgetBurnFast
        expr: slo:billing_api:latency_bad_ratio:rate1h > (14.4 * 0.05)
        for: 5m
        labels: { severity: page, team: billing }
        annotations:
          summary: 'billing-api: too many requests slower than 300 ms'
          runbook_url: https://runbooks.example.com/billing-api/latency
```

The bucket boundary must exist in the histogram (`le="0.3"`); configure histogram buckets around
your SLO thresholds.

## 4. Cause-based alerts worth paging on

```yaml
      - alert: PostgresStorageFullSoon
        expr: predict_linear(pg_database_size_bytes[6h], 24 * 3600) > on(instance) pg_storage_limit_bytes
        labels: { severity: page, team: platform }
        annotations: { summary: 'Database storage predicted full within 24h on {{ $labels.instance }}' }

      - alert: TLSCertificateExpiringSoon
        expr: probe_ssl_earliest_cert_expiry - time() < 14 * 24 * 3600
        labels: { severity: ticket, team: platform }
        annotations: { summary: 'Certificate for {{ $labels.instance }} expires in under 14 days' }

      - alert: JobQueueOldestMessageTooOld
        expr: max by (queue) (job_queue_oldest_message_age_seconds) > 900
        for: 10m
        labels: { severity: page, team: billing }
        annotations: { summary: 'Queue {{ $labels.queue }}: oldest job waiting over 15 minutes' }

      - alert: DeadLetterQueueGrowing
        expr: increase(job_dead_letter_total[1h]) > 10
        labels: { severity: ticket, team: billing }

      - alert: BackupMissing
        expr: time() - backup_last_success_timestamp_seconds > 26 * 3600
        labels: { severity: page, team: platform }
```

## 5. Alertmanager routing

```yaml
route:
  receiver: default-chat
  group_by: [alertname, service]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - matchers: [severity="page"]
      receiver: pager
      continue: true
    - matchers: [severity="page"]
      receiver: team-chat
    - matchers: [severity="ticket"]
      receiver: ticket-queue
      repeat_interval: 24h

inhibit_rules:
  - source_matchers: [alertname="ServiceDown"]
    target_matchers: [severity=~"page|ticket"]
    equal: [service]          # do not page for symptoms of an outage already paging

receivers:
  - name: pager
    pagerduty_configs: [{ routing_key_file: /etc/alertmanager/secrets/pd-key }]
  - name: team-chat
    slack_configs: [{ api_url_file: /etc/alertmanager/secrets/slack-url, channel: '#billing-alerts' }]
  - name: ticket-queue
    webhook_configs: [{ url: https://tickets.example.com/hooks/alerts }]
  - name: default-chat
    slack_configs: [{ api_url_file: /etc/alertmanager/secrets/slack-url, channel: '#alerts' }]
```

## 6. Runbook template

```markdown
# <Alert name>

**What it means**: <one sentence on the user impact>.
**Severity**: page | ticket. **Owner**: <team>, escalation <channel/rotation>.

## Confirm
- Dashboard: <link>. Is the error rate / latency actually elevated? Since when?
- Did a deploy, config change or flag change happen at the same time? <deploy log link>
- Is a dependency degraded? <status pages, dependency dashboard>

## Mitigate (in this order)
1. Recent deploy → roll back: `<command or pipeline link>`.
2. Recent flag change → revert the flag in <tool>.
3. Overload → scale out: `<command>`; enable <rate limit / degraded mode>.
4. Dependency down → <fallback / circuit breaker / status communication>.

## Investigate
- Logs: <saved query link filtered by service and 5xx>.
- Traces: <link to slow/error traces>.
- Known causes from past incidents: <links>.

## Escalate
If not mitigated in 30 minutes, or customer data is at risk: <who, how>. Start an incident
(see the incident-response process).
```

## 7. Other platforms

- **Datadog**: SLO objects (metric-based or monitor-based) with built-in burn-rate alerts;
  monitors with `notify` routing via `@pagerduty-<service>`; dashboards and monitors managed with
  Terraform.
- **CloudWatch**: metric math for error ratio, composite alarms for the long-and-short window
  pattern, Application Signals SLOs; alarms to SNS to the paging tool.
- **Grafana Cloud / Mimir**: Prometheus rules as above; Grafana SLO plugin generates them.
- **New Relic / Honeycomb**: service-level objects with burn alerts built in.

## 8. Production readiness checklist

- [ ] SLOs defined for the critical user journeys, with owners.
- [ ] Burn-rate alerts for each SLO, routed to the owning team.
- [ ] External synthetic check on the public endpoint and one critical flow.
- [ ] Cause-based pages only for imminent exhaustion (storage, certificates, queues, backups).
- [ ] Every paging alert has a runbook and a dashboard link.
- [ ] Service dashboard with golden signals, dependencies and deploy annotations.
- [ ] Logs, metrics and traces correlated by request/trace ID.
- [ ] On-call rotation and escalation path exist; the team has seen the runbooks.
- [ ] A tested rollback and a documented way to disable risky features.
