import { withSupabase } from "@supabase/server"

Deno.serve(
  withSupabase(
    { allow: "secret" },
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
