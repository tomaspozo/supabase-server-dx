export interface CaseDemo {
  name: string
  title: string
  type: "ef" | "hono" | "next"
  authMode: string
  description: string
  snippet: string
  /** Edge function path (for ef/hono types) */
  path?: string
  /** Next.js API route path (for next type) */
  apiPath?: string
}

export const caseDemos: CaseDemo[] = [
  {
    name: "case-ef",
    title: "Edge Function",
    type: "ef",
    authMode: "user",
    description:
      "A single Deno edge function protected with withSupabase. Requires a valid JWT and returns your identity.",
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
    name: "case-hono-status",
    title: "Hono — Public Route",
    type: "hono",
    authMode: "always",
    description:
      "A public Hono route using per-route supabase() middleware. No credentials required.",
    path: "case-hono/status",
    snippet: `import { Hono } from "hono"
import { supabase } from "@supabase/server/adapters/hono"

const app = new Hono().basePath("/case-hono")

// Per-route middleware — no credentials required
app.get("/status", supabase({ allow: "always" }), (c) => {
  return c.json({ status: "ok", serverTime: new Date().toISOString() })
})

Deno.serve(app.fetch)`,
  },
  {
    name: "case-hono-me",
    title: "Hono — User Route",
    type: "hono",
    authMode: "user",
    description:
      "An authenticated Hono route. Requires a valid JWT and returns user info from context.",
    path: "case-hono/me",
    snippet: `import { Hono } from "hono"
import { supabase } from "@supabase/server/adapters/hono"

const app = new Hono().basePath("/case-hono")

// Per-route middleware — valid JWT required
app.get("/me", supabase({ allow: "user" }), (c) => {
  const { user } = c.var.supabaseContext
  return c.json({ user })
})

Deno.serve(app.fetch)`,
  },
  {
    name: "case-next",
    title: "Next.js API Route",
    type: "next",
    authMode: "user",
    description:
      "A Next.js API route using createSupabaseContext. Reads the session from cookies and returns auth details.",
    apiPath: "/api/case-next",
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
  })
}`,
  },
]
