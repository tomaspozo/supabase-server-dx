export interface Demo {
  name: string
  title: string
  authMode: string
  description: string
  snippet: string
  useProxy?: boolean
  path?: string
}

export interface TestRouteDemo {
  name: string
  title: string
  authMode: string
  routeType: "api" | "page"
  description: string
  snippet: string
  path: string
}

export const edgeFunctionDemos: Demo[] = [
  {
    name: "demo-user-profile",
    title: "User Profile",
    authMode: "user",
    description:
      "Requires a valid JWT. Returns your identity from the Supabase context. Uses withSupabase.",
    snippet: `import { withSupabase } from "@supabase/server"

Deno.serve(
  withSupabase({ allow: "user" }, async (_req, ctx) => {
    return Response.json({
      authType: ctx.authType,
      user: ctx.user,
    })
  })
)`,
  },
  {
    name: "demo-public-status",
    title: "Public Status",
    authMode: "always",
    description:
      "Fully public, no auth needed. Returns server time and Deno runtime info. Uses withSupabase.",
    snippet: `import { withSupabase } from "@supabase/server"

Deno.serve(
  withSupabase({ allow: "always" }, async (_req, ctx) => {
    return Response.json({
      authType: ctx.authType,
      serverTime: new Date().toISOString(),
      runtime: \`Deno \${Deno.version.deno}\`,
    })
  })
)`,
  },
  {
    name: "demo-secret-admin",
    title: "Admin (Secret Key)",
    authMode: "secret",
    description:
      "Requires the secret API key. Lists users via admin client. Invoked through a server-side proxy.",
    useProxy: true,
    snippet: `import { withSupabase } from "@supabase/server"

Deno.serve(
  withSupabase({ allow: "secret" }, async (_req, ctx) => {
    const { data } = await ctx.supabaseAdmin
      .auth.admin.listUsers({ perPage: 1, page: 1 })
    return Response.json({
      authType: ctx.authType,
      totalUsers: data?.users?.length ?? null,
    })
  })
)

// Invoked via Next.js proxy: /api/demo-secret-admin
// The proxy invokes with supabaseAdmin`,
  },
  {
    name: "demo-multi-auth",
    title: "Multi-Auth",
    authMode: "user, always",
    description:
      'Accepts both authenticated and anonymous requests. Returns a personalized or generic greeting. Uses withSupabase.',
    snippet: `import { withSupabase } from "@supabase/server"

Deno.serve(
  withSupabase({ allow: ["user", "always"] }, async (_req, ctx) => {
    const greeting = ctx.user
      ? \`Hello, \${ctx.user.email ?? ctx.user.id}!\`
      : "Hello, anonymous visitor!"
    return Response.json({ authType: ctx.authType, greeting })
  })
)`,
  },
  {
    name: "demo-context-primitive",
    title: "Context Primitive",
    authMode: "user",
    description:
      "Same as User Profile but uses createSupabaseContext directly with manual CORS and error handling.",
    snippet: `import {
  createSupabaseContext,
  buildCorsHeaders,
  addCorsHeaders,
} from "@supabase/server"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: buildCorsHeaders() })

  const { data: ctx, error } = await createSupabaseContext(req, {
    allow: "user",
  })

  if (error)
    return addCorsHeaders(
      Response.json({ error: error.message }, { status: error.status })
    )

  return addCorsHeaders(
    Response.json({ authType: ctx.authType, user: ctx.user })
  )
})`,
  },
]

export const honoDemos: Demo[] = [
  {
    name: "demo-hono-status",
    path: "demo-hono/status",
    title: "Hono Public Route",
    authMode: "always",
    description:
      "Public route using the Hono adapter. No credentials required — returns a simple status check.",
    snippet: `import { Hono } from "hono"
import { cors } from "hono/cors"
import { supabase } from "@supabase/server/adapters/hono"

const app = new Hono().basePath("/demo-hono")
app.use(cors())

// Per-route middleware — no credentials required
app.get("/status", supabase({ allow: "always" }), (c) => {
  return c.json({ status: "ok", demo: "demo-hono" })
})

Deno.serve(app.fetch)`,
  },
  {
    name: "demo-hono-me",
    path: "demo-hono/me",
    title: "Hono User Route",
    authMode: "user",
    description:
      "Authenticated route using the Hono adapter. Requires a valid JWT and returns user info from c.var.supabase.",
    snippet: `import { Hono } from "hono"
import { cors } from "hono/cors"
import { supabase } from "@supabase/server/adapters/hono"

const app = new Hono().basePath("/demo-hono")
app.use(cors())

// Per-route middleware — valid JWT required
app.get("/me", supabase({ allow: "user" }), (c) => {
  const { user } = c.var.supabase
  return c.json({ user })
})

Deno.serve(app.fetch)`,
  },
]

export const testRouteDemos: TestRouteDemo[] = [
  {
    name: "test-context-public",
    title: "Public Context",
    authMode: "always",
    routeType: "api",
    description:
      "Public API route using createSupabaseContext. Returns auth type, client flags, and user info without requiring authentication.",
    path: "/api/test-context-public",
    snippet: `import { createSupabaseContext } from "@/lib/supabase/context"

export async function GET() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "always" })
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
  return Response.json({
    ok: true,
    authType: ctx.authType,
    hasSupabase: !!ctx.supabase,
    hasAdmin: !!ctx.supabaseAdmin,
    user: ctx.user,
  })
}`,
  },
  {
    name: "test-context",
    title: "User Context",
    authMode: "user",
    routeType: "api",
    description:
      "Authenticated API route. Requires a valid session and returns auth type, user, claims, and client flags.",
    path: "/api/test-context",
    snippet: `import { createSupabaseContext } from "@/lib/supabase/context"

export async function GET() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "user" })
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 401 })
  }
  return Response.json({
    ok: true,
    authType: ctx.authType,
    user: ctx.user,
    claims: ctx.claims,
    hasSupabase: !!ctx.supabase,
    hasAdmin: !!ctx.supabaseAdmin,
  })
}`,
  },
  {
    name: "test-context-page",
    title: "User Context (Page)",
    authMode: "user",
    routeType: "page",
    description:
      "Server Component page using createSupabaseContext. Renders the context as JSON or shows an auth error. Opens in a new tab.",
    path: "/test-context",
    snippet: `import { createSupabaseContext } from "@/lib/supabase/context"

async function ContextResult() {
  const { data: ctx, error } = await createSupabaseContext({ allow: "user" })
  if (error) {
    return <p>Authentication required. Sign in to view context.</p>
  }
  return (
    <pre>
      {JSON.stringify(
        { authType: ctx.authType, user: ctx.user, claims: ctx.claims },
        null, 2
      )}
    </pre>
  )
}`,
  },
]
