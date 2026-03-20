import { withSupabase } from "@supabase/server"

Deno.serve(
  withSupabase(
    {
      allow: ["secret", "always"],
      env: {
        publishableKeys: { "default": Deno.env.get("SB_PUBLISHABLE_KEY")! },
        secretKeys: { "default": Deno.env.get("SB_SECRET_KEY")! },
      },
    },
    async (_req, ctx) => {
      return Response.json({
        ok: true,
        authType: ctx.authType,
        hasUser: !!ctx.user,
        hasSupabase: !!ctx.supabase,
        hasAdmin: !!ctx.supabaseAdmin,
      })
    }
  )
)
