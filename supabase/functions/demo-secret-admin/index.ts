import { withSupabase } from "@supabase/server"
import { env } from "../_shared/env.ts"

Deno.serve(
  withSupabase(
    { allow: "secret", env },
    async (_req, ctx) => {
      const { data, error } = await ctx.supabaseAdmin.auth.admin.listUsers({
        perPage: 1,
        page: 1,
      })

      return Response.json({
        demo: "demo-secret-admin",
        authType: ctx.authType,
        totalUsers: data?.users?.length ?? null,
        error: error?.message ?? null,
      })
    }
  )
)
