# Terraform / OpenTofu patterns

Examples use AWS; the structure is the same on GCP and Azure. Provider versions are examples:
check the current major version before pinning.

## Contents

1. Backend and version pinning
2. A service module
3. Environment root module
4. Protecting stateful resources
5. moved, import and removed
6. OIDC role for CI
7. Plan and apply in GitHub Actions
8. Drift detection
9. Useful commands

## 1. Backend and version pinning

```hcl
# envs/production/versions.tf
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "acme-terraform-state-prod"
    key          = "production/core.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true          # S3-native locking (Terraform 1.10+); older setups use dynamodb_table
  }
}

provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      environment = "production"
      managed-by  = "terraform"
      repository  = "acme/infra"
    }
  }
}
```

The state bucket itself (versioning, encryption, public access block) is created once by a small
bootstrap stack or by hand and documented.

## 2. A service module

```hcl
# modules/service/variables.tf
variable "name" {
  type        = string
  description = "Service name, used in resource names and tags."
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}$", var.name))
    error_message = "Use 3-31 lowercase letters, digits and hyphens."
  }
}

variable "environment" {
  type = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "image" {
  type        = string
  description = "Container image with an immutable tag (commit SHA) or digest."
}

variable "cpu" {
  type    = number
  default = 512
}

variable "memory" {
  type    = number
  default = 1024
}

variable "env_vars" {
  type        = map(string)
  default     = {}
  description = "Non-secret environment variables."
}

variable "secret_arns" {
  type        = map(string)
  default     = {}
  description = "Environment variable name to Secrets Manager ARN."
}
```

```hcl
# modules/service/main.tf (excerpt)
locals {
  full_name = "${var.name}-${var.environment}"
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/ecs/${local.full_name}"
  retention_in_days = var.environment == "production" ? 90 : 14
}

resource "aws_iam_role" "task" {
  name               = "${local.full_name}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

# ... task definition, service, target group, alarms
```

```hcl
# modules/service/outputs.tf
output "service_name" { value = aws_ecs_service.this.name }
output "task_role_arn" { value = aws_iam_role.task.arn }
```

## 3. Environment root module

```hcl
# envs/production/main.tf
module "billing_api" {
  source      = "../../modules/service"
  name        = "billing-api"
  environment = "production"
  image       = var.billing_api_image
  cpu         = 1024
  memory      = 2048
  env_vars    = { LOG_LEVEL = "info" }
  secret_arns = { DATABASE_URL = aws_secretsmanager_secret.billing_db_url.arn }
}

module "billing_db" {
  source            = "../../modules/postgres"
  name              = "billing"
  environment       = "production"
  instance_class    = "db.r7g.large"
  multi_az          = true
  backup_retention  = 14
}
```

Shared modules used by many stacks: source them from a tagged git ref or a private registry
(`source = "git::https://github.com/acme/infra-modules.git//service?ref=v3.2.0"`), so a module
change does not reach every environment at once.

## 4. Protecting stateful resources

```hcl
resource "aws_db_instance" "this" {
  identifier                = "${var.name}-${var.environment}"
  engine                    = "postgres"
  engine_version            = "17"
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.name}-${var.environment}-final"
  backup_retention_period   = var.backup_retention
  storage_encrypted         = true
  manage_master_user_password = true      # password generated and stored in Secrets Manager

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [engine_version]    # minor versions upgraded by AWS; manage majors deliberately
  }
}
```

## 5. moved, import and removed

```hcl
# rename or move into a module without recreating
moved {
  from = aws_s3_bucket.uploads
  to   = module.storage.aws_s3_bucket.uploads
}

# adopt an existing resource
import {
  to = aws_route53_zone.main
  id = "Z0123456789ABCDEFGHIJ"
}

# stop managing without destroying
removed {
  from = aws_s3_bucket.legacy_exports
  lifecycle {
    destroy = false
  }
}
```

After `plan` shows exactly the intended moves and no other changes, apply, then delete the
blocks in a later change (or keep `moved` blocks in shared modules for consumers still on old
versions).

## 6. OIDC role for CI

```hcl
data "aws_iam_policy_document" "github_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:acme/infra:environment:production"]    # only jobs in the production environment
    }
  }
}

resource "aws_iam_role" "terraform_production" {
  name               = "github-terraform-production"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}
```

Give the plan job a read-only role and the apply job the write role, each trusted only for its
environment.

## 7. Plan and apply in GitHub Actions

```yaml
name: Infra
on:
  pull_request:
    paths: ['infra/**']
  push:
    branches: [main]
    paths: ['infra/**']

permissions:
  contents: read

jobs:
  plan:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions: { contents: read, id-token: write, pull-requests: write }
    defaults: { run: { working-directory: infra/envs/production } }
    steps:
      - uses: actions/checkout@v5                      # pin to SHA
      - uses: hashicorp/setup-terraform@v3             # or opentofu/setup-opentofu; pin to SHA
      - uses: aws-actions/configure-aws-credentials@v4 # pin to SHA
        with: { role-to-assume: 'arn:aws:iam::123456789012:role/github-terraform-plan', aws-region: eu-west-1 }
      - run: terraform fmt -check -recursive ../..
      - run: terraform init -input=false
      - run: terraform validate
      - run: terraform plan -input=false -no-color -out=tfplan | tee plan.txt
      - run: gh pr comment "$PR" --body-file <(printf '```\n%s\n```' "$(tail -c 60000 plan.txt)")
        env: { GH_TOKEN: '${{ github.token }}', PR: '${{ github.event.pull_request.number }}' }

  apply:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    timeout-minutes: 30
    environment: production                            # required reviewers
    concurrency: { group: terraform-production, cancel-in-progress: false }
    permissions: { contents: read, id-token: write }
    defaults: { run: { working-directory: infra/envs/production } }
    steps:
      - uses: actions/checkout@v5
      - uses: hashicorp/setup-terraform@v3
      - uses: aws-actions/configure-aws-credentials@v4
        with: { role-to-assume: 'arn:aws:iam::123456789012:role/github-terraform-production', aws-region: eu-west-1 }
      - run: terraform init -input=false
      - run: terraform plan -input=false -out=tfplan
      - run: terraform apply -input=false tfplan
```

Tools like Atlantis, Terraform Cloud/HCP, Spacelift or env0 add plan locking per PR, policy checks
and apply-on-comment workflows when the team outgrows this.

## 8. Drift detection

```yaml
on:
  schedule: [{ cron: '17 6 * * 1-5' }]
# job: init, then
#   terraform plan -detailed-exitcode -input=false
# exit code 2 means changes (drift): open an issue or alert the owning team.
```

## 9. Useful commands

```bash
terraform plan -out=tfplan                  # save the reviewed plan
terraform show -json tfplan | jq '.resource_changes[] | select(.change.actions | index("delete")) | .address'   # list deletions
terraform plan -target=module.billing_api   # emergency only; leaves the rest unplanned
terraform state list | grep billing         # inspect what is managed
terraform providers lock -platform=linux_amd64 -platform=darwin_arm64   # lockfile for CI and laptops
terraform console                            # evaluate expressions against state
tflint --recursive && checkov -d infra       # lint and policy scan
```
