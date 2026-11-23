---
name: incident-response
description: Run and support production incidents from first alert to postmortem - triage and severity, incident roles, the first fifteen minutes, mitigation before root cause (rollback, flags, scaling, failover), investigating with logs, metrics and traces, stakeholder and status-page communication, handoffs, and blameless postmortems with useful action items; also writing runbooks and incident processes. Use this whenever something is broken or degraded in production ("the site is down", "errors spiked", "customers can't log in", "the queue is stuck"), when helping someone on call, when writing a status update, timeline or postmortem, or when setting up an incident process or runbooks. Use it immediately in an active incident, where the first priority is stopping user impact.
---

# Incident response

During an incident the job is, in order: **stop the bleeding, keep people informed, then find
out why.** Mitigation comes before diagnosis: roll back, switch off, scale up or fail over first,
then investigate with the pressure off. Root-causing a live outage while users wait is the most
common way incidents last hours instead of minutes.

## 1. When helping in a live incident

Be brief and concrete. Ask for, or look at, only what changes the next action:

1. **What is the user impact?** Who is affected, how badly, since when. Check the SLO dashboard
   and error rates, not just one alert.
2. **What changed?** Deploys, config or flag changes, infrastructure changes, traffic spikes,
   dependency status pages, certificate or DNS changes, around the start time. The answer is a
   recent change most of the time.
3. **What is the fastest safe mitigation?** Propose it with the exact command, its risk and its
   rollback.

Never run destructive or irreversible commands (deleting data, dropping tables, force-pushing,
restarting databases, failing over primaries) without the incident lead's explicit go-ahead; say
what the command does and what it cannot undo.

## 2. Severity

Declare early; downgrading is cheap, a late declaration is not.

| Level | Meaning                                                                     | Response                                         |
| ----- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| SEV1  | Core product unavailable or data loss/exposure for many users               | page now, incident lead + comms, status page, updates every 30 min |
| SEV2  | Major feature broken or severe degradation for a subset of users            | page owning team, status page if customer-visible, updates hourly |
| SEV3  | Minor feature broken, workaround exists, or internal-only impact            | owning team during working hours                  |
| SEV4  | Cosmetic or no user impact yet (risk spotted)                               | ticket                                            |

Security incidents (suspected breach, leaked credentials, unauthorized access) follow the same
flow with the security owner involved from the start, evidence preserved, and communication
restricted.

## 3. Roles

For anything above SEV3, separate the jobs, even if the same small team fills them:

- **Incident lead**: coordinates, decides, keeps the timeline of decisions; does not debug.
- **Operations / subject experts**: investigate and execute mitigations, announcing every action
  before taking it ("rolling back billing-api to 3f9c2a1 now").
- **Communications**: internal updates, status page, customer support briefings.
- **Scribe** (often the lead in small teams): timestamped log of observations, actions and
  decisions in the incident channel.

One incident channel (`#inc-2026-11-23-checkout-errors`) and one video bridge; all decisions are
written in the channel.

## 4. The first fifteen minutes

1. Acknowledge the page; open the incident channel; post what you know (symptom, start time,
   impact estimate) and the severity.
2. Look at the service dashboard and the change log for the start time.
3. Mitigate the obvious: roll back the latest deploy if the timing matches; disable the newest
   feature flag; scale out if saturated; shed or rate-limit abusive traffic; fail over if a
   zone or dependency is down.
4. Pull in help early: the owning team, the database or platform owner, a lead.
5. Post the first update, even if it says "investigating, next update in 30 minutes".

## 5. Mitigation toolbox

| Situation                              | Mitigation                                                                |
| -------------------------------------- | ------------------------------------------------------------------------- |
| Started with a deploy                  | roll back the artifact (and only then investigate)                        |
| Started with a flag or config change   | revert it                                                                  |
| Saturation (CPU, connections, queue)   | scale out, raise pool limits carefully, shed load, pause non-critical jobs |
| One bad instance / zone                | drain or cordon it; shift traffic                                         |
| Dependency outage                      | fail over, serve cached or degraded responses, disable the feature, queue writes for later |
| Database overload                      | kill the runaway query, disable the expensive feature, add the missing index concurrently, fail reads to replicas |
| Abuse / traffic spike                  | rate limit, block at the edge (WAF), require auth on the hot path         |
| Bad data written                       | stop the writer first; repair later from backups or audit logs            |

Every mitigation is announced, timestamped, and checked against the metrics afterwards.

## 6. Investigating

- Follow the data: narrow the failing requests by route, version, region, tenant and dependency.
  Pull a handful of failing traces and read their spans and logs (see the `observability` skill).
- Form one hypothesis at a time and look for evidence that would disprove it.
- Write findings in the channel as you go; they become the timeline.
- Keep evidence: logs, queries, screenshots of graphs, before they age out of retention.

## 7. Communication

- **Internal updates** on a fixed cadence (every 30 minutes for SEV1, hourly for SEV2), even with no
  news: current impact, what has been done, what is next, next update time.
- **Status page**: plain language about user impact and what to do, not internal details; no
  speculation about cause; say when the next update will come.
- **Support** gets the customer-facing wording and a workaround if there is one.
- **Resolution**: announce when metrics have been back to normal for a monitoring period, then
  close the status incident.

Templates are in `references/templates.md`.

## 8. Handoffs and ending

- Long incidents rotate people every few hours; a handoff states impact, actions taken, current
  hypotheses, next steps and open risks, in the channel.
- An incident ends when user impact has ended and is not expected to return. Follow-up work
  becomes tickets; the postmortem is scheduled within a few working days.

## 9. Postmortems

Blameless and specific. The question is "how did our systems and processes allow this, and make
it hard to detect and fix", not "who made the mistake".

- **Timeline** with timestamps: trigger, detection, each key action and decision, mitigation,
  resolution. Note time to detect, time to mitigate, time to resolve.
- **Impact** quantified: users, requests, revenue, SLO budget consumed, data affected.
- **Contributing factors**, usually several (a change, a missing check, a gap in alerting, a
  confusing runbook), not a single root cause.
- **What went well** and **where we got lucky**.
- **Action items** that change the system: each with an owner, a priority and a due date, linked
  to tickets. Prefer automation and guardrails ("migration checker blocks non-concurrent index
  builds in CI") over intentions ("be more careful").

Write it within a week, review it with the people involved, share it widely, and track the
action items to completion.

## 10. Before the next incident

Runbooks for every paging alert, a tested rollback for every service, an incident channel and
status-page process people have practiced, contact details for critical vendors, and regular game
days or failure drills on the scenarios that would hurt most (database failover, region loss,
expired certificate, leaked secret).

## Reference files

- `references/templates.md` - incident channel kickoff, internal update, status page messages
  (investigating, identified, monitoring, resolved), handoff note, postmortem template, and a
  runbook skeleton.
