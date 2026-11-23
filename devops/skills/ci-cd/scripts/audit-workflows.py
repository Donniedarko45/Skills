#!/usr/bin/env python3
"""Audit GitHub Actions workflow files for security and hygiene problems.

Usage:
  python3 audit-workflows.py [path ...] [--json] [--fail-on high|medium|low]

Paths can be workflow files or directories (default: .github/workflows).
Needs PyYAML (pip install pyyaml).

Checks: missing or broad permissions, unpinned actions, script injection from untrusted
event fields, pull_request_target / workflow_run running untrusted code, secrets printed or
interpolated into shell, piping remote scripts to a shell, self-hosted runners on PR triggers,
missing job timeouts, missing concurrency on PR workflows, insecure commands, secrets: inherit.

Exit codes: 0 no findings at or above --fail-on (default: high), 1 findings, 2 usage error.
"""
import glob
import json
import os
import re
import sys

try:
    import yaml
except ImportError:
    print('PyYAML is required: pip install pyyaml', file=sys.stderr)
    sys.exit(2)

SEVERITY = {'low': 0, 'medium': 1, 'high': 2}
SHA = re.compile(r'^[0-9a-f]{40}$')
FIRST_PARTY = ('actions/', 'github/')
UNTRUSTED = re.compile(
    r'\$\{\{\s*('
    r'github\.event\.(issue|pull_request|comment|review|review_comment|discussion|discussion_comment)\.(title|body|head\.ref|head\.label|head\.repo\.default_branch)'
    r'|github\.event\.pull_request\.head\.(ref|label)'
    r'|github\.event\.(head_commit|commits[^}]*)\.(message|author\.name|author\.email)'
    r'|github\.event\.commits'
    r'|github\.event\.pages[^}]*\.page_name'
    r'|github\.event\.workflow_run\.(head_branch|head_commit\.message|display_title)'
    r'|github\.head_ref'
    r')[^}]*\}\}'
)
PR_HEAD_CHECKOUT = re.compile(r'github\.event\.pull_request\.head\.(sha|ref)|github\.event\.workflow_run\.head_(sha|branch)|refs/pull/|github\.head_ref')


class Loader(yaml.SafeLoader):
    pass


# YAML 1.1 turns the key `on` into True; keep it a string.
Loader.yaml_implicit_resolvers = {k: [(t, r) for t, r in v if t != 'tag:yaml.org,2002:bool'] for k, v in yaml.SafeLoader.yaml_implicit_resolvers.items()}


def triggers(doc):
    on = doc.get('on', doc.get(True))
    if isinstance(on, str):
        return {on}
    if isinstance(on, list):
        return set(on)
    if isinstance(on, dict):
        return set(on.keys())
    return set()


def line_of(text, needle, start=0):
    idx = text.find(needle, start)
    return text.count('\n', 0, idx) + 1 if idx >= 0 else 1


def broad(perms):
    if perms in ('write-all',):
        return True
    if isinstance(perms, dict):
        return sum(1 for v in perms.values() if v == 'write') >= 4
    return False


def audit(path):
    text = open(path, encoding='utf-8', errors='replace').read()
    findings = []

    def add(sev, needle, issue, fix):
        findings.append({'file': path, 'line': line_of(text, needle) if needle else 1, 'severity': sev, 'issue': issue, 'fix': fix})

    try:
        doc = yaml.load(text, Loader=Loader)
    except yaml.YAMLError as err:
        return [{'file': path, 'line': 1, 'severity': 'high', 'issue': f'Invalid YAML: {err}', 'fix': 'Fix the syntax.'}]
    if not isinstance(doc, dict) or not isinstance(doc.get('jobs'), dict):
        return findings

    trig = triggers(doc)
    pr_like = bool(trig & {'pull_request', 'pull_request_target', 'issue_comment', 'pull_request_review', 'pull_request_review_comment', 'workflow_run', 'discussion', 'issues'})
    privileged_trigger = bool(trig & {'pull_request_target', 'workflow_run'})
    top_perms = doc.get('permissions')
    jobs = doc['jobs']

    if top_perms is None and any(isinstance(j, dict) and j.get('permissions') is None for j in jobs.values()):
        add('medium', 'jobs:', 'No permissions block: the GITHUB_TOKEN gets the repository default, which may be read-write.',
            'Add `permissions: contents: read` at the top of the workflow and grant extra scopes per job.')
    if broad(top_perms):
        add('high', 'permissions', 'Workflow-level permissions are broad (write-all or many write scopes).',
            'Grant the minimum at workflow level (contents: read) and add specific write scopes only to the jobs that need them.')
    if isinstance(top_perms, dict) and top_perms.get('id-token') == 'write' and len(jobs) > 1:
        add('low', 'id-token', 'id-token: write is granted to every job in the workflow.', 'Move id-token: write to the deploy job that needs OIDC.')

    if privileged_trigger:
        add('medium', 'pull_request_target' if 'pull_request_target' in trig else 'workflow_run',
            'pull_request_target / workflow_run run with secrets and a write token in the base repository context.',
            'Use pull_request for building and testing contributions. If this trigger is needed, never check out or execute the PR\'s code, and keep permissions minimal.')

    if 'ACTIONS_ALLOW_UNSECURE_COMMANDS' in text:
        add('high', 'ACTIONS_ALLOW_UNSECURE_COMMANDS', 'Re-enables deprecated set-env/add-path commands that allow environment injection.', 'Remove it; write to $GITHUB_ENV and $GITHUB_PATH instead.')

    has_concurrency = 'concurrency' in doc
    if 'pull_request' in trig and not has_concurrency and not any(isinstance(j, dict) and 'concurrency' in j for j in jobs.values()):
        add('low', 'pull_request', 'PR workflow without concurrency: superseded runs keep consuming runners.',
            'Add `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }`.')

    for job_id, job in jobs.items():
        if not isinstance(job, dict):
            continue
        anchor = f'{job_id}:'
        if 'uses' in job:  # reusable workflow call
            ref = str(job['uses'])
            if not ref.startswith('./') and '@' in ref and not SHA.match(ref.split('@')[-1]):
                add('medium', ref, f'Reusable workflow {ref} is referenced by a mutable ref.', 'Pin it to a full commit SHA.')
            if job.get('secrets') == 'inherit':
                add('low', 'secrets: inherit', f'Job {job_id} passes all secrets to a reusable workflow.', 'Pass only the secrets it needs explicitly.')
            continue
        if broad(job.get('permissions')):
            add('medium', anchor, f'Job {job_id} has broad write permissions.', 'Grant only the scopes the job uses.')
        if 'timeout-minutes' not in job:
            add('low', anchor, f'Job {job_id} has no timeout-minutes; a hung step runs for up to 6 hours.', 'Set timeout-minutes to a little above the normal duration.')
        runs_on = json.dumps(job.get('runs-on', ''))
        if 'self-hosted' in runs_on and pr_like:
            add('medium', anchor, f'Job {job_id} uses a self-hosted runner on a PR-triggered workflow.', 'Use GitHub-hosted or ephemeral, isolated runners for untrusted code.')

        for step in job.get('steps') or []:
            if not isinstance(step, dict):
                continue
            uses = step.get('uses')
            if isinstance(uses, str) and not uses.startswith('./'):
                if uses.startswith('docker://'):
                    if '@sha256:' not in uses:
                        add('medium', uses, f'Docker action {uses} is not pinned to a digest.', 'Pin the image by @sha256 digest.')
                elif '@' in uses:
                    ref = uses.split('@', 1)[1]
                    if not SHA.match(ref):
                        first = uses.startswith(FIRST_PARTY)
                        add('low' if first else 'medium', uses,
                            f'Action {uses} is pinned to a mutable tag or branch.' + ('' if first else ' A compromised or retagged release runs with this job\'s token and secrets.'),
                            'Pin to the full 40-character commit SHA with the version in a comment, and let Dependabot or Renovate update it.')
                if privileged_trigger and uses.startswith('actions/checkout'):
                    with_ = step.get('with') or {}
                    if PR_HEAD_CHECKOUT.search(json.dumps(with_)):
                        add('high', uses, 'Checks out the pull request head in a privileged (pull_request_target / workflow_run) workflow.',
                            'Do not build or run PR code here. Split into a pull_request workflow that builds and uploads artifacts, and a privileged one that only reads them as data.')
                if uses.startswith('actions/github-script'):
                    script = str((step.get('with') or {}).get('script', ''))
                    m = UNTRUSTED.search(script)
                    if m:
                        add('high', m.group(0), f'Untrusted event data {m.group(0)} is interpolated into a github-script script.',
                            'Read it from context.payload inside the script, or pass it via env and process.env.')

            run = step.get('run')
            if isinstance(run, str):
                for m in UNTRUSTED.finditer(run):
                    add('high', m.group(0), f'Script injection: {m.group(0)} is expanded into the shell before it runs, so a crafted title, branch name or message can execute commands.',
                        'Pass it through env (`env: { TITLE: ${{ ... }} }`) and use "$TITLE" quoted in the script.')
                if re.search(r'(echo|printf|cat)[^\n|]*\$\{\{\s*secrets\.', run):
                    add('high', 'secrets.', 'A secret is printed by a run step; masking does not survive encoding or partial output.', 'Do not print secrets. Pass them via env to the command that needs them.')
                elif re.search(r'\$\{\{\s*secrets\.', run):
                    add('low', 'secrets.', 'A secret is interpolated directly into a shell script.', 'Pass it via env and reference the variable; it keeps the secret out of the rendered script.')
                if re.search(r'(curl|wget)[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b', run):
                    add('medium', 'curl' if 'curl' in run else 'wget', 'A remote script is piped straight into a shell; its content can change at any time.', 'Download a pinned version, verify its checksum, then run it, or use a pinned action.')

    return findings


def main(argv):
    as_json = '--json' in argv
    fail_on = 'high'
    args = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('-h', '--help'):
            print(__doc__)
            return 0
        if a == '--json':
            pass
        elif a == '--fail-on':
            if i + 1 >= len(argv) or argv[i + 1] not in SEVERITY:
                print('--fail-on must be high, medium or low', file=sys.stderr)
                return 2
            fail_on = argv[i + 1]
            i += 1
        else:
            args.append(a)
        i += 1
    if not args:
        args = ['.github/workflows']

    files = []
    for p in args:
        if os.path.isdir(p):
            files += sorted(glob.glob(os.path.join(p, '*.yml')) + glob.glob(os.path.join(p, '*.yaml')))
        elif os.path.isfile(p):
            files.append(p)
        else:
            print(f'Not found: {p}', file=sys.stderr)
            return 2
    if not files:
        print('No workflow files found.', file=sys.stderr)
        return 2

    findings = [f for path in files for f in audit(path)]
    if as_json:
        print(json.dumps(findings, indent=2))
    else:
        if not findings:
            print(f'No findings in {len(files)} workflow file(s).')
        for f in sorted(findings, key=lambda x: (x['file'], -SEVERITY[x['severity']], x['line'])):
            print(f"{f['severity'].upper():6} {f['file']}:{f['line']}")
            print(f"       Problem: {f['issue']}")
            print(f"       Fix:     {f['fix']}\n")
        if findings:
            c = {s: sum(1 for f in findings if f['severity'] == s) for s in SEVERITY}
            print(f"{len(files)} file(s): {c['high']} high, {c['medium']} medium, {c['low']} low.")
    return 1 if any(SEVERITY[f['severity']] >= SEVERITY[fail_on] for f in findings) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
