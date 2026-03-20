import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase(
    {
      allow: ["secret", "always"],
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
  ),
}
