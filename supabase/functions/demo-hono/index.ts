import { Hono } from "hono"
import { cors } from "hono/cors"
import { supabase } from "@supabase/server/adapters/hono"
import { env } from "../_shared/env.ts"

const app = new Hono().basePath("/demo-hono")
app.use(cors())

// Public route — no credentials required
app.get("/status", supabase({ allow: "always", env }), (c) => {
  return c.json({ status: "ok", demo: "demo-hono" })
})

// Authenticated routes — valid JWT required
app.get("/me", supabase({ allow: "user", env }), (c) => {
  const { user } = c.var.supabaseContext
  return c.json({ user })
})

app.get("/protected-data", supabase({ allow: "user", env }), (c) => {
  const { user, supabase: sb } = c.var.supabaseContext
  return c.json({
    message: `Hello ${user?.email}`,
    userId: user?.id,
    hasClient: !!sb,
  })
})

Deno.serve(app.fetch)
