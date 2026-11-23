# Incident templates

## Contents

1. Incident channel kickoff
2. Internal update
3. Status page messages
4. Handoff note
5. Postmortem
6. Runbook skeleton

## 1. Incident channel kickoff

```
:rotating_light: INCIDENT DECLARED - SEV2 - Checkout errors
Impact: ~30% of checkout attempts failing with 500 since 14:05 UTC (EU and US).
Lead: @dana   Ops: @rafael   Comms: @mei   Scribe: @dana
Bridge: <link>   Dashboard: <link>   Status page: draft prepared
Current action: rolling back billing-api to 3f9c2a1 (deployed 14:01).
Next update: 14:45 UTC
```

## 2. Internal update

```
UPDATE 14:45 UTC - SEV2 - Checkout errors
Impact: error rate down from 30% to 2% after rollback at 14:22; some EU card payments still failing.
Done: rolled back billing-api (14:22); confirmed new release changed the payment client timeout.
Now: investigating remaining failures in the EU payment provider integration (@rafael).
Next: decide on disabling the new 3-D Secure flow via flag `checkout-3ds-v2` if not resolved by 15:00.
Next update: 15:15 UTC
```

## 3. Status page messages

Plain language, user impact first, no internal names or blame, always a next-update time.

**Investigating**
> We're seeing errors for some customers when completing checkout. Payments are not being taken
> for failed attempts. We're investigating and will update by 14:45 UTC.

**Identified**
> We've identified the cause of checkout errors and rolled out a fix to most customers. Some card
> payments in Europe may still fail; we're working on it. Next update by 15:15 UTC.

**Monitoring**
> A fix is in place and checkout is working normally. We're monitoring to make sure it stays that
> way. Next update by 16:00 UTC.

**Resolved**
> Between 14:05 and 15:02 UTC some customers were unable to complete checkout. The issue is
> resolved. Failed attempts were not charged. We're sorry for the disruption; a summary of what
> happened will follow.

## 4. Handoff note

```
HANDOFF 18:00 UTC  @rafael → @sam
Impact now: none visible since 15:02; monitoring.
What happened: release 9b1e4d2 lowered the payment client timeout to 2s; EU provider p99 is ~2.5s.
Done: rolled back (14:22); disabled flag checkout-3ds-v2 (14:58).
Open risks: flag must stay off until the timeout fix ships; retry queue has 340 jobs draining (normal).
Next steps: confirm queue drained by 19:00; close incident if no errors by 20:00.
Links: channel, dashboard, timeline doc.
```

## 5. Postmortem

```markdown
# Postmortem: Checkout errors, 2026-11-23

**Severity**: SEV2   **Duration**: 57 min (14:05-15:02 UTC)   **Author**: <name>   **Status**: draft | reviewed

## Summary
Two or three sentences: what users experienced, the trigger, how it was resolved.

## Impact
- 4,210 checkout attempts failed (31% of attempts during the window); no customers were charged
  for failed attempts.
- Estimated delayed revenue: $X; SLO "checkout availability 99.9% / 28d": 38% of budget consumed.
- Support tickets: 57.

## Timeline (UTC)
| Time  | Event |
| ----- | ----- |
| 14:01 | Release 9b1e4d2 deployed (payment client timeout 10s → 2s) |
| 14:05 | Error rate rises; first customer reports in support |
| 14:09 | Burn-rate alert pages on-call (detection: 4 min) |
| 14:14 | Incident declared SEV2 |
| 14:22 | Rollback completed; errors drop to 2% (mitigation: 17 min) |
| 14:58 | Flag checkout-3ds-v2 disabled; errors return to baseline |
| 15:02 | Declared resolved after monitoring |

## Contributing factors
- The timeout change was bundled with an unrelated refactor; the PR did not call it out.
- Staging uses a mock payment provider with no latency, so the change passed all tests.
- The new 3-D Secure flow adds a second provider call, doubling exposure to the timeout.

## What went well
- Burn-rate alert detected the problem within 4 minutes.
- Rollback was one click and took 6 minutes.

## Where we got lucky
- The failure happened during EU afternoon, not during the US evening peak.

## Action items
| Action | Type | Owner | Priority | Due | Ticket |
| ------ | ---- | ----- | -------- | --- | ------ |
| Add realistic latency to the staging payment mock | prevent | @rafael | P1 | 2026-12-05 | PAY-412 |
| Alert on payment provider p99 approaching client timeout | detect | @mei | P2 | 2026-12-12 | PAY-413 |
| Require config/timeout changes to be listed in the PR template | process | @dana | P3 | 2026-12-01 | ENG-88 |

## Lessons
What we learned about our systems, beyond this incident.
```

## 6. Runbook skeleton

```markdown
# Runbook: <service or alert>

## Overview
What the service does, who depends on it, owner, dashboards, logs, traces.

## Health
- How to tell it is healthy: <SLO dashboard>, <key metrics and normal ranges>.

## Common alerts
### <Alert name>
- Meaning and user impact.
- Confirm: <queries, dashboards>.
- Mitigate: <ordered steps with exact commands>.
- Escalate: <who and when>.

## Operations
- Deploy and roll back: <commands / pipeline links>.
- Scale: <commands, limits>.
- Feature flags and kill switches: <names, what they disable>.
- Dependencies and their status pages: <list>.
- Data repair procedures: <scripts, approvals required>.

## Contacts
- Owning team rotation, secondary, vendor support contacts and contract IDs.
```
