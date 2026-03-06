import { withSupabase } from "@supabase/server"
import { env } from "../_shared/env.ts"

Deno.serve(
  withSupabase(
    { allow: ["user", "always"], env },
    async (_req, ctx) => {
      const greeting = ctx.user
        ? `Hello, ${ctx.user.email ?? ctx.user.id}!`
        : "Hello, anonymous visitor!"

      return Response.json({
        demo: "demo-multi-auth",
        authType: ctx.authType,
        greeting,
        user: ctx.user,
      })
    }
  )
)
