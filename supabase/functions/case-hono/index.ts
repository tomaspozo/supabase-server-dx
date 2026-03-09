import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { supabase } from "@supabase/server/adapters/hono"
import { env } from "../_shared/env.ts"

const app = new Hono().basePath("/case-hono")
app.use(cors())

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  return c.json({ error: "Internal server error" }, 500)
})

// Public route — no credentials required
app.get("/status", supabase({ allow: "always", env }), (c) => {
  return c.json({
    demo: "case-hono",
    route: "/status",
    authType: "always",
    serverTime: new Date().toISOString(),
  })
})

// Authenticated route — valid JWT required
app.get("/me", supabase({ allow: "user", env }), (c) => {
  const { user, authType } = c.var.supabaseContext
  return c.json({
    demo: "case-hono",
    route: "/me",
    authType,
    user,
  })
})

Deno.serve(app.fetch)
