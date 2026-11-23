---
name: monitoring-alerting
description: Decide what to monitor and when to wake someone up - SLIs, SLOs and error budgets, burn-rate alerts, symptom-based alerting, alert routing and severity, runbooks, dashboards (golden signals, service and business views), synthetic checks, on-call noise reduction - with Prometheus/Alertmanager, Grafana, Datadog, CloudWatch, New Relic or similar. Use this whenever defining SLOs, writing or reviewing alert rules, building dashboards, setting up uptime checks, fixing noisy or missing alerts, or preparing a service for production or on-call. Use it even when the user only asks for "an alert on X", because alerts on causes instead of symptoms are the main source of pager fatigue and missed outages.
---

# Monitoring and alerting

Monitoring answers "is the service doing its job for users, and if not, where?" Alerting turns a
small set of those answers into pages that a human must act on now. The two failure modes are
symmetrical: too many alerts and people ignore them, too few and users report outages first.
Fix both by alerting on user-facing symptoms against explicit objectives, and putting everything
else on dashboards.

## 1. Read what exists first

The monitoring stack, existing dashboards and alert rules, the paging tool (PagerDuty, Opsgenie,
incident.io, Grafana OnCall), who is on call, and recent incidents: what paged, what did not,
and what was noise. Telemetry inside the code is the `observability` skill; this skill is about
using it.

## 2. SLIs and SLOs

- **SLI**: a ratio of good events to valid events, measured as close to the user as possible.
  - Availability: share of requests that succeed (non-5xx, excluding health checks).
  - Latency: share of requests faster than a threshold (`< 300 ms`), not an average.
  - Freshness / correctness for pipelines: share of records processed within N minutes.
- **SLO**: the target for an SLI over a window, for example "99.9% of checkout requests succeed
  over 28 days" and "95% of API requests complete within 300 ms over 28 days".
- **Error budget**: `1 - SLO`. 99.9% over 28 days allows about 40 minutes of total failure, or
  0.1% of requests. When the budget is spent, reliability work takes priority over features.
- Start with 2-4 SLOs per service on the journeys users care about (sign in, load dashboard, pay),
  set them from current performance and user expectations, and tighten later. 100% is never the
  target.

## 3. Alert on symptoms, with burn rates

Page on **symptoms users feel** (SLO burn), not on **causes** (CPU at 80%, one pod restarted,
queue length 500). Causes go on dashboards and, at most, into low-urgency tickets.

Use **multi-window, multi-burn-rate** alerts on each SLO: page when the budget is burning fast
enough to matter, and require both a long and a short window so the alert fires quickly and
resolves quickly.

| Severity | Burn rate | Long window | Short window | Budget consumed if it continues |
| -------- | --------- | ----------- | ------------ | ------------------------------- |
| Page     | 14.4x     | 1 h         | 5 min        | 2% of a 30-day budget in 1 hour  |
| Page     | 6x        | 6 h         | 30 min       | 5% in 6 hours                    |
| Ticket   | 3x        | 1 day       | 2 h          | 10% in a day                     |
| Ticket   | 1x        | 3 days      | 6 h          | on track to exhaust the budget   |

PromQL examples are in `references/alert-rules.md`.

Add a few cause-based pages only where the symptom would arrive too late to act: disk or
database storage that will be full within hours, certificates expiring within days, a
dead-letter queue growing, backups failing, the oldest queued job older than its deadline.

## 4. Every alert is actionable

An alert that pages must have:

- a **clear summary** naming the service and symptom ("Checkout availability SLO burning 14x
  budget");
- **severity** that matches urgency: page only for "user impact now or imminent", otherwise a
  ticket or chat notification during working hours;
- a **runbook link**: what it means, how to confirm, first mitigation steps, who to escalate to
  (template in the reference);
- a **dashboard link** scoped to the service and time;
- an **owner** (team routing label), and grouping so one incident sends one page, not fifty.

Review alerts monthly: delete or demote any that fired without requiring action. Track pages per
on-call shift; more than a couple of pages a day means the alerting is broken, not the people.

## 5. Dashboards

Build for the question being asked, top to bottom:

1. **Service overview** (one per service): SLO status and remaining error budget; the golden
   signals (traffic, errors, latency p50/p95/p99, saturation) for the last hours with the
   previous week as a faint comparison; deploy annotations.
2. **Dependencies**: database (connections, query latency, replication lag), caches, queues
   (depth, oldest message age), external APIs (error rate, latency).
3. **Business view**: signups, orders, payments succeeded vs failed, the counters that show the
   product working.

Rules: consistent units and time ranges; latency as percentiles, never averages alone; rates per
second, not raw counters; variables for environment and instance; no panel without a purpose;
dashboards as code (Grafana JSON or Terraform) so they are reviewed and survive.

## 6. Synthetic checks

External uptime checks from several regions on the public endpoints and one or two critical
user flows (login, a key page with real data), on a short interval. They catch DNS, certificate,
CDN and full-outage failures that internal metrics cannot see because no traffic arrives. Alert
when a majority of regions fail, not one.

## 7. Logs-based and anomaly alerts

Use log-based alerts sparingly, for rare, specific, high-value events (a security event, a
payment reconciliation mismatch). Anomaly detection is a dashboard aid; it pages poorly without
tuning.

## 8. Preparing a service for on-call

Before a service goes on the pager: SLOs defined and alerting; runbooks for each page; dashboards
linked from alerts; logs and traces searchable by request ID; ownership in the service catalog;
a tested rollback; escalation path documented. `references/alert-rules.md` has a readiness
checklist.

## Reviewing alerting

For each alert ask: does it reflect user impact or imminent impact? Would the on-call engineer
know what to do? Has it fired without action in the last month? Does it duplicate another alert?
Then check for gaps: is every critical journey covered by an SLO alert, and is there an external
check?

## Reference files

- `references/alert-rules.md` - Prometheus recording and burn-rate alert rules for availability
  and latency SLOs, cause-based rules worth paging on, Alertmanager routing and grouping, a
  runbook template, Datadog/CloudWatch equivalents and the production-readiness checklist.
