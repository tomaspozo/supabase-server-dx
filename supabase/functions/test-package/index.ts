import { withSupabase } from "npm:@supabase/server@0.1.0-alpha.1"

export default {
  fetch: withSupabase(
    {
      allow: ["secret", "always"],
    },
    async (_req, ctx) => {
      return Response.json({
        ok: true,
        authType: ctx.authType,
        hasUser: !!ctx.userClaims,
        hasSupabase: !!ctx.supabase,
        hasAdmin: !!ctx.supabaseAdmin,
      })
    }
  ),
}
