# DevOps skills

Skills for shipping and running services: GitHub Actions, Docker, Terraform/OpenTofu,
Kubernetes and managed platforms, Prometheus-style monitoring, and incident response. Examples use
AWS where a cloud is needed; the skills note GCP, Azure, GitLab CI and managed-platform
equivalents, and tell Claude to work with the project's existing setup.

| Skill                                                   | Triggers on                                                                         | Bundled extras                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`ci-cd`](skills/ci-cd)                                 | anything in `.github/workflows`, slow or flaky CI, deploy and release pipelines      | workflow templates, `audit-workflows.py`                       |
| [`containers`](skills/containers)                       | Dockerfiles, image size and security, signal handling, Compose                      | Dockerfiles for Node, Next.js, Python and Go; Compose template |
| [`infrastructure-as-code`](skills/infrastructure-as-code) | Terraform/OpenTofu changes, plans, state, drift, imports, IaC in CI              | Terraform patterns: backend, modules, moved/import, OIDC, CI   |
| [`deployment`](skills/deployment)                       | deploy setup, Kubernetes manifests, rollouts, feature flags, rollback, risky releases | Kubernetes baseline manifests, release checklist and rollback runbook |
| [`monitoring-alerting`](skills/monitoring-alerting)     | SLOs, alert rules, dashboards, uptime checks, noisy pagers                          | Prometheus burn-rate rules, Alertmanager routing, runbook template |
| [`incident-response`](skills/incident-response)         | live production problems, status updates, postmortems, runbooks                     | channel, update, status page, handoff and postmortem templates |

## Install

```bash
claude plugin marketplace add Donniedarko45/Skills
claude plugin install devops@donniedarko45-skills
```

## Script

`audit-workflows.py` checks GitHub Actions workflows for missing or broad `permissions`,
actions not pinned to a commit SHA, script injection from untrusted event fields, dangerous
`pull_request_target` checkouts, printed secrets, `curl | sh`, self-hosted runners on PR triggers,
and missing timeouts and concurrency. It needs Python 3 and PyYAML.

```bash
pip install pyyaml
python3 devops/skills/ci-cd/scripts/audit-workflows.py .github/workflows
python3 devops/skills/ci-cd/scripts/audit-workflows.py .github/workflows --fail-on medium --json
```
