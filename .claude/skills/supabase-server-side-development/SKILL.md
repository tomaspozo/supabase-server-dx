---
name: supabase-server-side-development
description: >
  How to use the @supabase/server SDK (currently published as @supabase/edge-functions) for server-side
  Supabase integration — auth, client creation, and context injection. Use this skill whenever building
  Supabase Edge Functions, Deno server handlers, Hono routes with Supabase, or any server-side code that
  needs authenticated Supabase clients. Also use when the user mentions withSupabase, createSupabaseContext,
  verifyAuth, supabase middleware, edge function auth, or Supabase server-side patterns. If you see imports
  from @supabase/edge-functions or @supabase/server, consult this skill.
---

# @supabase/server SDK Guide

This SDK provides server-side auth, client creation, and context injection for Supabase across Deno, Cloudflare Workers, Bun, Hono, and any Web API-compatible runtime.

**Package name:** Currently `@supabase/edge-functions`, moving to `@supabase/server`.

## Two-Layer Architecture

The SDK has two layers. Layer 1 is built on Layer 2. Both produce the same `SupabaseContext`.

### Layer 1 — Declarative Wrappers (default choice)

High-level functions that handle auth, CORS, client creation, and error responses automatically. The developer declares what they need and writes only business logic.

- `withSupabase(config, handler)` — wraps a `(Request) => Response` handler
- `createSupabaseContext(request, options?)` — returns a `SupabaseContext` directly (for when you need the context but want to handle errors/responses yourself)

### Layer 2 — Composable Primitives (when you need control)

The building blocks that Layer 1 uses internally. Drop to Layer 2 when Layer 1 can't express what you need.

- `verifyAuth(request, options)` — extract credentials from request + verify
- `verifyCredentials(credentials, options)` — verify raw credentials (for SSR/cookie environments without a Request)
- `extractCredentials(request)` — pull token and apikey from headers
- `createContextClient(token?, env?)` — create RLS-scoped Supabase client
- `createAdminClient(env?)` — create admin client that bypasses RLS
- `resolveEnv(overrides?)` — read and parse environment variables

## When to Use Each Layer

### Use Layer 1 when:
- Building a single-purpose endpoint (one auth mode, one handler)
- You want automatic CORS handling
- You want automatic error responses (401, 500)
- The default `(Request, SupabaseContext) => Response` pattern fits

### Use Layer 2 when:
- Multiple routes need different auth modes in one function (e.g., MCP server)
- You need custom error response format or headers (e.g., `WWW-Authenticate`)
- You're building a framework adapter or domain-specific wrapper
- You're in an SSR environment where credentials come from cookies, not headers
- You need to control the exact order of operations

## SupabaseContext

Every path through the SDK produces this same context:

```typescript
interface SupabaseContext {
  supabase: SupabaseClient       // RLS-scoped (user token or anon)
  supabaseAdmin: SupabaseClient  // Bypasses RLS (service role key)
  user: UserIdentity | null      // Decoded user identity from JWT
  claims: JWTClaims | null       // Raw JWT claims
  authType: Allow                // Which auth mode matched
}
```

## Auth Modes (`allow` config)

| Mode | Credential | Use case |
|------|-----------|----------|
| `"user"` (default) | Valid JWT in `Authorization: Bearer` | Authenticated user endpoints |
| `"public"` | Valid publishable key in `apikey` header | Client-facing, key-validated endpoints |
| `"secret"` | Valid secret key in `apikey` header | Server-to-server, internal calls |
| `"always"` | None | Open endpoints, wrappers that handle their own auth |

**Array syntax:** `allow: ['user', 'secret']` — first match wins (not a fallback chain).

**Named keys:** `allow: 'public:web_app'` — validates against the key named `web_app` in `SUPABASE_PUBLISHABLE_KEYS`.

## Environment Variables

| Variable | Required | Format |
|----------|----------|--------|
| `SUPABASE_URL` | Yes | URL string |
| `SUPABASE_PUBLISHABLE_KEYS` | For `public` mode | JSON object: `{ "web": "pk_abc", "mobile": "pk_def" }` |
| `SUPABASE_SECRET_KEYS` | For `secret` mode, admin client | JSON object: `{ "main": "sk_abc" }` |
| `SUPABASE_JWKS` | For `user` mode | JSON string (JWKS) |

The SDK auto-detects the runtime (Deno, Node.js, Workers, Bun) for env var access.

---

## Usage Patterns

### Pattern 1: Simple Edge Function (Layer 1 — `withSupabase`)

The most common pattern. One endpoint, one auth mode.

```typescript
import { withSupabase } from '@supabase/edge-functions'

Deno.serve(
  withSupabase({ allow: 'user' }, async (req, ctx) => {
    const { data } = await ctx.supabase.from('todos').select()
    return Response.json(data)
  })
)
```

`withSupabase` handles:
- CORS preflight (OPTIONS → 204)
- Auth verification (failure → JSON error with correct status)
- CORS headers on all responses
- Client creation (both `supabase` and `supabaseAdmin`)

To disable CORS: `withSupabase({ allow: 'user', cors: false }, handler)`.

Custom CORS:
```typescript
withSupabase({
  allow: 'user',
  cors: { origins: ['https://myapp.com'], credentials: true }
}, handler)
```

### Pattern 2: Direct Context Creation (Layer 1 — `createSupabaseContext`)

When you need the context but want to handle errors and responses yourself.

```typescript
import { createSupabaseContext } from '@supabase/edge-functions'

Deno.serve(async (req) => {
  const { data: ctx, error } = await createSupabaseContext(req, { allow: 'user' })
  if (error) {
    // Custom error handling — maybe add special headers, log, etc.
    return new Response(error.message, { status: error.status })
  }

  const { data } = await ctx.supabase.from('todos').select()
  return Response.json(data)
})
```

### Pattern 3: Hono Middleware (Adapter)

For Hono applications. The adapter throws `HTTPException` on auth failure — use Hono's error handler to control the response format.

```typescript
import { Hono } from 'hono'
import { supabase } from '@supabase/edge-functions/adapters/hono'

const app = new Hono()

// Global middleware
app.use('*', supabase({ allow: 'user' }))

app.get('/todos', async (c) => {
  const { supabase: sb } = c.var.supabaseContext
  const { data } = await sb.from('todos').select()
  return c.json(data)
})

Deno.serve(app.fetch)
```

**Per-route auth** works naturally:
```typescript
app.get('/public', supabase({ allow: 'public' }), handler)
app.post('/admin', supabase({ allow: 'secret' }), handler)
app.get('/me', supabase({ allow: 'user' }), handler)
```

The Hono adapter does NOT handle CORS — use `hono/cors` for that:
```typescript
import { cors } from 'hono/cors'
app.use('*', cors())
app.use('*', supabase({ allow: 'user' }))
```

The middleware skips processing if `supabaseContext` is already set by a previous middleware.

### Pattern 4: Multi-Route Function (Layer 2)

When one function needs multiple routes with different auth. This is where Layer 2 shines.

```typescript
import {
  verifyAuth,
  createContextClient,
  createAdminClient,
} from '@supabase/edge-functions/core'

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // Public route — no auth
  if (url.pathname === '/health') {
    return Response.json({ status: 'ok' })
  }

  // Authenticated route
  const { data: auth, error } = await verifyAuth(req, { allow: 'user' })
  if (error) {
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  const supabase = createContextClient(auth.token)
  const supabaseAdmin = createAdminClient()

  const { data } = await supabase.from('todos').select()
  return Response.json(data)
})
```

### Pattern 5: Domain-Specific Wrapper (Layer 2)

Teams can build wrappers using Layer 2 primitives. Example: MCP server handler.

```typescript
import {
  verifyAuth,
  createContextClient,
  createAdminClient,
} from '@supabase/edge-functions/core'

function createMcpHandler(setupCallback) {
  return {
    fetch: async (req) => {
      const url = new URL(req.url)

      // OAuth discovery — no auth
      if (url.pathname.endsWith('/oauth-protected-resource')) {
        return Response.json({ resource: url.origin, authorization_servers: [/* ... */] })
      }

      if (req.method !== 'POST') {
        return new Response(null, { status: 405 })
      }

      // Main MCP endpoint — requires user auth
      const { data: auth, error } = await verifyAuth(req, { allow: 'user' })
      if (error) {
        return Response.json({ error: error.message }, {
          status: 401,
          headers: { 'WWW-Authenticate': 'Bearer' },
        })
      }

      const supabase = createContextClient(auth.token)
      const supabaseAdmin = createAdminClient()

      const server = setupCallback({ supabase, supabaseAdmin, user: auth.user })
      return server.handle(req)
    },
  }
}
```

### Pattern 6: Webhook Verification

For Supabase webhooks (database webhooks, auth hooks):

```typescript
import { withSupabase } from '@supabase/edge-functions'
import { verifyWebhookSignature } from '@supabase/edge-functions/wrappers'

Deno.serve(
  withSupabase({ allow: 'always' }, async (req, ctx) => {
    const payload = await req.text()
    const signature = req.headers.get('x-supabase-signature')!

    const valid = await verifyWebhookSignature(payload, signature, Deno.env.get('WEBHOOK_SECRET')!)
    if (!valid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(payload)
    // Process webhook with ctx.supabaseAdmin...
    return Response.json({ received: true })
  })
)
```

Note `allow: 'always'` — the webhook verifies its own auth via signature, not via the standard auth modes.

## Import Paths

| Import | What you get |
|--------|-------------|
| `@supabase/edge-functions` | `withSupabase`, `createSupabaseContext` |
| `@supabase/edge-functions/core` | `verifyAuth`, `verifyCredentials`, `extractCredentials`, `createContextClient`, `createAdminClient`, `resolveEnv` |
| `@supabase/edge-functions/wrappers` | `verifyWebhookSignature` |
| `@supabase/edge-functions/adapters/hono` | `supabase` (Hono middleware) |

In Deno, use `npm:` prefix: `import { withSupabase } from 'npm:@supabase/edge-functions'`

## Error Handling

All functions that can fail return `{ data, error }` — consistent with supabase-js. Never throws (except the Hono adapter which throws `HTTPException`).

Error types:
- **`AuthError`** — auth verification failed (status 401) or env resolution failed during auth (status 500)
- **`EnvError`** — environment variable missing or malformed (status 500)

Both have `.message`, `.status`, and `.code` properties.

## Key Design Decisions

1. **`supabase` client is always RLS-scoped.** If a user token is present, queries run as that user. If not (e.g., `allow: 'always'`), queries run as anon.

2. **`supabaseAdmin` is always available.** Every context includes an admin client, regardless of auth mode. Use it for operations that need to bypass RLS.

3. **CORS is Layer 1 only.** `withSupabase` handles CORS. The Hono adapter and Layer 2 primitives do not — use the framework's CORS middleware instead.

4. **Array `allow` is first-match, not fallback.** `allow: ['user', 'secret']` means "accept either a valid JWT or a valid secret key" — it tries each mode and succeeds on the first match.

5. **Named keys use colon syntax.** `allow: 'public:web_app'` validates against the specific key named `web_app`, not all publishable keys.
