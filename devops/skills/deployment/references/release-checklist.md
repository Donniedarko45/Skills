# Release checklist for risky changes

Use for: database migrations on large tables, infrastructure changes, auth or payment changes,
major dependency or runtime upgrades, launches, and anything touching many services.

## Before

- [ ] **What changes**: a one-paragraph description, the PRs, and the blast radius (which users,
      tenants, services).
- [ ] **Compatibility**: the old version keeps working with the new schema, config and message
      formats; the new version works if rolled back after partial use.
- [ ] **Migrations**: reviewed for locks and duration on production-sized data
      (`check-migration.py` from the `database` skill); backfills run as separate batched jobs.
- [ ] **Feature flag** for user-visible behaviour, defaulting off, with a kill switch.
- [ ] **Rollback plan** written down: the exact command or flag, how long it takes, and what it
      cannot undo (data written in a new format, emails sent, external calls made).
- [ ] **Tested** in staging with production-like data and traffic; load tested if capacity changes.
- [ ] **Monitoring**: the dashboards and alerts that will show failure; any new metrics are
      deployed before the change.
- [ ] **Timing**: not before a weekend or holiday, not during peak traffic; the people who can fix
      it are available for the next few hours.
- [ ] **Communication**: support and stakeholders know what and when; status page prepared if
      downtime is possible.

## During

- [ ] Announce start in the team channel with a link to this checklist.
- [ ] Deploy to a canary or a small percentage first where possible.
- [ ] Watch error rate, latency, saturation and the key business metric against the baseline.
- [ ] Run smoke tests.
- [ ] Ramp in steps (1% → 10% → 50% → 100%), holding each step long enough to see real traffic.
- [ ] Stop and roll back at the first unexplained regression. Investigate after.

## After

- [ ] Announce completion with the final state.
- [ ] Keep watching for a defined period (30 minutes to a day, by risk).
- [ ] Remove temporary flags, dual writes and old code paths in a follow-up release; schedule the
      contract step of any expand/contract migration.
- [ ] Record surprises in the team's runbook or the next release's checklist.

## Rollback runbook template

```markdown
# Rollback: <change name>

**Trigger**: roll back if <metric> exceeds <threshold> for <duration>, or on <symptom>.

**Steps**
1. Disable flag `<flag-name>` in <tool> (takes effect in ~<n> seconds).
2. If still failing: redeploy previous release `<sha>`:
   `<exact command or link to the pipeline's rollback job>`
3. Verify: <dashboard link>, <smoke test command>.

**Cannot be undone automatically**
- <data written in new format> → <forward fix / script location>
- <notifications sent> → <customer communication owner>

**Owner**: <name>, backup <name>. Escalation: <channel / pager>.
```
