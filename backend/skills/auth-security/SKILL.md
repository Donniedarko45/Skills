---
name: auth-security
description: Implement and review authentication, sessions, authorization and backend security - login, signup, passwords, passkeys, MFA, OAuth/OIDC, sessions vs JWTs, cookies, CSRF, password reset, API keys, roles and permissions, multi-tenant isolation, secrets, rate limiting, and OWASP issues such as IDOR, injection, SSRF and mass assignment. Use this whenever the task touches who a user is or what they may do (sign-in flows, middleware/proxy guards, protected routes, server actions, admin features, "only the owner can edit"), handles tokens, cookies or secrets, or asks for a security review of backend code. Use it even when security was not mentioned, because access-control bugs are the most common serious vulnerability.
---

# Auth and backend security

Two questions guard every request: **who is this?** (authentication) and **may they do this, to
this object?** (authorization). Most real breaches are not clever cryptography failures; they are
a missing ownership check, a token that never expires, a secret in a repository, or a
hand-rolled login flow. So: use proven components for authentication, check authorization on
every object at the data layer, and keep secrets out of code.

## 1. Read what exists first

- Which auth library or provider is in use (Auth.js, Better Auth, Clerk, Auth0, WorkOS, Supabase,
  Cognito, Firebase, a custom one), where sessions live, how the current user is obtained in a
  handler, and how roles or permissions are modelled.
- Where checks happen today: middleware/proxy, route handlers, server actions, a data-access layer.
- Extend the existing mechanism. Two parallel auth systems are worse than one imperfect one.

## 2. Authentication: do not build the primitives

- **Use a maintained library or a hosted provider** for password storage, sessions, OAuth and
  MFA. Writing these by hand is where timing leaks, weak tokens and broken flows come from.
- **Passwords**: hash with Argon2id (or scrypt, or bcrypt with cost 12+ where Argon2 is not
  available), never encrypt or plain-hash them. Follow current NIST guidance: favour length over
  composition rules (15+ characters when the password is the only factor), no forced periodic
  rotation, block known-breached passwords, allow paste and password managers.
- **Offer passkeys (WebAuthn)** and MFA (TOTP or passkeys; SMS only as a fallback). Require MFA
  for admin and other high-privilege accounts.
- **OAuth / OIDC sign-in**: authorization code flow with PKCE, validate `state` and `nonce`,
  verify the ID token's signature, issuer, audience and expiry. Link accounts by verified email
  only, and only when the provider asserts the email is verified.
- **Do not reveal which accounts exist**: login, signup and password-reset responses read the
  same whether or not the email is registered ("If an account exists, we sent a link").
- **Throttle**: rate-limit login, signup, reset and MFA endpoints per account and per IP, with
  backoff rather than permanent lockout (lockouts become a denial-of-service tool).

## 3. Sessions

For first-party web apps, prefer **server-side sessions** referenced by an opaque cookie:

```
Set-Cookie: __Host-session=<128+ bits random>; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=...
```

- `HttpOnly` keeps JavaScript (and XSS) away from it; `Secure` keeps it on HTTPS; `SameSite=Lax`
  blocks most cross-site request forgery; the `__Host-` prefix pins it to this host.
- Store only a hash of the session token in the database, so a database leak does not leak live
  sessions.
- **Rotate the session ID on login and on privilege change** (prevents session fixation).
- Idle timeout (for example 30 minutes to a few days, by risk) plus an absolute lifetime.
- Logout deletes the server session. "Log out everywhere" and password changes revoke all of a
  user's sessions.

**JWTs** suit short-lived service-to-service credentials and third-party API access tokens, not
browser sessions you need to revoke. If you use them: allowlist the algorithm (never accept
`none`, never let the token choose), verify signature, `iss`, `aud`, `exp` and `nbf`, keep
access tokens short (5-15 minutes) with rotating refresh tokens, and never put secrets or
personal data in the payload (it is only encoded, not encrypted).

## 4. CSRF

Cookie-authenticated, state-changing requests need CSRF protection: `SameSite=Lax` or `Strict`
cookies, **plus** either an `Origin`/`Sec-Fetch-Site` check on non-GET requests or a CSRF token.
Never change state on `GET`. Next.js Server Actions compare `Origin` with `Host` for you; custom
route handlers that read cookies do not.

## 5. Authorization: every object, every time

This is where most serious bugs are. Rules:

- **Deny by default.** A new route or action is inaccessible until a check grants access.
- **Check in the data-access layer, not only at the edge.** Middleware/proxy checks and hidden
  buttons are conveniences; the function that reads or writes the record must enforce access.
  Every Server Action and route handler is a public endpoint, whatever page renders it.
- **Object-level checks (IDOR)**: `GET /invoices/inv_9` must verify the caller may see `inv_9`.
  Scope queries by owner or tenant instead of fetching then checking:

  ```ts
  // good: the query cannot return another tenant's invoice
  const invoice = await db.invoice.findFirst({ where: { id, tenantId: session.tenantId } })
  if (!invoice) throw notFound('Invoice')       // 404, do not reveal it exists elsewhere
  ```

- **Function-level checks**: admin actions verify the role server-side, every time.
- **Field-level**: parse input with an allowlist so users cannot set `role`, `tenantId`,
  `ownerId`, `isAdmin`, `price` (mass assignment), and filter output so internal fields never
  leave the server.
- **Model permissions explicitly**: roles map to permissions (`invoice:read`, `invoice:void`),
  and code checks permissions, not role names, so roles can change without code changes. Add
  attribute-based rules (owner, tenant, state) in one policy module, not scattered `if`s.
- **Multi-tenancy**: derive the tenant from the session, never from the request body or a header
  the client controls; add Postgres row-level security as a backstop (see the `database` skill).

A reusable shape:

```ts
// lib/authz.ts
export type Action = 'invoice:read' | 'invoice:create' | 'invoice:void' | 'member:invite'

const rolePermissions: Record<Role, readonly Action[]> = {
  owner: ['invoice:read', 'invoice:create', 'invoice:void', 'member:invite'],
  member: ['invoice:read', 'invoice:create'],
  viewer: ['invoice:read'],
}

export function can(session: Session, action: Action) {
  return rolePermissions[session.role].includes(action)
}

export function assertCan(session: Session, action: Action): void {
  if (!can(session, action)) throw new Problem(403, 'forbidden', 'You do not have permission to do this')
}
```

## 6. Common vulnerabilities to check for

| Issue                    | Prevent it with                                                                 |
| ------------------------ | ------------------------------------------------------------------------------- |
| SQL injection            | parameterized queries / the query builder; never string-concatenate SQL          |
| XSS                      | framework escaping; no `dangerouslySetInnerHTML` with user content without sanitizing; CSP |
| SSRF                     | allowlist outbound hosts for user-supplied URLs; block private and metadata IPs (169.254.169.254); resolve then check |
| Path traversal           | never build file paths from user input; use generated IDs for stored files       |
| Mass assignment          | allowlist schemas for input                                                     |
| Open redirect            | only redirect to relative paths or an allowlist                                 |
| Insecure deserialization | parse JSON with schemas; never `eval` or unpickle untrusted data                 |
| Timing attacks           | `crypto.timingSafeEqual` for comparing secrets, tokens and signatures            |
| Weak randomness          | `crypto.randomBytes` / `crypto.randomUUID`, never `Math.random` for tokens        |
| Verbose errors           | generic messages to clients, details to logs                                    |
| Dependency vulnerabilities | lockfiles, automated updates, audit in CI                                      |

## 7. Secrets

- Never in code, commits, logs, error messages or client bundles. In Next.js only
  `NEXT_PUBLIC_*` variables reach the browser; everything else must stay server-side, and modules
  that read secrets should `import 'server-only'`.
- Load from the platform's secret store or a manager (AWS Secrets Manager, GCP Secret Manager,
  Vault, Doppler, 1Password); `.env` files only for local development and always gitignored.
- Validate required configuration at startup (a zod schema over `process.env`) so a missing
  secret fails the deploy, not the first request.
- Rotate on suspicion; design for rotation (support two valid keys during a changeover).
- If a secret was committed, treat it as leaked: rotate it first, then clean history.

## 8. Security events and auditing

Log authentication events (login success and failure, MFA changes, password resets, session
revocations), permission denials and admin actions, with user, tenant, IP and request ID, and
without passwords, tokens or full card numbers. Keep an append-only audit log for actions
customers will ask about ("who deleted this?").

## 9. Reviewing code for auth and security

Use `references/review-checklist.md`. Report by exploitability and impact: anything that lets
one user read or change another user's or tenant's data is critical. For each finding give the
request an attacker would send, what they would get, and the fix.

## Reference files

- `references/flows.md` - implementation recipes: password reset, email verification, API keys,
  invitations, OAuth with PKCE, step-up authentication, rate-limiting sketch, environment
  validation.
- `references/review-checklist.md` - security review checklist mapped to OWASP categories.
