import { withSupabase } from "@supabase/server"
import { env } from "../_shared/env.ts"

Deno.serve(
  withSupabase(
    { allow: "user", env },
    async (_req, ctx) => {
      return Response.json({
        demo: "demo-user-profile",
        authType: ctx.authType,
        user: ctx.user,
      })
    }
  )
)
