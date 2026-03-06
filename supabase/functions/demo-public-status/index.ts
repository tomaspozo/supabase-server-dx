import { withSupabase } from "@supabase/server"
import { env } from "../_shared/env.ts"

Deno.serve(
  withSupabase(
    { allow: "always", env },
    async (_req, ctx) => {
      return Response.json({
        demo: "demo-public-status",
        authType: ctx.authType,
        serverTime: new Date().toISOString(),
        runtime: `Deno ${Deno.version.deno}`,
        user: ctx.user,
      })
    }
  )
)
