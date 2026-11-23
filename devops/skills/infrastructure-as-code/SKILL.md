---
name: infrastructure-as-code
description: Write, review and safely change infrastructure as code with Terraform or OpenTofu (and the same principles for Pulumi, CDK and CloudFormation) - project layout, remote state and locking, modules, environments, variables and outputs, provider pinning, reading plans before apply, drift, importing existing resources, refactoring with moved blocks, secrets, tagging, policy and linting, and plan/apply in CI. Use this whenever creating or editing .tf files, Terraform modules or state configuration, provisioning cloud resources (networks, databases, buckets, IAM, DNS, Kubernetes clusters), reviewing a terraform plan, fixing state or drift problems, or when someone proposes clicking something together in a cloud console that should be in code. Use it even for small changes, because a one-line edit can plan a destroy-and-recreate of a database.
---

# Infrastructure as code

Infrastructure code is the only code whose mistakes delete data on deploy. The discipline is:
every change goes through a reviewed plan, state is shared and locked, production is isolated
from everything else, and anything stateful is protected from accidental replacement.

## 1. Read what exists first

- Tool and version (`required_version`, `.terraform-version`, OpenTofu vs Terraform), providers
  and their pinned versions, where state lives and how it is locked.
- Layout: how environments are separated, which modules exist, naming and tagging conventions.
- How changes are applied today (CI with plan on PR? someone's laptop?). Never run `apply`
  against a shared environment from a local machine unless that is the established, agreed
  practice.
- Run `terraform init` and `terraform plan` (or `tofu`) before changing anything, and confirm it
  shows no changes. Existing drift must be understood before you add your own diff to it.

## 2. Layout

```
infra/
  modules/                 reusable building blocks, no provider or backend config
    service/               (main.tf, variables.tf, outputs.tf, versions.tf, README.md)
    postgres/
  envs/
    staging/               a root module per environment: backend, providers, module calls
      main.tf  backend.tf  versions.tf  terraform.tfvars
    production/
  global/                  shared resources: DNS zones, IAM for CI, artifact registries
```

- **One state per environment** (and per large, independently changed component within it), so
  a staging change cannot touch production and a plan stays fast and readable.
- Prefer **separate directories per environment** over workspaces for environments with
  different blast radius; workspaces suit short-lived, identical copies (preview environments).
- Separate accounts or projects for production and non-production in the cloud itself; IaC
  layout should mirror that boundary.

## 3. State

- **Remote backend with locking and encryption**: S3 with native lockfile locking (or a
  DynamoDB table on older versions), GCS, Azure Blob, Terraform Cloud/HCP, or a managed backend
  (Spacelift, env0, Scalr). Never commit state; it contains secrets.
- Versioning enabled on the state bucket, so a corrupted state can be restored.
- Access to production state is as sensitive as production itself; restrict it.
- State surgery (`state mv`, `state rm`, `import`) is a last resort; prefer declarative
  `moved`, `import` and `removed` blocks, which go through plan and review.

## 4. Writing configuration

- **Pin versions**: `required_version` for the CLI, `required_providers` with `~>` constraints, and
  commit `.terraform.lock.hcl`.
- **Variables** have types, descriptions and validation; defaults only where a default is safe
  everywhere. No secrets as plain variables committed in `.tfvars`.
- **Outputs** for what other stacks or humans need; mark secrets `sensitive = true`.
- **Modules** wrap a meaningful unit (a service with its IAM, logs and alarms), not a single
  resource. Keep interfaces small; version modules (git tags or a registry) when several stacks
  use them.
- **`for_each` over `count`** for collections, keyed by a stable name, so removing one item does
  not shift and recreate the others.
- **Tags/labels** on every resource via provider `default_tags`: service, environment, owner,
  cost center, `managed-by = terraform`.
- **Protect stateful resources**: `lifecycle { prevent_destroy = true }` on databases, buckets with
  data and KMS keys, plus the provider's own deletion protection (`deletion_protection = true`).
- **Data sources** to look up things owned elsewhere, instead of hard-coding IDs.
- `terraform fmt`, `terraform validate`, and a linter (TFLint) on every change; a policy or
  security scanner (Checkov, Trivy config, OPA/Conftest) in CI.

## 5. Read the plan like a reviewer

Before any apply, read the plan line by line, and look specifically for:

- `-/+` **destroy and then create** (replacement) on anything stateful: databases, disks,
  buckets, load balancers with DNS pointing at them. Find the attribute marked
  `# forces replacement` and change the approach (an in-place update, a `moved` block, or a
  planned migration).
- `-` **destroy** of anything not intended.
- **Changes you did not make**: drift, provider upgrades changing defaults, or someone else's
  unapplied work. Resolve them before applying yours.
- **IAM and network changes** that widen access (`0.0.0.0/0`, `*` actions or principals).
- Counts: the summary line `Plan: X to add, Y to change, Z to destroy` should match what you
  expect from the diff.

Save the plan (`terraform plan -out=tfplan`) and apply exactly that plan, so what was reviewed is
what runs.

## 6. Refactoring without recreating

- Renaming a resource or moving it into a module: a `moved { from = ..., to = ... }` block. The
  plan should show no changes beyond the move.
- Bringing existing resources under management: an `import { to = ..., id = ... }` block, then
  `terraform plan -generate-config-out=generated.tf` to draft the configuration; edit until the
  plan is empty.
- Stop managing something without destroying it: a `removed { from = ...  lifecycle { destroy = false } }` block.

## 7. Secrets

Never in `.tf` or committed `.tfvars`. Options, best first: let the cloud generate and store them
(managed database master passwords in Secrets Manager); create the secret container in IaC and
set the value out of band; read from a secret manager via a data source (the value then lives in
state, so state must be protected). Use ephemeral resources and write-only arguments where the
provider and Terraform/OpenTofu version support them, which keep values out of state.

## 8. CI for infrastructure

- On pull request: `fmt -check`, `validate`, TFLint, a security scanner, and `plan` for each
  affected environment, posted as a PR comment.
- On merge: apply the saved plan for non-production automatically; production through an
  environment with required approval.
- CI authenticates with OIDC to a role that can manage only that environment.
- Lock out concurrent applies to the same state (the backend lock does this; also use CI
  concurrency groups).
- Run a scheduled `plan -detailed-exitcode` to detect drift and alert on it.

Templates are in `references/terraform-patterns.md`.

## 9. Other tools

Pulumi and CDK give a general-purpose language but the same rules apply: one stack per
environment, review previews (`pulumi preview`, `cdk diff`) for replacements, protect stateful
resources (`protect: true`, `RemovalPolicy.RETAIN`), and keep secrets in the tool's secret
provider. CloudFormation: change sets, stack policies, `DeletionPolicy: Retain`.

## Reviewing an infrastructure change

Report by risk: data loss or replacement of stateful resources first, then security exposure
(public access, broad IAM, unencrypted storage), then blast radius (shared state, missing
environment isolation), then cost surprises, then hygiene (tags, naming, version pins). Ask for
the plan output if it is not provided; a review without the plan is a guess.

## Reference files

- `references/terraform-patterns.md` - backend configuration, version pinning, a service module
  with variables and validation, environment root modules, `moved`/`import`/`removed` examples,
  protecting stateful resources, OIDC role for CI, GitHub Actions plan/apply workflow, drift
  detection, and useful commands.
