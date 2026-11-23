# Auth flow recipes

Prefer the library's built-in version of each flow. Use these when there is none, or to review
one.

## Contents

1. Single-use tokens (the building block)
2. Password reset
3. Email verification and magic links
4. Invitations
5. API keys
6. OAuth / OIDC with PKCE
7. Step-up authentication
8. Rate limiting
9. Validating configuration at startup

## 1. Single-use tokens

Used by reset links, verification links, magic links and invitations.

```ts
import { createHash, randomBytes } from 'node:crypto'

export function newToken() {
  const token = randomBytes(32).toString('base64url')           // 256 bits, sent to the user
  const hash = createHash('sha256').update(token).digest('hex')  // stored
  return { token, hash }
}
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
```

```sql
create table auth_tokens (
  hash        text primary key,
  purpose     text not null check (purpose in ('password_reset', 'email_verify', 'magic_link', 'invite')),
  user_id     text,                       -- null for invites to new users
  email       text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
```

Consume atomically so a token cannot be used twice:

```sql
update auth_tokens set used_at = now()
where hash = $1 and purpose = $2 and used_at is null and expires_at > now()
returning user_id, email;
```

Store only the hash: a database leak must not yield working links. Tokens go in the URL path or
fragment of a link to your own page, which then posts them; avoid logging full URLs that
contain them.

## 2. Password reset

1. `POST /auth/password-reset` with an email. Always respond the same way ("If an account
   exists, we sent a link") and in similar time; rate-limit per email and per IP.
2. If the account exists: create a `password_reset` token valid for 15-60 minutes, invalidate
   older unused reset tokens for that user, email the link.
3. The reset page posts the token and the new password. Consume the token atomically, check the
   new password against breached lists and length rules, hash it, save it.
4. **Revoke all existing sessions** for the user, notify them by email that the password changed,
   and sign them in fresh (or send them to sign in).

## 3. Email verification and magic links

- Verification: token valid for 24 hours, consumed on click, sets `email_verified_at`.
- Magic links: valid for 10-15 minutes, single use, and bound to the browser that requested them
  where possible (store a nonce cookie at request time and require it on redemption) to stop
  link-forwarding and email-scanner pre-fetch problems. Redemption should need a click on a
  page (POST), not just the GET of the link, because security scanners open links.
- Changing email: verify the new address before switching, and notify the old one.

## 4. Invitations

- Token tied to the inviting tenant, the invited email and a role, valid for days, single use.
- Accepting requires signing in (or signing up) with that email, or explicitly confirming a
  different one.
- The role granted is the one stored with the invite, never one from the accept request.
- Revoking an invite deletes the token; listing invites shows who invited whom.

## 5. API keys

- Format: a recognisable prefix plus random bytes: `sk_live_` + 32 random bytes base62.
  The prefix helps secret scanners (GitHub push protection) and humans identify leaks.
- Show the full key once at creation; store a hash (SHA-256 is fine for high-entropy keys) plus
  the first few characters for display (`sk_live_4f9a...`).
- Scope keys to a tenant and to permissions; record `last_used_at`; support expiry and
  revocation; allow several active keys so they can be rotated without downtime.
- Look up by hash, then compare in constant time if you also store a separate check value.
- Never accept API keys in query strings (they end up in logs); use the `Authorization` header.

```ts
export async function authenticateApiKey(header: string | null) {
  const key = header?.match(/^Bearer (sk_(live|test)_[A-Za-z0-9]{32,})$/)?.[1]
  if (!key) return null
  const record = await db.apiKey.findUnique({ where: { hash: hashToken(key) } })
  if (!record || record.revokedAt || (record.expiresAt && record.expiresAt < new Date())) return null
  void db.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
  return { tenantId: record.tenantId, scopes: record.scopes }
}
```

## 6. OAuth / OIDC with PKCE

1. Generate `state` (CSRF), `nonce` (replay) and a PKCE `code_verifier`; store them in a short-
   lived, `HttpOnly` cookie; send the `code_challenge` (S256) with the authorization request.
2. On callback: compare `state`, exchange the code with the `code_verifier`, verify the ID
   token (signature via the provider's JWKS, `iss`, `aud`, `exp`, `nonce`).
3. Find the user by provider + subject (`sub`), not by email. Link to an existing account by
   email only if the provider says the email is verified, and preferably after the user confirms.
4. Create your own session; do not use the provider's access token as your session.
5. Request the minimum scopes; store provider refresh tokens encrypted, only if you need them.

## 7. Step-up authentication

For sensitive actions (changing email or password, adding a payout account, deleting a
workspace, viewing secrets), require a recent authentication: record `authenticated_at` in the
session and require it within the last 5-15 minutes, or ask for a passkey or TOTP again.

## 8. Rate limiting

A sliding window per key in Redis (or your platform's limiter):

```ts
// fixed-window sketch with Redis INCR; use a library for production (sliding window or token bucket)
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`
  const count = await redis.incr(bucket)
  if (count === 1) await redis.expire(bucket, windowSeconds)
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
}

// login: 5 per 15 min per account, 50 per 15 min per IP
```

Key on the account identifier and the client IP separately; behind a proxy, trust only the
`X-Forwarded-For` hop your own load balancer adds.

## 9. Validating configuration at startup

```ts
// lib/env.ts
import 'server-only'
import { z } from 'zod'

const Env = z.object({
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().min(32),
  WEBHOOK_SECRET: z.string().min(24),
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

export const env = Env.parse(process.env)
```

Import `env` instead of reading `process.env` directly, so a missing or malformed secret fails at
boot with a clear message.
