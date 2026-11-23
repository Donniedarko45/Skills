# GitHub Actions templates

The action versions below are examples. Before using a template, look up the latest release of
each action and **pin it to the full commit SHA** with the version in a comment. To resolve a
tag to a SHA:

```bash
gh api repos/actions/checkout/commits/v5 --jq .sha          # works for tags and branches
# or pin a whole directory automatically: pinact run (github.com/suzuki-shunsuke/pinact)
```

Then let Dependabot keep them current (section 8).

## Contents

1. CI for a Node/TypeScript app
2. Test sharding
3. Build and push a container image (OIDC, no stored keys)
4. Staged deploy with environments and approval
5. Library release with Changesets
6. Reusable workflow
7. Monorepo: run only what changed
8. Dependabot for actions and dependencies

## 1. CI for a Node/TypeScript app

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v5            # pin to SHA
      - uses: actions/setup-node@v5          # pin to SHA
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      postgres:
        image: postgres:17-alpine
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: app_test }
        ports: ['5432:5432']
        options: --health-cmd "pg_isready -U postgres" --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run db:migrate
      - run: npm test -- --reporter=default --reporter=junit --outputFile=test-results.xml
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: test-results, path: test-results.xml, retention-days: 7 }

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version-file: .nvmrc, cache: npm }
      - uses: actions/cache@v4
        with:
          path: .next/cache
          key: nextjs-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
          restore-keys: nextjs-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-
      - run: npm ci
      - run: npm run build

  # Single required status check for branch protection
  ci-ok:
    if: always()
    needs: [lint, test, build]
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - run: test "${{ !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled') }}" = "true"
```

## 2. Test sharding

```yaml
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npx vitest run --shard=${{ matrix.shard }}/4      # Playwright: npx playwright test --shard=...
```

## 3. Build and push a container image (OIDC, no stored keys)

```yaml
name: Image
on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  image:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      id-token: write          # OIDC token for the cloud provider
    outputs:
      image: ${{ steps.meta.outputs.image }}
    steps:
      - uses: actions/checkout@v5
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-ecr-push   # trust policy limited to this repo + main
          aws-region: eu-west-1
      - uses: aws-actions/amazon-ecr-login@v2
        id: ecr
      - id: meta
        run: echo "image=${{ steps.ecr.outputs.registry }}/billing-api:${{ github.sha }}" >> "$GITHUB_OUTPUT"
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.image }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true
```

The IAM role's trust policy restricts `token.actions.githubusercontent.com:sub` to
`repo:ORG/REPO:ref:refs/heads/main` (or `repo:ORG/REPO:environment:production`). GCP uses
`google-github-actions/auth` with Workload Identity Federation; Azure uses `azure/login` with a
federated credential. GitHub Container Registry needs only `packages: write` and the
`GITHUB_TOKEN`.

## 4. Staged deploy with environments and approval

```yaml
name: Deploy
on:
  workflow_run:                       # or call this from the Image workflow with workflow_call
    workflows: [Image]
    types: [completed]
    branches: [main]

permissions:
  contents: read

jobs:
  staging:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment: staging
    concurrency: { group: deploy-staging, cancel-in-progress: false }
    permissions: { contents: read, id-token: write }
    steps:
      - uses: actions/checkout@v5
        with: { ref: '${{ github.event.workflow_run.head_sha }}' }   # trusted: our own main branch
      - run: ./scripts/deploy.sh staging "${IMAGE_TAG}"
        env: { IMAGE_TAG: '${{ github.event.workflow_run.head_sha }}' }
      - run: ./scripts/smoke-test.sh https://staging.example.com

  production:
    needs: staging
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment: production            # required reviewers configured on the environment
    concurrency: { group: deploy-production, cancel-in-progress: false }
    permissions: { contents: read, id-token: write }
    steps:
      - uses: actions/checkout@v5
        with: { ref: '${{ github.event.workflow_run.head_sha }}' }
      - run: ./scripts/deploy.sh production "${IMAGE_TAG}"
        env: { IMAGE_TAG: '${{ github.event.workflow_run.head_sha }}' }
      - run: ./scripts/smoke-test.sh https://app.example.com
```

`workflow_run` here only ever runs code from this repository's `main` branch, never from forks;
the audit script still flags the trigger as a reminder to keep it that way. Calling the deploy
as a reusable workflow (`workflow_call`) from the image workflow avoids the trigger altogether.

## 5. Library release with Changesets

```yaml
name: Release
on:
  push:
    branches: [main]

permissions:
  contents: read

concurrency: { group: release, cancel-in-progress: false }

jobs:
  release:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: write          # version commits and tags
      pull-requests: write     # the "Version Packages" PR
      id-token: write          # npm provenance / trusted publishing
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version-file: .nvmrc, cache: npm, registry-url: https://registry.npmjs.org }
      - run: npm ci
      - uses: changesets/action@v1
        with:
          publish: npx changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Prefer npm trusted publishing (OIDC) over a stored `NPM_TOKEN` where the registry supports it.

## 6. Reusable workflow

```yaml
# .github/workflows/node-checks.yml
on:
  workflow_call:
    inputs:
      working-directory: { type: string, default: '.' }

permissions:
  contents: read

jobs:
  checks:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    defaults: { run: { working-directory: '${{ inputs.working-directory }}' } }
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version-file: '${{ inputs.working-directory }}/.nvmrc', cache: npm }
      - run: npm ci && npm run lint && npm test
```

```yaml
# caller
jobs:
  api:
    uses: ./.github/workflows/node-checks.yml
    with: { working-directory: services/api }
```

## 7. Monorepo: run only what changed

```yaml
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }                    # history for the comparison
      - run: npx turbo run lint test build --filter="...[origin/${{ github.base_ref || 'main' }}]"
```

With Nx: `npx nx affected -t lint test build --base=origin/main`. Path filters on the trigger
(`on: pull_request: paths: ['services/api/**']`) work for coarse splits but leave required checks
pending when skipped; the aggregate `ci-ok` job pattern avoids that.

## 8. Dependabot for actions and dependencies

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
    groups:
      actions: { patterns: ['*'] }
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 10
    groups:
      minor-and-patch:
        update-types: [minor, patch]
```

Dependabot updates SHA-pinned actions and keeps the version comment in sync.
