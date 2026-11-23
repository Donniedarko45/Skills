# Security review checklist

Grouped by OWASP Top 10 category. Severity guide: **critical** = one user or tenant can read or
change another's data, or anyone can act as an admin; **high** = account takeover or secret
exposure with some effort; **medium** = weakens defences; **low** = hardening.

## Broken access control (A01)

- [ ] Every route handler, Server Action and RPC authenticates the caller, or is explicitly public.
- [ ] Every read and write of a tenant- or user-owned record is scoped by owner/tenant in the query.
- [ ] Not-found and forbidden for other tenants' records look identical (404).
- [ ] Admin and privileged actions check permissions server-side.
- [ ] Input schemas exclude server-owned fields (role, tenantId, ownerId, price, status transitions).
- [ ] Tenant comes from the session, never from client-controlled input.
- [ ] Redirect targets are relative or allowlisted.

## Cryptographic failures (A02)

- [ ] Passwords hashed with Argon2id / scrypt / bcrypt (cost 12+); no fast hashes, no encryption.
- [ ] Tokens, session IDs and keys from a CSPRNG with at least 128 bits of entropy.
- [ ] Only hashes of session tokens, reset tokens and API keys are stored.
- [ ] Secrets compared with `timingSafeEqual`.
- [ ] TLS everywhere; HSTS set; cookies `Secure`.
- [ ] Sensitive fields encrypted at rest where required (tokens from third parties, PII by policy).

## Injection (A03)

- [ ] All SQL parameterized; no string-built queries, including `ORDER BY` and column names (allowlist them).
- [ ] No shell commands built from input; no `eval` or `new Function` on input.
- [ ] HTML from users sanitized before rendering; no `dangerouslySetInnerHTML` with raw input.

## Insecure design (A04)

- [ ] Sensitive flows (reset, email change, payout change) are single-use, time-limited and notify the user.
- [ ] Step-up authentication for destructive or sensitive actions.
- [ ] Business limits enforced server-side (quantities, prices, quotas, state machines).

## Security misconfiguration (A05)

- [ ] Errors do not expose stack traces, SQL or internal hostnames.
- [ ] CORS allows explicit origins only; credentials not allowed with wildcard origins.
- [ ] Security headers: CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, frame protection.
- [ ] Debug endpoints, admin consoles and default credentials are off in production.

## Vulnerable components (A06)

- [ ] Lockfile committed; dependency audit and automated updates in CI.
- [ ] No unmaintained auth or crypto libraries.

## Identification and authentication failures (A07)

- [ ] Session cookie: `HttpOnly`, `Secure`, `SameSite`, `__Host-` prefix, rotated on login.
- [ ] Sessions expire (idle and absolute) and are revoked on logout and password change.
- [ ] JWTs (if any): algorithm allowlisted; `iss`, `aud`, `exp` verified; short lifetime.
- [ ] Login, signup, reset and MFA are rate-limited; responses do not reveal whether an account exists.
- [ ] MFA available, and required for admins.
- [ ] CSRF protection on cookie-authenticated state-changing requests.

## Integrity failures (A08)

- [ ] Webhooks verified by signature over the raw body, with a timestamp window.
- [ ] No deserialization of untrusted data into objects with behaviour.
- [ ] CI/CD and package sources are trusted and pinned (see the `ci-cd` skill).

## Logging and monitoring failures (A09)

- [ ] Auth events, permission denials and admin actions are logged with user, tenant, IP and request ID.
- [ ] No passwords, tokens, keys or full payment data in logs.
- [ ] Alerts exist for spikes in failed logins and permission denials.

## SSRF (A10)

- [ ] User-supplied URLs (webhooks, imports, previews) are restricted to allowed schemes and hosts.
- [ ] Private, loopback, link-local and cloud metadata addresses are blocked after DNS resolution.
- [ ] Redirects are not followed blindly on server-side fetches.

## Secrets

- [ ] No secrets in the repository, client bundles, logs or error messages.
- [ ] Configuration validated at startup.
- [ ] Rotation is possible without downtime.
