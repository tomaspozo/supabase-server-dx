import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { withSupabase } from "npm:@supabase/server@0.1.0-alpha.1/adapters/hono"

const app = new Hono().basePath("/case-hono")
app.use(cors())

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  return c.json({ error: "Internal server error" }, 500)
})

// Public route — no credentials required
app.get("/status", withSupabase({ allow: "always" }), (c) => {
  return c.json({
    demo: "case-hono",
    route: "/status",
    authType: "always",
    serverTime: new Date().toISOString(),
  })
})

// Authenticated route — valid JWT required
app.get("/me", withSupabase({ allow: "user" }), (c) => {
  const { userClaims, authType } = c.var.supabaseContext
  return c.json({
    demo: "case-hono",
    route: "/me",
    authType,
    userClaims,
  })
})

export default app
