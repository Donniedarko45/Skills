---
name: ci-cd
description: Design, write, speed up, secure and debug CI/CD pipelines, primarily GitHub Actions (with notes for GitLab CI and others) - build, lint, typecheck and test workflows, caching, parallel jobs and sharding, path filters and concurrency, artifacts, environments and approvals, deploying with OIDC instead of stored cloud keys, release and versioning automation, monorepos, and supply-chain security (pinned actions, least-privilege permissions, script injection, pull_request_target). Use this whenever creating or editing anything in .github/workflows, a CI config, a release or deploy pipeline, when CI is slow, flaky or failing, or when reviewing pipeline security. Use it even for a one-line workflow change, because workflows run with access to secrets and production.
---

# CI/CD

A pipeline has two jobs: tell a developer quickly and reliably whether a change is good, and
get good changes to production repeatably. It also holds the keys to production, so it is one
of the most attractive targets in the system. Fast, deterministic, least-privilege.

## 1. Read what exists first

- The existing workflows, how they are triggered, which checks are required on the default
  branch, how deploys happen, and which secrets and environments exist.
- The package manager and lockfile, the runtime version source (`.nvmrc`, `engines`,
  `.tool-versions`), and the test, lint and build scripts in `package.json` or the Makefile.
- CI should run the same commands developers run locally. If they differ, add a script both use.

Run the bundled audit on the existing workflows before and after changing them:

```bash
python3 <this-skill-dir>/scripts/audit-workflows.py .github/workflows
```

It flags unpinned third-party actions, missing or broad `permissions`, script injection from
untrusted event fields, risky `pull_request_target` usage, secrets in `run` lines, missing
timeouts and concurrency, and more, each with the fix. It needs PyYAML (`pip install pyyaml`).

## 2. Pipeline shape

```
pull request:  install → [lint | typecheck | unit tests | build] in parallel → integration tests → preview deploy
main:          same checks → build artifact once → deploy staging → smoke test → (approval) → deploy production
tag/release:   changelog + version → publish package or promote artifact
```

- **Fast feedback first**: the cheapest checks run first and in parallel, so a type error fails
  in two minutes, not after a 15-minute test suite. Target under 10 minutes for a PR.
- **Required checks**: protect the default branch; require the CI jobs and review. A single
  aggregate job (`needs: [lint, test, build]`) as the required check keeps branch protection
  stable when jobs change.
- **Build once, deploy many**: build the artifact (container image, bundle) once on `main`, tag it
  with the commit SHA, and promote that exact artifact through environments. Never rebuild per
  environment; configuration differs, the artifact does not.
- **Deterministic**: lockfile installs (`npm ci`, `pnpm install --frozen-lockfile`), pinned
  runtime versions, pinned actions, no network calls to things that change under you.

## 3. Speed

- Cache dependencies with the setup action's built-in cache (`actions/setup-node` with
  `cache: npm`), and build caches where the tool supports it (Turborepo, Nx, Next.js `.next/cache`,
  Docker layer cache via `cache-from/cache-to: type=gha`).
- Run independent jobs in parallel; shard slow test suites (`--shard=${{ matrix.shard }}/4`).
- Skip work that cannot be affected: `paths` filters on triggers, or affected-only runs in
  monorepos (Turborepo `--filter=...[origin/main]`, Nx affected).
- `concurrency` with `cancel-in-progress: true` for PR workflows, so a new push cancels the
  previous run. Never cancel in-progress production deploys.
- Measure before optimizing: look at which steps dominate in the run timings.

## 4. Security

Treat every workflow as code that runs with your secrets.

- **Least privilege**: set `permissions: contents: read` at the top of every workflow and grant
  more per job only where needed (`id-token: write` for OIDC, `pull-requests: write` to comment).
- **Pin third-party actions to a full commit SHA** with the version in a comment:
  `uses: some-org/some-action@8f4b7f84864484a7bf31766abe9204da3cbe65b3 # v4.1.0`. Tags can be moved
  to malicious code; SHAs cannot. Keep them updated with Dependabot or Renovate.
- **No long-lived cloud keys**: authenticate to AWS, GCP and Azure with OIDC
  (`id-token: write` + the provider's login action, trust policy scoped to the repository and
  branch or environment).
- **Script injection**: never interpolate untrusted event data (`github.event.pull_request.title`,
  `head_ref`, issue and comment bodies, commit messages) directly into `run:`. Pass it through
  `env:` and reference the environment variable, quoted.
- **`pull_request_target` and `workflow_run`** run with secrets in the context of the base
  repository. Never check out and execute the PR's code in them. Use plain `pull_request` for
  building and testing contributions.
- **Secrets**: scoped to environments, with required reviewers on production; never echoed; not
  passed to steps that do not need them. Mask derived values with `::add-mask::`.
- **Self-hosted runners** never on public repositories; ephemeral where possible.
- Enable secret scanning and push protection, dependency review on PRs, and CodeQL or another
  static analysis job.

## 5. Deploys

- Use GitHub **environments** (`environment: production`) for secrets scoping, required
  reviewers, wait timers and deployment history.
- `concurrency: { group: deploy-production, cancel-in-progress: false }` so deploys queue rather
  than overlap.
- Run migrations as their own step before the new code serves traffic, written to be compatible
  with the previous release (see the `database` and `deployment` skills).
- After deploy: a smoke test against the real environment (health endpoint plus one critical
  read), and automatic rollback or a clear manual rollback path if it fails.
- Record what was deployed: the commit SHA as the image tag, a deployment record, and a release
  note.

## 6. Releases and versioning

- Libraries and packages: semantic versioning, automated with Changesets, release-please or
  semantic-release from conventional commits; publish from CI with provenance
  (`npm publish --provenance` with `id-token: write`).
- Applications: version by commit SHA and date; tag releases for traceability; generate notes
  from merged PRs.

## 7. Flaky and failing pipelines

- Read the actual failing log before changing anything; rerun only to confirm flakiness, never as
  the fix.
- Flaky tests: quarantine with an owner and a ticket while fixing the root cause (see the
  `backend-testing` skill); do not add blanket retries to the job.
- "Works locally, fails in CI": differences in runtime version, time zone and locale, file-system
  case sensitivity, missing env vars, parallelism, or network access. Reproduce with the same
  container image or `act` when possible.
- Every job has `timeout-minutes` so a hang costs minutes, not six hours.

## 8. Other CI systems

The same principles apply. GitLab CI: `rules:` instead of `on:` filters, `cache:` keyed on the
lockfile, `needs:` for a DAG, protected variables and environments, CI/CD OIDC (`id_tokens:`).
CircleCI, Buildkite and Jenkins: pin orb and plugin versions, restrict contexts and credentials
to protected branches, and avoid running untrusted fork code with secrets.

## Reference files

- `references/workflows.md` - complete GitHub Actions templates: Node CI with parallel jobs and
  caching, Postgres service, test sharding, Docker build and push to a registry with OIDC,
  staged deploy with environments and approval, release with Changesets, reusable workflows,
  and Dependabot configuration for actions.
- `scripts/audit-workflows.py` - static security and hygiene audit of workflow files.
