---
name: deployment
description: Ship releases safely and roll them back quickly - deployment strategies (rolling, blue-green, canary, feature flags), zero-downtime requirements (backward-compatible migrations, graceful shutdown, readiness), environment configuration and secrets, Kubernetes manifests (Deployments, probes, resources, autoscaling, disruption budgets, security context), managed platforms (Vercel, Cloud Run, ECS, Fly, Render), preview environments, smoke tests and release checklists. Use this whenever setting up or changing how an app is deployed, writing Kubernetes or platform config, planning a risky release or migration, adding feature flags, designing rollback, or when deploys cause errors, downtime or "it worked in staging" surprises. Use it even for a routine deploy change, because most incidents start with a deploy.
---

# Deployment

The goal is boring deploys: small, frequent, automatic, observable and reversible. Every deploy
should be safe to roll back within minutes, and every change should be split so that the code
running before and after it can coexist, because during a rollout both versions serve traffic at
the same time.

## 1. Read what exists first

- Where and how the app runs today (Kubernetes, ECS, Cloud Run, Vercel, Fly, a VM), how deploys
  are triggered, how configuration and secrets reach the app, how rollback works, and what
  health checks and alerts exist.
- Change the existing mechanism incrementally. Moving platforms is a project, not a side effect
  of another task.

## 2. Principles

- **Build once, promote the same artifact** (image digest or bundle) from staging to production.
  Environments differ only in configuration.
- **Small batches**: deploy each merged change, or at least daily. Big releases hide which change
  broke things.
- **Separate deploy from release**: ship code dark behind a feature flag, then turn it on for a
  percentage of users. Rolling back a feature becomes a flag flip, not a deploy.
- **Automate the whole path**, including migrations and smoke tests; manual steps are where
  deploys go wrong at 6 pm on Friday.
- **Know the rollback before you deploy**: redeploy the previous artifact, flip the flag, or for
  data changes, the documented forward fix.

## 3. Zero-downtime requirements

All of these must hold, or rolling deploys drop requests:

1. **Compatibility across versions**: version N and N+1 run side by side during a rollout, and N
   may come back on rollback. APIs, message formats, caches and the database schema must work
   for both. Database changes follow expand and contract: additive migration first, code that
   uses it next, cleanup in a later release (see the `database` skill).
2. **Readiness**: an instance receives traffic only once it can serve it (readiness probe passes
   after warm-up and connections are established).
3. **Graceful shutdown**: on `SIGTERM`, fail readiness, stop accepting new connections, finish
   in-flight requests and jobs, close pools, exit before the grace period ends. In Kubernetes,
   add a short `preStop` sleep (5-10s) so the load balancer stops routing before the process
   stops listening.
4. **Capacity during rollout**: `maxUnavailable: 0` and enough `maxSurge` (or spare capacity)
   that removing old instances never drops below the needed capacity.
5. **Sessions and state outside the instance**: no in-memory sessions or local files that a
   replacement instance would lose.

## 4. Strategies

| Strategy        | How                                                    | Good for                                     | Cost                              |
| --------------- | ------------------------------------------------------ | -------------------------------------------- | --------------------------------- |
| Rolling         | replace instances in batches                           | most stateless services                      | both versions live briefly         |
| Blue-green      | stand up the full new version, switch traffic at once  | fast, total rollback; schema-sensitive apps  | double capacity during the switch |
| Canary          | send 1-10% of traffic to the new version, watch metrics, then ramp | high-traffic or high-risk changes | needs traffic splitting and good metrics |
| Feature flags   | deploy code off, enable per user/tenant/percentage     | risky features, gradual launches, kill switches | flag debt; must clean up        |

Canary analysis compares the canary against the baseline on error rate, latency (p95/p99) and
key business metrics, and rolls back automatically on regression (Argo Rollouts, Flagger, cloud
deployment services, or a scripted check).

## 5. Configuration and secrets

- Configuration via environment variables or mounted files, validated at startup (fail fast on
  missing values; see the `auth-security` skill).
- Secrets from a secret manager (Secrets Manager, Secret Manager, Key Vault, Vault) injected at
  runtime, via the platform integration or External Secrets Operator in Kubernetes. Never in the
  image, the repository or plain Kubernetes manifests.
- Per-environment differences are values, not code branches: avoid `if (env === 'production')`
  beyond configuration loading.
- Changing configuration is a deploy: reviewed, versioned and reversible.

## 6. Kubernetes essentials

Every Deployment should have:

- **Requests and limits**: CPU and memory requests sized from observed usage; a memory limit
  (OOM kills are better than node pressure); CPU limits optional (they cause throttling).
- **Probes**: `readinessProbe` on `/readyz`; `livenessProbe` on `/healthz` (cheap, no dependency
  checks, generous thresholds); `startupProbe` for slow starts instead of long initial delays.
- **Rolling update** settings with `maxUnavailable: 0`, plus `terminationGracePeriodSeconds`
  above the longest request or job, and a `preStop` sleep.
- **At least 2 replicas** spread across zones (`topologySpreadConstraints`), a
  `PodDisruptionBudget` so node maintenance cannot take all of them down, and a
  `HorizontalPodAutoscaler` where load varies.
- **Security context**: `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`,
  `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault`.
- **Immutable image references** (tag by commit SHA, or digest), never `latest`.
- Migrations as a `Job` (or a pre-deploy step in CI) that completes before the new pods roll
  out, not as an init container in every replica.

Manage manifests with Kustomize overlays or Helm, applied by GitOps (Argo CD, Flux) or CI.
Complete manifests are in `references/kubernetes.md`.

## 7. Managed platforms

- **Vercel / Netlify**: preview deployments per PR, instant rollback to a previous deployment,
  environment variables per environment; migrations still need their own step.
- **Cloud Run / App Runner / Fly / Render**: revisions with traffic splitting (canary by
  percentage), min instances to avoid cold starts on critical paths, concurrency settings, health
  checks, secrets from the cloud secret manager.
- **ECS**: rolling or blue-green via CodeDeploy, deployment circuit breaker with automatic
  rollback, health check grace period, task role per service.

Whatever the platform: pin what runs to an immutable artifact, wire health checks, and know the
one-command rollback.

## 8. Preview environments

One per pull request where feasible: the app deployed with an isolated database (branching
databases such as Neon, or seeded ephemeral Postgres), seeded test data, and teardown on merge.
They catch integration problems early and let reviewers click through changes.

## 9. Verify every deploy

1. **Smoke tests** right after deploy against the real environment: health endpoint, one
   authenticated read, one critical flow.
2. **Watch the dashboards** for 10-30 minutes after production deploys (or let automated canary
   analysis do it): error rate, latency, saturation, key business metrics, compared with before.
3. **Annotate deploys** on dashboards (version and time), so regressions line up with causes.
4. **Roll back first, investigate second** when a deploy correlates with a regression.

## 10. Release checklist for risky changes

Use `references/release-checklist.md` for migrations, infrastructure changes, dependency
upgrades, auth changes and launches: compatibility, migration plan, flag strategy, rollback,
monitoring, communication and timing.

## Reference files

- `references/kubernetes.md` - Deployment, Service, HPA, PDB, migration Job and Kustomize
  overlays with the settings above, plus `kubectl` commands for rollouts and rollback.
- `references/release-checklist.md` - pre-deploy, deploy and post-deploy checklist for risky
  releases, plus a rollback runbook template.
