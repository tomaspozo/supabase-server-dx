import { withSupabase } from "npm:@supabase/server@0.1.0-alpha.1"

export default {
  fetch: withSupabase(
    { allow: "always" },
    async (_req, ctx) => {
      return Response.json({
        demo: "demo-public-status",
        authType: ctx.authType,
        serverTime: new Date().toISOString(),
        runtime: `Deno ${Deno.version.deno}`,
        userClaims: ctx.userClaims,
      })
    }
  ),
}
