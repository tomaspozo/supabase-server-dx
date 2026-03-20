import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { withSupabase } from "@supabase/server/adapters/hono"

const app = new Hono().basePath("/demo-hono")
app.use(cors())

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  return c.json({ error: "Internal server error" }, 500)
})

// Public route — no credentials required
app.get("/status", withSupabase({ allow: "always" }), (c) => {
  return c.json({ status: "ok", demo: "demo-hono" })
})

// Authenticated routes — valid JWT required
app.get("/me", withSupabase({ allow: "user" }), (c) => {
  const { userClaims } = c.var.supabaseContext
  return c.json({ userClaims })
})

app.get("/protected-data", withSupabase({ allow: "user" }), (c) => {
  const { userClaims, supabase: sb } = c.var.supabaseContext
  return c.json({
    message: `Hello ${userClaims?.email}`,
    userId: userClaims?.id,
    hasClient: !!sb,
  })
})

export default app
